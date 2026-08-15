// src/services/requestService.js

import api from "./api";

export async function createRequest(data) {
  const res = await api.post("/requests", data);
  return res.data;
}

export async function getMyRequests() {
  const res = await api.get("/requests/me");
  return res.data;
}

export async function assignBank(requestId, bloodBankId) {
  const res = await api.patch(`/requests/${requestId}/assign-bank`, { bloodBankId });
  return res.data;
}

export async function cancelRequest(requestId) {
  const res = await api.patch(`/requests/${requestId}/cancel`);
  return res.data;
}

export async function getBankIncomingRequests(status) {
  const res = await api.get("/requests/bank/incoming", { params: status ? { status } : {} });
  return res.data;
}

export async function updateRequestStatus(requestId, status) {
  const res = await api.put(`/requests/${requestId}/status`, { status });
  return res.data;
}