// src/components/layout/Layout.jsx
//
// Wraps every page with the shared Navbar/Footer, so individual pages
// only ever contain their own unique content — no page re-imports or
// re-renders the nav/footer itself.

import Navbar from "./Navbar";
import Footer from "./Footer";
import EmergencyNoticeBanner from "../emergency/EmergencyNoticeBanner";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <EmergencyNoticeBanner />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}