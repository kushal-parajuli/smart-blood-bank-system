// src/services/inventoryService.js

import api from "./api";

/**
 * @param {{bloodGroup: string, city?: string}} params
 */
export async function searchAvailability({ bloodGroup, city }) {
  // Using axios's `params` object (not a manually built query string) —
  // axios URL-encodes values automatically, so "O+" is sent correctly
  // without the %2B issue we ran into testing this same endpoint in
  // Postman earlier. This is exactly the "becomes automatic" case
  // mentioned back then.
  const res = await api.get("/inventory/search", { params: { bloodGroup, city } });
  return res.data;
}

export async function getMyInventory() {
  const res = await api.get("/inventory/me");
  return res.data;
}

export async function addInventoryBatch(data) {
  const res = await api.post("/inventory", data);
  return res.data;
}