// src/services/emergencyNoticeService.js
// Client API service for emergency blood notices.

import api from "./api";

/**
 * Fetches all currently active emergency blood notices for the global banner.
 * Ordered by emergency level: Red > Yellow > Green, then newest published first.
 */
export async function getActiveEmergencyNotices() {
  const res = await api.get("/emergency-notices/active");
  return res.data;
}

/**
 * Fetches emergency notices for administration and blood bank dashboards.
 * @param {Object} params - { status: 'active' | 'cancelled' | 'expired' | 'all', bloodBankId }
 */
export async function getEmergencyNotices(params = {}) {
  const res = await api.get("/emergency-notices", { params });
  return res.data;
}

/**
 * Fetches details of a specific emergency notice by ID.
 */
export async function getEmergencyNoticeById(id) {
  const res = await api.get(`/emergency-notices/${id}`);
  return res.data;
}

/**
 * Publishes a new emergency notice.
 * Allowed roles: admin, blood_bank.
 */
export async function createEmergencyNotice(data) {
  const res = await api.post("/emergency-notices", data);
  return res.data;
}

/**
 * Cancels an active emergency notice before its scheduled expiration.
 * Allowed roles: admin, blood bank owner.
 */
export async function cancelEmergencyNotice(id) {
  const res = await patchCancelNotice(id);
  return res;
}

async function patchCancelNotice(id) {
  const res = await api.patch(`/emergency-notices/${id}/cancel`);
  return res.data;
}
