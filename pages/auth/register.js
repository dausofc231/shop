// pages/auth/register.js
import { useState } from "react";
import { auth, db } from "../../lib/firebase";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [gmail, setGmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username || !gmail || !password) {
      setErrorMsg("Semua field wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      const res = await createUserWithEmailAndPassword(auth, gmail, password);
      const user = res.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username,
        email: gmail,
        role: "users",
        saldo: 0,
        createdAt: serverTimestamp(),
        photoURL: null,
      });

      await signOut(auth);
      router.push(`/auth/login?email=${encodeURIComponent(gmail)}`);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Terjadi kesalahan saat register.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-bg-dark text-slate-900 dark:text-[var(--text)] text-sm">
      <div className="w-full max-w-sm card">
        <form onSubmit={handleSubmit} className="grid gap-5">
          {/* Logo */}
          <div className="font-semibold text-lg tracking-tight text-slate-900 dark:text-[var(--text)]">
            Shop<span className="text-primary">Lite</span>
          </div>

          <div>
            <h1 className="text-base font-semibold mb-1 text-slate-900 dark:text-[var(--text)]">
              Create your account
            </h1>
            <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
              Register sebagai user, lalu login untuk masuk ke dasbor.
            </p>
          </div>

          <div className="grid gap-1">
            <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
              Username
            </label>
            <input
              className="input"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
              Gmail
            </label>
            <input
              className="input"
              type="email"
              name="gmail"
              value={gmail}
              onChange={(e) => setGmail(e.target.value)}
              placeholder="nama@gmail.com"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
              Password
            </label>
            <input
              className="input"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Minimal 6 karakter"
            />
          </div>

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
            {loading ? "Membuat akun..." : "Create account"}
          </button>

          <p className="text-xs text-slate-600 dark:text-[var(--text-secondary)]">
            Already have an account?{" "}
            <Link href="/auth/login" className="underline font-semibold">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}