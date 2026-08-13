// src/routes/AppRoutes.jsx
//
// Central route table. Only "/" exists right now — Login, Register,
// and the role dashboards get added here one at a time as we build
// each page, rather than stubbing them all out empty upfront.

import { Routes, Route } from "react-router-dom";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "../components/common/ProtectedRoute";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import DonorRegister from "../pages/DonorRegister";

export default function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/donor/register"
          element={
            <ProtectedRoute>
              <DonorRegister />
            </ProtectedRoute>
          }
        />
        {/* Future routes: booking, search, requests, dashboards */}
      </Routes>
    </Layout>
  );
}