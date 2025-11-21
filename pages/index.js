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
import { FiSun, FiMoon, FiMenu, FiUser, FiSearch } from "react-icons/fi";

// DATA SLIDER (bisa kamu ganti teks/url-nya)
const sliderData = [
  {
    id: 0,
    title: "Temukan produk favoritmu",
    description: "Jelajahi katalog ShopLite tanpa perlu login.",
    buttonLabel: "Lihat katalog",
    buttonUrl: "#katalog",
    bgClass: "bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500",
  },
  {
    id: 1,
    title: "Promo spesial pengguna baru",
    description: "Diskon terbatas untuk beberapa produk pilihan.",
    buttonLabel: "Lihat promo",
    buttonUrl: "#katalog",
    bgClass: "bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500",
  },
  {
    id: 2,
    title: "Butuh barang cepat?",
    description: "Cari produk populer yang paling sering dibeli.",
    buttonLabel: "Lihat produk populer",
    buttonUrl: "#katalog",
    bgClass: "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500",
  },
];

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

  // slider
  const [activeSlide, setActiveSlide] = useState(0);

  // search + filter
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("semua");
  const [filterOpen, setFilterOpen] = useState(false);

  const filterLabel = {
    semua: "Semua produk",
    diskon: "Produk diskon",
    populer: "Produk populer",
    termurah: "Harga termurah",
    termahal: "Harga termahal",
  }[selectedFilter];

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

  /* SLIDER AUTO */
  useEffect(() => {
    const id = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % sliderData.length);
    }, 5000); // 5 detik
    return () => clearInterval(id);
  }, []);

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
          const data = snap.data();
          setUserDoc(data);
          setAvatarInput(data.photoURL || "");
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
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMenuOpen(false);
      setProfileOpen(false);
    } catch (err) {
    }
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

  /* FILTER & SEARCH PRODUK */
  let filteredProducts = products.filter((p) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    const name = (p.name || "").toLowerCase();
    const desc = (p.description || "").toLowerCase();
    return name.includes(term) || desc.includes(term);
  });

  // filter berdasarkan jenis
  if (selectedFilter === "diskon") {
    filteredProducts = filteredProducts.filter(
      (p) => p.discount === true || p.isDiscount === true
    );
  } else if (selectedFilter === "populer") {
    filteredProducts = filteredProducts.filter((p) => p.popular === true);
  }

  // sort berdasarkan harga
  if (selectedFilter === "termurah") {
    filteredProducts = [...filteredProducts].sort(
      (a, b) => (a.price || 0) - (b.price || 0)
    );
  } else if (selectedFilter === "termahal") {
    filteredProducts = [...filteredProducts].sort(
      (a, b) => (b.price || 0) - (a.price || 0)
    );
  }

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
              aria-label="Dark / light mode"
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
              aria-label="Menu"
            >
              <FiMenu className="text-slate-700 dark:text-[var(--text)]" />
            </button>
          </div>
        </div>
      </header>

      {/* PANEL MENU (KANAN) */}
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
                <div className="h-10 w-10 rounded-full border border-slate-300 dark:border-slate-600 overflow-hidden bg-white dark:bg-bg-dark">
                  {userDoc.photoURL ? (
                    <img
                      src={userDoc.photoURL}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FiUser className="text-slate-500 dark:text-[var(--text-secondary)] h-full w-full p-2" />
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-[var(--text)]">
                    {userDoc.username}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
                    Saldo: Rp {Number(userDoc.saldo || 0).toLocaleString("id-ID")}
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
              <Link
                href="/"
                className="hover:underline text-slate-800 dark:text-[var(--text)]"
              >
                Home
              </Link>
              <button className="text-left hover:underline text-slate-800 dark:text-[var(--text)]">
                Blog
              </button>
              <button className="text-left hover:underline text-slate-800 dark:text-[var(--text)]">
                Dokumen API
              </button>

              {userDoc && (
                <>
                  <Link
                    href={dashboardPath}
                    className="hover:underline mt-2 text-slate-800 dark:text-[var(--text)]"
                  >
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
                  <Link
                    href="/auth/login"
                    className="hover:underline mt-2 text-slate-800 dark:text-[var(--text)]"
                  >
                    Login
                  </Link>
                </>
              )}
            </nav>

            {/* POPUP PROFIL */}
            {profileOpen && userDoc && (
              <div className="absolute inset-0 flex items-center justify-center">
                {/* klik luar popup */}
                <div
                  className="absolute inset-0"
                  onClick={() => {
                    setProfileOpen(false);
                    setShowAvatarInput(false);
                  }}
                />
                {/* CARD */}
                <div
                  className="relative z-10 w-full max-w-xs rounded-xl p-4 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* HEADER atas */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-[var(--text-secondary)]">
                        Role:{" "}
                        <span className="font-semibold">{userDoc.role}</span>
                      </p>
                      <p className="text-xs text-slate-600 dark:text-[var(--text-secondary)]">
                        Saldo:{" "}
                        <span className="font-semibold">
                          Rp {Number(userDoc.saldo || 0).toLocaleString("id-ID")}
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
                      onClick={() => setShowAvatarInput((v) => !v)}
                      className="h-20 w-20 rounded-full border border-slate-300 dark:border-slate-600 overflow-hidden bg-white dark:bg-bg-dark flex items-center justify-center"
                    >
                      {userDoc.photoURL ? (
                        <img
                          src={userDoc.photoURL}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FiUser className="text-slate-500 dark:text-[var(--text-secondary)] text-3xl" />
                      )}
                    </button>
                  </div>

                  {/* NAMA + EMAIL */}
                  <p className="text-xs font-semibold text-center text-slate-900 dark:text-[var(--text)] mb-1">
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

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* HERO SLIDER */}
        <section className="mb-8">
          <div className="relative rounded-2xl overflow-hidden h-44 sm:h-52 bg-slate-900 text-white">
            {/* background gradient */}
            <div
              className={`absolute inset-0 ${sliderData[activeSlide].bgClass}`}
            />
            {/* overlay gelap dikit biar teks kebaca */}
            <div className="absolute inset-0 bg-black/20" />

            {/* konten */}
            <div className="relative z-10 h-full flex flex-col justify-between p-4 sm:p-6">
              <div className="max-w-[70%]">
                <h1 className="text-lg sm:text-xl font-semibold mb-1">
                  {sliderData[activeSlide].title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-100/90">
                  {sliderData[activeSlide].description}
                </p>
              </div>

              <div>
                <Link
                  href={sliderData[activeSlide].buttonUrl}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-white/90 text-xs sm:text-sm text-slate-900 font-medium hover:bg-white"
                >
                  {sliderData[activeSlide].buttonLabel}
                </Link>
              </div>
            </div>
          </div>

          {/* dots indikator */}
          <div className="flex justify-center gap-2 mt-3">
            {sliderData.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setActiveSlide(idx)}
                className={`h-2 w-2 rounded-full transition-all ${
                  idx === activeSlide
                    ? "bg-primary scale-110"
                    : "bg-slate-400 dark:bg-slate-600"
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </section>

        {/* SEARCH */}
        <section className="mb-4">
          <div className="relative max-w-md mx-auto">
            {/* icon search */}
            <span
              className={`absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[var(--text-secondary)] text-sm ${
                (searchFocused || searchTerm) && "hidden"
              }`}
            >
              <FiSearch />
            </span>

            <input
              className="input pl-9 text-xs sm:text-sm bg-white/90 dark:bg-card-dark"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {
                if (!searchTerm) setSearchFocused(false);
              }}
              placeholder={
                searchFocused
                  ? ""
                  : "Cari produk yang ingin anda cari..."
              }
            />
          </div>
        </section>

        {/* FILTER BUTTON */}
        <section className="mb-6 flex justify-center">
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-card-dark text-xs sm:text-sm text-slate-800 dark:text-[var(--text)]"
            >
              Filter: {filterLabel}
            </button>

            {filterOpen && (
              <div className="absolute mt-2 w-52 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card-dark shadow-lg text-xs sm:text-sm overflow-hidden z-10">
                {[
                  ["semua", "Semua produk"],
                  ["diskon", "Produk diskon"],
                  ["populer", "Produk populer"],
                  ["termurah", "Harga termurah"],
                  ["termahal", "Harga termahal"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setSelectedFilter(value);
                      setFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${
                      selectedFilter === value
                        ? "font-semibold text-primary"
                        : "text-slate-800 dark:text-[var(--text)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* KATALOG PRODUK */}
        <section id="katalog">
          {loadingProducts ? (
            <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
              Memuat produk...
            </p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
              Tidak ada produk yang cocok dengan pencarian / filter.
            </p>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {filteredProducts.map((p) => (
                <div key={p.id} className="card flex flex-col">
                  <h2 className="font-semibold text-sm text-slate-900 dark:text-[var(--text)]">
                    {p.name}
                  </h2>
                  {p.description && (
                    <p className="text-xs text-slate-600 dark:text-[var(--text-secondary)] mt-1 mb-3">
                      {p.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center text-xs mt-auto">
                    <span className="font-semibold text-primary">
                      {p.price
                        ? `Rp ${Number(p.price).toLocaleString("id-ID")}`
                        : "Harga tidak tersedia"}
                    </span>
                    {p.category && (
                      <span className="px-2 py-1 rounded-full border border-slate-300 dark:border-slate-600 text-[10px] text-slate-700 dark:text-[var(--text-secondary)]">
                        {p.category}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}