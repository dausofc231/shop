// pages/auth/forgot.js
import { useState } from "react";
import Link from "next/link";
import { useNotification, useAuth } from "../_app";

function AuthLayout({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f4f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px"
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 16,
          padding: "24px 24px 28px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
          width: "100%",
          maxWidth: 420
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div style={{ fontWeight: 700, fontSize: 18 }}>
      <span style={{ color: "#4f46e5" }}>My</span>Shop
    </div>
  );
}

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { showNotification } = useNotification();
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      showNotification("error", "Email wajib diisi.");
      return;
    }

    try {
      await resetPassword(email);
      showNotification(
        "success",
        "Link reset password telah dikirim ke email jika terdaftar."
      );
    } catch (err) {
      console.error(err);
      showNotification("error", err.message || "Gagal mengirim reset password.");
    }
  };

  return (
    <AuthLayout>
      <form
        onSubmit={handleSubmit}
        method="POST"
        className="grid w-full max-w-sm grid-cols-1 gap-8"
        style={{ display: "grid", gap: 20 }}
      >
        <Logo />
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Reset your password</h1>
        <p style={{ fontSize: 13 }}>
          Enter your email and we’ll send you a link to reset your password.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14 }}>Email</label>
          <input
            type="email"
            name="email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #d4d4d8",
              fontSize: 14
            }}
          />
        </div>
        <button
          type="submit"
          className="w-full"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "none",
            background: "#4f46e5",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 14
          }}
        >
          Reset password
        </button>
        <p style={{ fontSize: 13 }}>
          Don’t have an account?{" "}
          <Link href="/auth/register" style={{ fontWeight: 600 }}>
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}