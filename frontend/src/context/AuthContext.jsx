// src/context/AuthContext.jsx
//
// One source of truth for "who is logged in" across the whole app.
// Any component can call useAuth() to read the current user or trigger
// login/logout — nobody reaches into localStorage directly except this file.

import { createContext, useContext, useState, useEffect } from "react";
import { registerUser, loginUser, updateProfile as updateProfileApi } from "../services/authService";
import { registerBloodBank as registerBloodBankApi } from "../services/bloodBankService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, restore whatever was saved from a previous session —
  // this is what makes a refresh not immediately log the person out.
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  function persistSession(data) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  }

  async function login(credentials) {
    const data = await loginUser(credentials);
    persistSession(data);
    return data.user;
  }

  async function register(formData) {
    const data = await registerUser(formData);
    persistSession(data);
    return data.user;
  }

  async function registerBloodBank(formData) {
    const data = await registerBloodBankApi(formData);
    persistSession(data);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  async function updateProfile(data) {
    const result = await updateProfileApi(data);
    // Merge rather than replace — the update response includes fields
    // like created_at/role that the login response's slim `user` object
    // doesn't, but we still want to keep whatever's already there.
    const merged = { ...user, ...result.user };
    localStorage.setItem("user", JSON.stringify(merged));
    setUser(merged);
    return merged;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, registerBloodBank, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}