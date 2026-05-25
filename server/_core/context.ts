import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { ENV } from "./env";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  if (!user && !ENV.isProduction) {
    user = {
      id: 1,
      openId: "local-test-owner",
      name: "Local Test Owner",
      email: ENV.ownerEmail || "owner@athletescollaborative.local",
      loginMethod: "local-dev",
      role: "owner",
      avatarUrl: null,
      isActive: true,
      lastSignedIn: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
