import express, { type Express } from "express";
import path from "node:path";

const UPLOAD_ROOT = path.resolve(
  process.cwd(),
  process.env.UPLOAD_DIR ?? ".data/uploads"
);

export function registerStorageProxy(app: Express) {
  app.use(
    "/uploads",
    express.static(UPLOAD_ROOT, {
      fallthrough: false,
      immutable: true,
      maxAge: "1h",
    })
  );
}
