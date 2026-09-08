// API명세서.md 1.2절: Base URL은 /v1, 응답 포맷은 {success, data} / {success:false, error}.
// 개발 환경에서는 vite.config.js의 proxy 설정으로 /v1 요청을 Django(127.0.0.1:8000)로 전달한다.
const BASE_URL = "/v1";
const TOKEN_KEY = "fr_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request(path, { method = "GET", body, auth = true, query } = {}) {
  const url = new URL(BASE_URL + path, window.location.origin);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
    });
  }

  const headers = { "Content-Type": "application/json; charset=utf-8" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url.pathname + url.search, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.success === false) {
    const error = json?.error || {};
    throw new ApiError(error.code || "UNKNOWN_ERROR", error.message || "요청 처리 중 오류가 발생했어요.", res.status);
  }
  return json.data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  delete: (path, body, opts) => request(path, { ...opts, method: "DELETE", body }),
};
