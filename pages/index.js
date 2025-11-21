// pages/index.js
import { useEffect, useState } from "react";
import Link from "next/link";
import { db, auth } from "../lib/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { FiSun, FiMoon, FiMenu, FiUser } from "react-icons/fi";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [theme, setTheme] = useState("dark");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [avatarInput, setAvatarInput] = useState("");
  const [savingAvatar, setSavingAvatar] = useState(false);

  // load tema awal
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("theme") || "dark";
    setTheme(stored);
  }, []);

  // sinkronisasi tema ke <html> + localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // load produk katalog (public)
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products", error);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  // cek auth + ambil data user (role, foto, dll)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setUserDoc(null);
      setAvatarInput("");
      if (!user) return;
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setUserDoc(data);
          setAvatarInput(data.photoURL || "");
        }
      } catch (err) {
        console.error("failed load user doc", err);
      }
    });

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMenuOpen(false);
      setProfileOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const dashboardPath =
    userDoc?.role === "admins" ? "/dasboradmins" : "/dasborUser";

  const handleSaveAvatar = async () => {
    if (!currentUser) return;
    try {
      setSavingAvatar(true);
      const ref = doc(db, "users", currentUser.uid);
      await updateDoc(ref, {
        photoURL: avatarInput || null,
      });
      setUserDoc((prev) =>
        prev ? { ...prev, photoURL: avatarInput || null } : prev
      );
    } catch (err) {
      console.error("failed update avatar", err);
    } finally {
      setSavingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-bg-dark text-slate-900 dark:text text-sm">
      {/* NAVBAR */}
      <header className="w-full border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-bg-dark/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* logo kiri */}
          <div className="font-semibold text-lg tracking-tight">
            Shop<span className="text-primary">Lite</span>
          </div>

          {/* kanan: darkmode, avatar (kalau login), menu */}
          <div className="flex items-center gap-3">
            {/* tombol dark mode */}
            <button
              type="button"
              onClick={toggleTheme}
              className="h-9 w-9 flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-card-dark"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? (
                <FiSun className="text-primary text-base" />
              ) : (
                <FiMoon className="text-slate-700 text-base" />
              )}
            </button>

            {/* avatar + popup kalau sudah login */}
            {currentUser && userDoc && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="h-9 w-9 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-card-dark overflow-hidden flex items-center justify-center"
                  aria-label="Akun"
                >
                  {userDoc.photoURL ? (
                    <img
                      src={userDoc.photoURL}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FiUser className="text-slate-500 dark:text-text-secondary text-base" />
                  )}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-card-dark p-3 z-30">
                    <div className="mb-3">
                      <p className="text-xs font-semibold">
                        {userDoc.username || "User"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-text-secondary">
                        {userDoc.email}
                      </p>
                      <p className="text-[11px] mt-1">
                        Role:{" "}
                        <span className="font-semibold">{userDoc.role}</span>
                      </p>
                    </div>

                    <div className="grid gap-1 mb-2">
                      <label className="text-[11px]">
                        URL foto profil (opsional)
                      </label>
                      <input
                        className="input text-[11px]"
                        placeholder="https://..."
                        value={avatarInput}
                        onChange={(e) => setAvatarInput(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveAvatar}
                      disabled={savingAvatar}
                      className="btn-primary w-full text-[11px]"
                    >
                      {savingAvatar ? "Menyimpan..." : "Simpan"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* tombol menu garis 3 */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="h-9 w-9 flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-card-dark"
              aria-label="Menu"
            >
              <FiMenu className="text-slate-700 dark:text-text text-base" />
            </button>
          </div>
        </div>
      </header>

      {/* PANEL MENU SLIDE DARI KANAN */}
      {menuOpen && (
        <div className="fixed inset-0 z-30">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          {/* panel */}
          <div className="absolute right-0 top-0 h-full w-64 bg-white dark:bg-card-dark shadow-xl p-4 flex flex-col gap-3">
            <div className="mb-2">
              <p className="font-semibold text-sm mb-1">
                Menu
              </p>
              <p className="text-[11px] text-slate-500 dark:text-text-secondary">
                Navigasi utama aplikasi.
              </p>
            </div>

            <nav className="flex flex-col gap-2 text-sm">
              <Link
                href="/"
                className="hover:underline"
                onClick={() => setMenuOpen(false)}
              >
                Home
              </Link>
              <button
                type="button"
                className="text-left hover:underline"
                onClick={() => {
                  // placeholder blog
                  setMenuOpen(false);
                }}
              >
                Blog
              </button>
              <button
                type="button"
                className="text-left hover:underline"
                onClick={() => {
                  // placeholder api docs
                  setMenuOpen(false);
                }}
              >
                Dokumen API
              </button>

              {currentUser && userDoc ? (
                <>
                  <Link
                    href={dashboardPath}
                    className="hover:underline mt-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    Dasbor
                  </Link>
                  <button
                    type="button"
                    className="text-left text-red-500 mt-1"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="hover:underline mt-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="hover:underline"
                    onClick={() => setMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* KONTEN KATALOG */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold mb-1">Katalog Produk</h1>
            <p className="text-xs text-slate-500 dark:text-text-secondary">
              Halaman ini bisa diakses tanpa login.
            </p>
          </div>
        </div>

        {loadingProducts ? (
          <p className="text-xs text-slate-500">Memuat produk...</p>
        ) : products.length === 0 ? (
          <p className="text-xs text-slate-500">
            Belum ada produk. Silakan tambah dari dasbor admin.
          </p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="card flex flex-col justify-between bg-white dark:bg-card-dark"
              >
                <div>
                  <h2 className="font-semibold text-sm mb-1">{p.name}</h2>
                  {p.description && (
                    <p className="text-xs text-slate-600 dark:text-text-secondary mb-2">
                      {p.description}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="font-semibold text-primary">
                    {p.price
                      ? `Rp ${Number(p.price).toLocaleString("id-ID")}`
                      : "Harga tidak tersedia"}
                  </span>
                  {p.category && (
                    <span className="px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-[11px]">
                      {p.category}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}