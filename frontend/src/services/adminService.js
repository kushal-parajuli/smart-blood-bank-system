// src/services/adminService.js
// Client API service for administrative operations, verification queues, and system telemetry.

import api from "./api";

export async function getSystemStats() {
  const res = await api.get("/admin/stats");
  return res.data;
}

export async function getUnverifiedBloodBanks(status = "pending") {
  const res = await api.get(`/admin/blood-banks/pending?status=${status}`);
  return res.data;
}

export async function verifyBloodBank(id) {
  const res = await api.put(`/admin/blood-banks/${id}/verify`);
  return res.data;
}

export async function rejectBloodBank(id, reason = "") {
  const res = await api.put(`/admin/blood-banks/${id}/reject`, { reason });
  return res.data;
}

export async function getAllDonors() {
  const res = await api.get("/admin/donors");
  return res.data;
}

export async function getUnverifiedDonors() {
  const res = await api.get("/admin/donors/pending");
  return res.data;
}

export async function verifyDonor(id) {
  const res = await api.put(`/admin/donors/${id}/verify`);
  return res.data;
}

export async function getAllUsers() {
  const res = await api.get("/admin/users");
  return res.data;
}

export async function suspendUser(id) {
  const res = await api.put(`/admin/users/${id}/suspend`);
  return res.data;
}

export async function unsuspendUser(id) {
  const res = await api.put(`/admin/users/${id}/unsuspend`);
  return res.data;
}
