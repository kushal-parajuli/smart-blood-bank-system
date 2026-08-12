// src/services/api.js
//
// One shared axios instance for the whole app, rather than importing
// axios directly in every component and re-typing the base URL and
// auth-header logic each time. Every service module (authService,
// requestService, etc. — built as we wire up each page) will import
// this instead of axios directly.

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Automatically attaches the JWT (once login is wired up and the token
// is stored) to every outgoing request, so individual calls never need
// to manually set the Authorization header themselves.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;