// src/services/donationService.js

import api from "./api";

export async function getMyDonations() {
  const res = await api.get("/donations/me");
  return res.data;
}