// pages/auth/forgot.js
import { useState } from "react";
import { auth } from "../../lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import Link from "next/link";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setInfoMsg("");
    setErrorMsg("");

    if (!email) {
      setErrorMsg("Email wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setInfoMsg("Link reset password sudah dikirim ke email.");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Gagal mengirim email reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-bg-dark text-slate-900 dark:text text-sm">
      <div className="w-full max-w-sm card">
        <form onSubmit={handleSubmit} className="grid gap-5">
          {/* Logo text */}
          <div className="font-semibold text-lg tracking-tight">
            Shop<span className="text-primary">Lite</span>
          </div>

          <div>
            <h1 className="text-base font-semibold mb-1">Reset your password</h1>
            <p className="text-xs text-slate-500 dark:text-text-secondary">
              Enter your email and we’ll send you a link to reset your password.
            </p>
          </div>

          <div className="grid gap-1">
            <label className="text-xs">Email</label>
            <input
              className="input"
              type="email"
              name="email"
              value={email}
              placeholder="nama@gmail.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {infoMsg && (
            <p className="text-xs text-emerald-500">
              {infoMsg}
            </p>
          )}
          {errorMsg && (
            <p className="text-xs text-red-500">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary w-full text-xs"
            disabled={loading}
          >
            {loading ? "Mengirim..." : "Reset password"}
          </button>

          <p className="text-xs text-slate-600 dark:text-text-secondary">
            Don’t have an account?{" "}
            <Link href="/auth/register" className="underline font-semibold">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}