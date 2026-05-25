export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const getLoginUrl = () => {
  if (typeof window === "undefined") {
    return "/api/auth/google?returnTo=/";
  }

  const isLocalDev =
    import.meta.env.DEV &&
    ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  if (isLocalDev) {
    return "/portal";
  }

  const currentPath =
    `${window.location.pathname}${window.location.search}`;
  const url = new URL("/api/auth/google", window.location.origin);

  url.searchParams.set("returnTo", currentPath || "/");

  return url.toString();
};
