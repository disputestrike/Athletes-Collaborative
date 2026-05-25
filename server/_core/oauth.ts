import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function redirectWithError(res: Response, code: string) {
  res.redirect(302, `/?auth_error=${encodeURIComponent(code)}`);
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/auth/google", async (req: Request, res: Response) => {
    try {
      const loginUrl = await sdk.getGoogleAuthorizationUrl(
        req,
        getQueryParam(req, "returnTo")
      );
      res.redirect(302, loginUrl);
    } catch (error) {
      console.error("[OAuth] Google login failed", error);
      redirectWithError(res, "google_oauth_not_configured");
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const { userInfo, returnTo } = await sdk.exchangeGoogleCodeForUser(
        req,
        code,
        state
      );

      await sdk.syncGoogleUser(userInfo);

      const sessionToken = await sdk.createSessionToken(
        {
          openId: userInfo.openId,
          name: userInfo.name || "",
          email: userInfo.email,
          avatarUrl: userInfo.avatarUrl,
        },
        { expiresInMs: ONE_YEAR_MS }
      );

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.redirect(302, returnTo);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      redirectWithError(res, "google_oauth_failed");
    }
  });
}
