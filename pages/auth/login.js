// pages/auth/login.js
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (router.query.email && typeof router.query.email === "string") {
      setIdentifier(router.query.email);
    }
  }, [router.query.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!identifier || !password) {
      setErrorMsg("Semua field wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      let emailToUse = identifier;

      if (!identifier.includes("@")) {
        // dianggap username → cari email di Firestore
        const q = query(
          collection(db, "users"),
          where("username", "==", identifier)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          throw new Error("Username tidak ditemukan.");
        }
        const userData = snap.docs[0].data();
        emailToUse = userData.email;
      }

      const res = await signInWithEmailAndPassword(auth, emailToUse, password);
      const user = res.user;

      // cek role
      const ref = doc(db, "users", user.uid);
      const userSnap = await getDoc(ref);
      if (!userSnap.exists()) {
        throw new Error("Data user tidak ditemukan di Firestore.");
      }
      const data = userSnap.data();

      if (data.role === "admins") {
        router.push("/dasboradmins");
      } else {
        // default ke users
        router.push("/dasborUser");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Gagal login.");
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
            <h1 className="text-base font-semibold mb-1">Sign in to your account</h1>
            <p className="text-xs text-slate-500 dark:text-text-secondary">
              Gunakan email atau username yang sudah terdaftar.
            </p>
          </div>

          <div className="grid gap-1">
            <label className="text-xs">Email atau username</label>
            <input
              className="input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="email atau username"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-xs">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <Link href="/auth/forgot" className="underline font-semibold">
              Forgot password?
            </Link>
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
            {loading ? "Memproses..." : "Login"}
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