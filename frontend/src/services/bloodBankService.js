// src/services/bloodBankService.js

import api from "./api";

export async function registerBloodBank(data) {
  const res = await api.post("/blood-banks/register", data);
  return res.data;
}

export async function fetchMyBloodBankProfile() {
  const res = await api.get("/blood-banks/me");
  return res.data;
}

export async function listBloodBanks() {
  const res = await api.get("/blood-banks");
  return res.data;
}