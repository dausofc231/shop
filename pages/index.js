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
  const [showAvatarInput, setShowAvatarInput] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [avatarInput, setAvatarInput] = useState("");
  const [savingAvatar, setSavingAvatar] = useState(false);

  /* THEME */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("theme") || "dark";
    setTheme(stored);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  /* LOAD PRODUCTS */
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  /* AUTH USER + FIRESTORE DOC */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setUserDoc(null);
      setProfileOpen(false);
      setShowAvatarInput(false);

      if (!user) return;

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          setUserDoc(snap.data());
          setAvatarInput(snap.data().photoURL || "");
        }
      } catch (err) {
        console.error(err);
      }
    });
    return () => unsub();
  }, []);

  const dashboardPath =
    userDoc?.role === "admins" ? "/dasboradmins" : "/dasborUser";

  /* SAVE AVATAR */
  const handleSaveAvatar = async () => {
    if (!currentUser) return;
    try {
      setSavingAvatar(true);
      await updateDoc(doc(db, "users", currentUser.uid), {
        photoURL: avatarInput || null,
      });
      setUserDoc((prev) => (prev ? { ...prev, photoURL: avatarInput } : prev));
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setMenuOpen(false);
    setProfileOpen(false);
  };

  const createdDate = (() => {
    if (!userDoc?.createdAt) return "-";
    try {
      const d = userDoc.createdAt.toDate();
      return d.toLocaleDateString("id-ID");
    } catch {
      return "-";
    }
  })();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-bg-dark text-slate-900 dark:text-[var(--text)] text-sm">

      {/* NAVBAR */}
      <header className="w-full border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-bg-dark/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-semibold text-lg text-slate-900 dark:text-[var(--text)]">
            Shop<span className="text-primary">Lite</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="h-9 w-9 flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-card-dark"
            >
              {theme === "dark" ? (
                <FiSun className="text-primary" />
              ) : (
                <FiMoon className="text-slate-700" />
              )}
            </button>

            <button
              onClick={() => setMenuOpen(true)}
              className="h-9 w-9 flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-card-dark"
            >
              <FiMenu className="text-slate-700 dark:text-[var(--text)]" />
            </button>
          </div>
        </div>
      </header>

      {/* PANEL MENU (SLIDE FROM RIGHT) */}
      {menuOpen && (
        <div className="fixed inset-0 z-40">

          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setMenuOpen(false);
              setProfileOpen(false);
              setShowAvatarInput(false);
            }}
          />

          {/* PANEL */}
          <div className="absolute right-0 top-0 h-full w-64 bg-white dark:bg-card-dark shadow-xl p-4 flex flex-col gap-3">

            {/* ROW AKUN */}
            {userDoc ? (
              <button
                className="flex items-center gap-3 text-left"
                onClick={() => setProfileOpen(true)}
              >
                <div className="h-10 w-10 rounded-full border border-slate-300 dark:border-slate-600 overflow-hidden">
                  {userDoc.photoURL ? (
                    <img src={userDoc.photoURL} className="h-full w-full object-cover" />
                  ) : (
                    <FiUser className="text-slate-500 dark:text-[var(--text-secondary)] h-full w-full p-2" />
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold">{userDoc.username}</p>
                  <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
                    Saldo: Rp {Number(userDoc.saldo).toLocaleString("id-ID")}
                  </p>
                </div>
              </button>
            ) : (
              <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
                Belum login
              </p>
            )}

            <div className="border-t border-slate-200 dark:border-slate-700" />

            {/* NAV MENU */}
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/" className="hover:underline">Home</Link>
              <button className="text-left hover:underline">Blog</button>
              <button className="text-left hover:underline">Dokumen API</button>

              {userDoc && (
                <>
                  <Link href={dashboardPath} className="hover:underline mt-2">
                    Dasbor
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-left text-red-500 mt-1"
                  >
                    Logout
                  </button>
                </>
              )}

              {!userDoc && (
                <>
                  <Link href="/auth/login" className="hover:underline mt-2">
                    Login
                  </Link>
                </>
              )}
            </nav>

            {/* POPUP PROFIL */}
            {profileOpen && userDoc && (
              <div className="absolute inset-0 flex items-center justify-center">

                {/* klik luar popup → tutup */}
                <div
                  className="absolute inset-0"
                  onClick={() => {
                    setProfileOpen(false);
                    setShowAvatarInput(false);
                  }}
                />

                {/* POPUP CARD */}
                <div
                  className="relative z-10 w-full max-w-xs rounded-xl p-4 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700"
                  onClick={(e) => e.stopPropagation()}
                >

                  {/* HEADER */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-[var(--text-secondary)]">
                        Role: <span className="font-semibold">{userDoc.role}</span>
                      </p>

                      <p className="text-xs text-slate-600 dark:text-[var(--text-secondary)]">
                        Saldo:
                        <span className="font-semibold">
                          {" "}
                          Rp {Number(userDoc.saldo).toLocaleString("id-ID")}
                        </span>
                      </p>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
                      {createdDate}
                    </p>
                  </div>

                  {/* FOTO PROFIL TENGAH */}
                  <div className="w-full flex justify-center mb-4">
                    <button
                      onClick={() => setShowAvatarInput(v => !v)}
                      className="h-20 w-20 rounded-full border border-slate-300 dark:border-slate-600 overflow-hidden bg-white dark:bg-bg-dark flex items-center justify-center"
                    >
                      {userDoc.photoURL ? (
                        <img src={userDoc.photoURL} className="h-full w-full object-cover" />
                      ) : (
                        <FiUser className="text-slate-500 dark:text-[var(--text-secondary)] text-3xl" />
                      )}
                    </button>
                  </div>

                  {/* INFO */}
                  <p className="text-xs font-semibold text-center mb-1">
                    {userDoc.username}
                  </p>
                  <p className="text-[11px] text-center text-slate-500 dark:text-[var(--text-secondary)] mb-3">
                    {userDoc.email}
                  </p>

                  {/* UID CARD */}
                  <div className="rounded-lg px-3 py-2 text-[11px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-[var(--text)] mb-4">
                    UID: {userDoc.uid}
                  </div>

                  {/* INPUT URL ICON */}
                  {showAvatarInput && (
                    <div className="grid gap-1 mb-3">
                      <label className="text-[11px] text-slate-700 dark:text-[var(--text-secondary)]">
                        URL foto profil
                      </label>
                      <input
                        className="input text-[11px]"
                        placeholder="https://..."
                        value={avatarInput}
                        onChange={(e) => setAvatarInput(e.target.value)}
                      />
                    </div>
                  )}

                  {showAvatarInput && (
                    <button
                      onClick={handleSaveAvatar}
                      disabled={savingAvatar}
                      className="btn-primary w-full text-[11px]"
                    >
                      {savingAvatar ? "Menyimpan..." : "Simpan"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KATALOG PRODUK */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold mb-2">Katalog Produk</h1>
        <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)] mb-6">
          Halaman ini bisa diakses tanpa login.
        </p>

        {loadingProducts ? (
          <p>Memuat produk...</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="card flex flex-col">
                <h2 className="font-semibold text-sm">{p.name}</h2>
                <p className="text-xs text-slate-600 dark:text-[var(--text-secondary)] mt-1 mb-3">
                  {p.description}
                </p>
                <div className="flex justify-between text-xs mt-auto">
                  <span className="font-semibold text-primary">
                    Rp {Number(p.price).toLocaleString("id-ID")}
                  </span>
                  <span className="px-2 py-1 rounded-full border border-slate-300 dark:border-slate-600 text-[10px]">
                    {p.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}