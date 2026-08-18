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
import SearchBlood from "../pages/SearchBlood";
import RequestBlood from "../pages/RequestBlood";
import BloodBankRegister from "../pages/BloodBankRegister";
import BankDashboard from "../pages/bloodbank/BankDashboard";
import BookAppointment from "../pages/BookAppointment";
import UserDashboard from "../pages/user/UserDashboard";

export default function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/blood-bank" element={<BloodBankRegister />} />
        <Route path="/search" element={<SearchBlood />} />
        <Route
          path="/bank/dashboard"
          element={
            <ProtectedRoute roles={["blood_bank"]}>
              <BankDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor/register"
          element={
            <ProtectedRoute>
              <DonorRegister />
            </ProtectedRoute>
          }
        />
        <Route
          path="/request"
          element={
            <ProtectedRoute>
              <RequestBlood />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donate"
          element={
            <ProtectedRoute>
              <BookAppointment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={["user"]}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        {/* Future routes: admin dashboard */}
      </Routes>
    </Layout>
  );
}