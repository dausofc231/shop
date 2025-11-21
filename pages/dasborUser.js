// pages/dasborUser.js
import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import Link from "next/link";

export default function DasborUser() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [checking, setChecking] = useState(true);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme") || "dark";
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          router.replace("/auth/login");
          return;
        }
        const data = snap.data();
        if (data.role !== "users") {
          router.replace("/dasboradmins");
          return;
        }
        setUserData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setChecking(false);
      }
    });

    return () => unsub();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-bg-dark text-sm text-slate-900 dark:text-[var(--text)]">
        <p>Memeriksa sesi...</p>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-bg-dark text-slate-900 dark:text-[var(--text)] text-sm">
      {/* NAVBAR */}
      <header className="w-full border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-bg-dark/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-semibold text-lg tracking-tight text-slate-900 dark:text-[var(--text)]">
            Shop<span className="text-primary">Lite</span> User
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button
              type="button"
              onClick={toggleTheme}
              className="px-3 py-1 border rounded-lg text-xs border-slate-300 dark:border-slate-600 text-slate-800 dark:text-[var(--text)] bg-white dark:bg-card-dark"
            >
              {theme === "dark" ? "Mode terang" : "Mode gelap"}
            </button>
            <button
              type="button"
              className="px-3 py-1 border rounded-lg text-xs border-slate-300 dark:border-slate-600 text-slate-800 dark:text-[var(--text)] bg-white dark:bg-card-dark"
            >
              Menu
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="card mb-6">
          <h1 className="text-lg font-semibold mb-2 text-slate-900 dark:text-[var(--text)]">
            Halo, {userData.username || "User"}
          </h1>
          <p className="text-xs text-slate-600 dark:text-[var(--text-secondary)] mb-4">
            Ini adalah dasbor khusus role <span className="font-semibold">users</span>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-card-dark">
              <h2 className="font-semibold mb-2 text-sm text-slate-900 dark:text-[var(--text)]">
                Info Akun
              </h2>
              <p className="text-slate-700 dark:text-[var(--text-secondary)]">
                <span className="text-slate-500 dark:text-[var(--text-secondary)]">
                  UID:
                </span>{" "}
                {userData.uid}
              </p>
              <p className="text-slate-700 dark:text-[var(--text-secondary)]">
                <span className="text-slate-500 dark:text-[var(--text-secondary)]">
                  Nama:
                </span>{" "}
                {userData.username || "-"}
              </p>
              <p className="text-slate-700 dark:text-[var(--text-secondary)]">
                <span className="text-slate-500 dark:text-[var(--text-secondary)]">
                  Email:
                </span>{" "}
                {userData.email}
              </p>
              <p className="text-slate-700 dark:text-[var(--text-secondary)]">
                <span className="text-slate-500 dark:text-[var(--text-secondary)]">
                  Role:
                </span>{" "}
                {userData.role}
              </p>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-card-dark flex flex-col justify-between">
              <div>
                <h2 className="font-semibold mb-2 text-sm text-slate-900 dark:text-[var(--text)]">
                  Navigasi
                </h2>
                <p className="text-xs text-slate-600 dark:text-[var(--text-secondary)] mb-3">
                  Dari sini kamu bisa kembali ke katalog produk atau logout.
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/"
                  className="btn-primary w-full text-center text-xs"
                >
                  Ke Home / Katalog
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-xs rounded-lg border border-red-500 text-red-500 bg-transparent"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}