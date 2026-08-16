// src/services/appointmentService.js

import api from "./api";

export async function bookAppointment(data) {
  const res = await api.post("/appointments", data);
  return res.data;
}

export async function getMyAppointments() {
  const res = await api.get("/appointments/me");
  return res.data;
}

export async function cancelAppointment(appointmentId) {
  const res = await api.patch(`/appointments/${appointmentId}/cancel`);
  return res.data;
}