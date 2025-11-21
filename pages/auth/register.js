// pages/auth/register.js
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth, useNotification } from "../_app";

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

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { showNotification } = useNotification();

  const [username, setUsername] = useState("");
  const [gmail, setGmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !gmail || !password) {
      showNotification("error", "Semua field wajib diisi.");
      return;
    }

    if (password.length < 8) {
      showNotification("error", "Password minimal 8 karakter.");
      return;
    }

    try {
      // Register user biasa (tanpa isAdmin)
      await register(gmail, password);

      showNotification("success", "Registrasi berhasil. Silakan login.");

      // Arahkan ke login dengan email otomatis terisi
      router.push({
        pathname: "/auth/login",
        query: { email: gmail }
      });
    } catch (err) {
      console.error(err);
      showNotification("error", err.message || "Gagal register.");
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
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Create your account</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14 }}>Username</label>
          <input
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #d4d4d8",
              fontSize: 14
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14 }}>Gmail</label>
          <input
            type="email"
            name="gmail"
            value={gmail}
            autoComplete="email"
            onChange={(e) => setGmail(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #d4d4d8",
              fontSize: 14
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14 }}>Password</label>
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          Create account
        </button>

        <p style={{ fontSize: 13 }}>
          Already have an account?{" "}
          <Link href="/auth/login" style={{ fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}