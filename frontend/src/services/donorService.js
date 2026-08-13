// src/services/donorService.js

import api from "./api";

export async function registerDonor(data) {
  const res = await api.post("/donors/register", data);
  return res.data;
}

export async function fetchMyDonorProfile() {
  const res = await api.get("/donors/me");
  return res.data;
}