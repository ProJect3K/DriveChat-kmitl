const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const DEFAULT_WS_BASE_URL = "ws://127.0.0.1:8000";

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

export const API_BASE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL
);

export const WS_BASE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_WS_BASE_URL || DEFAULT_WS_BASE_URL
);

export const buildApiUrl = (path) => `${API_BASE_URL}${path}`;

export const buildWsUrl = (path) => `${WS_BASE_URL}${path}`;
