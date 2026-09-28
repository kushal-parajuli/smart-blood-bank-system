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

export async function updateProfile(data) {
  const res = await api.put("/auth/profile", data);
  return res.data;
}

export async function changePassword(data) {
  const res = await api.put("/auth/password", data);
  return res.data;
}

export async function uploadProfilePicture(file) {
  const formData = new FormData();
  formData.append("picture", file);
  const res = await api.post("/auth/profile/picture", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export async function removeProfilePicture() {
  const res = await api.delete("/auth/profile/picture");
  return res.data;
}