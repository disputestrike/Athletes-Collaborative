import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
};

type OAuthStatePayload = {
  type: "google_oauth_state";
  returnTo: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  id_token?: string;
  scope?: string;
  token_type?: string;
};

type GoogleUserInfo = {
  openId: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  loginMethod: "google";
};

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function sanitizeReturnTo(returnTo: unknown): string {
  if (typeof returnTo !== "string" || returnTo.length === 0) return "/";
  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) return "/";
  return returnTo;
}

class SDKServer {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    if (!ENV.cookieSecret) {
      throw new Error("JWT_SECRET is required for authentication");
    }
    return new TextEncoder().encode(ENV.cookieSecret);
  }

  private getBaseUrl(req: Request): string {
    if (ENV.appBaseUrl) return ENV.appBaseUrl.replace(/\/+$/, "");

    const forwardedProto = firstHeaderValue(req.headers["x-forwarded-proto"]);
    const forwardedHost = firstHeaderValue(req.headers["x-forwarded-host"]);
    const protocol = forwardedProto?.split(",")[0]?.trim() || req.protocol || "http";
    const host = forwardedHost?.split(",")[0]?.trim() || req.headers.host;

    if (!host) {
      throw new Error("Unable to determine application host for OAuth redirect");
    }

    return `${protocol}://${host}`;
  }

  getGoogleRedirectUri(req: Request): string {
    return ENV.googleRedirectUri || `${this.getBaseUrl(req)}/api/oauth/callback`;
  }

  private assertGoogleConfig() {
    if (!ENV.googleClientId || !ENV.googleClientSecret) {
      throw new Error(
        "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
      );
    }
  }

  private async signOAuthState(returnTo: string): Promise<string> {
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      type: "google_oauth_state",
      returnTo: sanitizeReturnTo(returnTo),
    } satisfies OAuthStatePayload)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime("10m")
      .sign(secretKey);
  }

  private async verifyOAuthState(state: string): Promise<OAuthStatePayload> {
    const secretKey = this.getSessionSecret();
    const { payload } = await jwtVerify(state, secretKey, {
      algorithms: ["HS256"],
    });

    if (payload.type !== "google_oauth_state") {
      throw new Error("Invalid OAuth state");
    }

    return {
      type: "google_oauth_state",
      returnTo: sanitizeReturnTo(payload.returnTo),
    };
  }

  async getGoogleAuthorizationUrl(req: Request, returnTo: unknown): Promise<string> {
    this.assertGoogleConfig();

    const state = await this.signOAuthState(sanitizeReturnTo(returnTo));
    const url = new URL(GOOGLE_AUTH_URL);

    url.searchParams.set("client_id", ENV.googleClientId);
    url.searchParams.set("redirect_uri", this.getGoogleRedirectUri(req));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "select_account");

    return url.toString();
  }

  async exchangeGoogleCodeForUser(
    req: Request,
    code: string,
    state: string
  ): Promise<{ userInfo: GoogleUserInfo; returnTo: string }> {
    this.assertGoogleConfig();

    const verifiedState = await this.verifyOAuthState(state);
    const redirectUri = this.getGoogleRedirectUri(req);
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: ENV.googleClientId,
        client_secret: ENV.googleClientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const detail = await tokenResponse.text().catch(() => "");
      throw new Error(
        `Google token exchange failed (${tokenResponse.status} ${tokenResponse.statusText})${
          detail ? `: ${detail}` : ""
        }`
      );
    }

    const tokens = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokens.id_token) {
      throw new Error("Google token response did not include an id_token");
    }

    const { payload } = await jwtVerify(tokens.id_token, GOOGLE_JWKS, {
      audience: ENV.googleClientId,
      issuer: ["https://accounts.google.com", "accounts.google.com"],
    });

    if (!isNonEmptyString(payload.sub)) {
      throw new Error("Google id_token did not include a subject");
    }

    if (payload.email_verified !== true) {
      throw new Error("Google account email is not verified");
    }

    const email = typeof payload.email === "string" ? payload.email : null;
    const name = typeof payload.name === "string" ? payload.name : null;
    const avatarUrl = typeof payload.picture === "string" ? payload.picture : null;

    return {
      userInfo: {
        openId: `google:${payload.sub}`,
        name,
        email,
        avatarUrl,
        loginMethod: "google",
      },
      returnTo: verifiedState.returnTo,
    };
  }

  private getOwnerRole(userInfo: Pick<GoogleUserInfo, "openId" | "email">) {
    if (ENV.ownerOpenId && userInfo.openId === ENV.ownerOpenId) return "owner";
    if (
      ENV.ownerEmail &&
      userInfo.email &&
      userInfo.email.toLowerCase() === ENV.ownerEmail.toLowerCase()
    ) {
      return "owner";
    }
    return undefined;
  }

  async createSessionToken(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    return this.signSession(payload, options);
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      name: payload.name,
      email: payload.email ?? null,
      avatarUrl: payload.avatarUrl ?? null,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<SessionPayload | null> {
    if (!cookieValue) {
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, name, email, avatarUrl } = payload as Record<
        string,
        unknown
      >;

      if (!isNonEmptyString(openId) || typeof name !== "string") {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      return {
        openId,
        name,
        email: typeof email === "string" ? email : null,
        avatarUrl: typeof avatarUrl === "string" ? avatarUrl : null,
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  async syncGoogleUser(userInfo: GoogleUserInfo) {
    await db.upsertUser({
      openId: userInfo.openId,
      name: userInfo.name,
      email: userInfo.email,
      avatarUrl: userInfo.avatarUrl,
      loginMethod: userInfo.loginMethod,
      role: this.getOwnerRole(userInfo),
      lastSignedIn: new Date(),
    });
  }

  async authenticateRequest(req: Request): Promise<AuthenticatedUser> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    let user = await db.getUserByOpenId(session.openId);
    const signedInAt = new Date();

    if (!user) {
      await db.upsertUser({
        openId: session.openId,
        name: session.name || null,
        email: session.email ?? null,
        avatarUrl: session.avatarUrl ?? null,
        loginMethod: "google",
        role: this.getOwnerRole({
          openId: session.openId,
          email: session.email ?? null,
        }),
        lastSignedIn: signedInAt,
      });
      user = await db.getUserByOpenId(session.openId);
    } else {
      await db.upsertUser({
        openId: user.openId,
        name: session.name || user.name,
        email: session.email ?? user.email,
        avatarUrl: session.avatarUrl ?? user.avatarUrl,
        loginMethod: "google",
        lastSignedIn: signedInAt,
      });
    }

    if (!user) {
      throw ForbiddenError("User not found");
    }

    return user;
  }
}

export type AuthenticatedUser = User;

export const sdk = new SDKServer();
