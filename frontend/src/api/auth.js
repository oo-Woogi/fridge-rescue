import { api } from "./client";

export const signup = (payload) =>
  api.post("/auth/signup/", payload, { auth: false });

export const login = (payload) =>
  api.post("/auth/login/", payload, { auth: false });

export const logout = () =>
  api.post("/auth/logout/");

export const fetchMe = () =>
  api.get("/users/me");

export const updateMe = (payload) =>
  api.patch("/users/me", payload);
