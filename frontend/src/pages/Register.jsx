// src/pages/Register.jsx

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

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const password = watch("password");

  async function onSubmit(formData) {
    setServerError("");
    try {
      const { confirmPassword, ...payload } = formData;
      await registerUser(payload);
      navigate("/");
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
          <h1 className="mt-4 font-[var(--font-display)] text-2xl font-bold text-[var(--foreground)]">Create your account</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Search, donate, or request blood.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="Your name" {...register("name", { required: "Name is required." })} />
            {errors.name && <p className="mt-1 text-xs text-[var(--destructive)]">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email", { required: "Email is required." })} />
            {errors.email && <p className="mt-1 text-xs text-[var(--destructive)]">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="phone">Phone <span className="font-normal text-[var(--muted-foreground)]">(optional)</span></Label>
            <Input id="phone" placeholder="98XXXXXXXX" {...register("phone")} />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password" type="password" placeholder="e.g. Blood@2026"
              {...register("password", {
                required: "Password is required.",
                pattern: { value: PASSWORD_PATTERN, message: "8+ characters, upper/lowercase, a number, and a symbol." },
              })}
            />
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">8+ characters, uppercase, lowercase, number, symbol.</p>
            {errors.password && <p className="mt-1 text-xs text-[var(--destructive)]">{errors.password.message}</p>}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword" type="password"
              {...register("confirmPassword", {
                required: "Please confirm your password.",
                validate: (value) => value === password || "Passwords do not match.",
              })}
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-[var(--destructive)]">{errors.confirmPassword.message}</p>}
          </div>

          {serverError && <Alert>{serverError}</Alert>}

          <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
            {isSubmitting ? "Creating account…" : <>Create account <ArrowRight size={16} /></>}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
          Already have an account? <Link to="/login" className="font-semibold text-[var(--primary)] hover:underline">Log in</Link>
        </p>
        <p className="mt-2 text-center text-sm text-[var(--muted-foreground)]">
          Registering a blood bank?{" "}
          <Link to="/register/blood-bank" className="font-semibold text-[var(--primary)] hover:underline">Register here</Link>
        </p>
      </motion.div>
    </section>
  );
}