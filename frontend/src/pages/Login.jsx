// src/pages/Login.jsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Droplet, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert } from "../components/ui/alert";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  async function onSubmit(formData) {
    setServerError("");
    try {
      const loggedInUser = await login(formData);
      navigate(loggedInUser.role === "blood_bank" ? "/bank/dashboard" : "/");
    } catch (err) {
      setServerError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-73px)] items-center justify-center px-5 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--secondary)]">
            <Droplet size={22} className="fill-[var(--primary)] text-[var(--primary)]" />
          </div>
          <h1 className="mt-4 font-[var(--font-display)] text-2xl font-bold text-[var(--foreground)]">Welcome back</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Log in to continue.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email", { required: "Email is required." })} />
            {errors.email && <p className="mt-1 text-xs text-[var(--destructive)]">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register("password", { required: "Password is required." })} />
            {errors.password && <p className="mt-1 text-xs text-[var(--destructive)]">{errors.password.message}</p>}
          </div>

          {serverError && <Alert>{serverError}</Alert>}

          <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
            {isSubmitting ? "Logging in…" : <>Log in <ArrowRight size={16} /></>}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-[var(--primary)] hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </section>
  );
}