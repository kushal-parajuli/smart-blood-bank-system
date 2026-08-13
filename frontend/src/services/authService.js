// src/services/authService.js
//
// Thin wrapper around the auth endpoints. Pages never call `api` directly
// for auth — they go through these functions, so the request shape only
// has to be right in one place.

import api from "./api";

export async function registerUser(data) {
  const res = await api.post("/auth/register", data);
  return res.data;
}

export async function loginUser(data) {
  const res = await api.post("/auth/login", data);
  return res.data;
}

export async function fetchProfile() {
  const res = await api.get("/auth/profile");
  return res.data;
}   