import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_ROOT = path.resolve(
  process.cwd(),
  process.env.UPLOAD_DIR ?? ".data/uploads"
);

function normalizeKey(relKey: string): string {
  return relKey
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .split("/")
    .filter(part => part && part !== "." && part !== "..")
    .join("/");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function resolveUploadPath(key: string): string {
  const fullPath = path.resolve(UPLOAD_ROOT, key);
  const relative = path.relative(UPLOAD_ROOT, fullPath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid storage key");
  }

  return fullPath;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const fullPath = resolveUploadPath(key);

  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, data);

  return { key, url: `/uploads/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/uploads/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const { url } = await storageGet(relKey);
  return url;
}
