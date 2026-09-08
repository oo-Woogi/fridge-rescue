// API 서버 주소를 환경변수에서 가져옵니다.
// 로컬: http://127.0.0.1:8000
// 배포: https://fridge-rescue.onrender.com
const API_URL = import.meta.env.VITE_API_URL;

// API 버전 경로입니다.
const BASE_URL = "/v1";

// 로그인 토큰을 저장할 키입니다.
const TOKEN_KEY = "fr_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request(
  path,
  { method = "GET", body, auth = true, query } = {},
) {
  // Render Django 주소 + /v1 API 경로를 합칩니다.
  const url = new URL(`${BASE_URL}${path}`, API_URL);

  // GET 요청의 query parameter를 추가합니다.
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }

  const headers = {
    "Content-Type": "application/json; charset=utf-8",
  };

  // 인증이 필요한 요청이면 JWT 토큰을 추가합니다.
  if (auth) {
    const token = getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  // 완성된 Render API 주소로 요청합니다.
  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return null;
  }

  const json = await response.json().catch(() => null);

  if (!response.ok || !json || json.success === false) {
    const error = json?.error || {};

    throw new ApiError(
      error.code || "UNKNOWN_ERROR",
      error.message || "요청 처리 중 오류가 발생했어요.",
      response.status,
    );
  }

  return json.data;
}

export const api = {
  get: (path, options) =>
    request(path, {
      ...options,
      method: "GET",
    }),

  post: (path, body, options) =>
    request(path, {
      ...options,
      method: "POST",
      body,
    }),

  patch: (path, body, options) =>
    request(path, {
      ...options,
      method: "PATCH",
      body,
    }),

  delete: (path, body, options) =>
    request(path, {
      ...options,
      method: "DELETE",
      body,
    }),
};