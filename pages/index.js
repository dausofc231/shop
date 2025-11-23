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
import {
  FiSun,
  FiMoon,
  FiMenu,
  FiUser,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

// DATA SLIDER – bebas kamu ganti imageUrl + teks + url
const sliderData = [
  {
    id: 0,
    title: "Special Discount",
    description: "Get up to 50% off on selected items.",
    buttonLabel: "Shop",
    buttonUrl: "#katalog",
    imageUrl:
      "https://images.pexels.com/photos/842567/pexels-photo-842567.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    id: 1,
    title: "New Arrivals",
    description: "Produk terbaru hadir setiap minggunya.",
    buttonLabel: "See new items",
    buttonUrl: "#katalog",
    imageUrl:
      "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    id: 2,
    title: "Best Sellers",
    description: "Lihat produk paling populer di ShopLite.",
    buttonLabel: "View best sellers",
    buttonUrl: "#katalog",
    imageUrl:
      "https://images.pexels.com/photos/7679879/pexels-photo-7679879.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [theme, setTheme] = useState("dark");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAvatarInput, setShowAvatarInput] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [avatarInput, setAvatarInput] = useState("");
  const [savingAvatar, setSavingAvatar] = useState(false);

  // slider
  const [activeSlide, setActiveSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);

  // search + filter
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("semua");
  const [filterOpen, setFilterOpen] = useState(false);

  // id produk top-3 likes (untuk label & filter populer)
  const [popularIds, setPopularIds] = useState([]);

  const filterLabel = {
    semua: "Terbaru",
    diskon: "Diskon",
    populer: "Populer",
    termurah: "Termurah",
    termahal: "Termahal",
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

  const goNextSlide = () =>
    setActiveSlide((prev) => (prev + 1) % sliderData.length);
  const goPrevSlide = () =>
    setActiveSlide((prev) => (prev - 1 + sliderData.length) % sliderData.length);

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 40) {
      if (diff < 0) goNextSlide();
      else goPrevSlide();
    }
    setTouchStartX(null);
  };

  /* LOAD PRODUCTS */
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => {
          const raw = d.data();
          const likes = typeof raw.likes === "number" ? raw.likes : 0;
          return { id: d.id, ...raw, likes };
        });

        // tentukan 3 produk dengan like terbanyak (>0)
        const sortedByLikes = [...data].sort(
          (a, b) => Number(b.likes || 0) - Number(a.likes || 0)
        );
        const top3 = sortedByLikes.filter((p) => Number(p.likes || 0) > 0).slice(0, 3);
        setPopularIds(top3.map((p) => p.id));

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
    } catch (err) {
      console.error(err);
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

  /* HELPER LABEL POPULER / BARU */
  const isPopular = (p) => popularIds.includes(p.id);

  const isNew = (p) => {
    if (isPopular(p)) return false;

    if (Array.isArray(p.labels) && p.labels.includes("baru")) return true;

    try {
      if (p.createdAt && typeof p.createdAt.toDate === "function") {
        const created = p.createdAt.toDate();
        const now = new Date();
        const diffMs = now - created;
        const diffDay = diffMs / (1000 * 60 * 60 * 24);
        return diffDay <= 7;
      }
    } catch {
      // ignore
    }
    return false;
  };

  /* FILTER & SEARCH PRODUK */
  let filteredProducts = products.filter((p) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    const name = (p.name || "").toLowerCase();
    const desc = (p.description || "").toLowerCase();
    return name.includes(term) || desc.includes(term);
  });

  if (selectedFilter === "diskon") {
    filteredProducts = filteredProducts.filter((p) => {
      const hasDiscountNumber =
        typeof p.discount === "number" && p.discount > 0;
      const hasDiscountLabel =
        Array.isArray(p.labels) && p.labels.includes("diskon");
      return hasDiscountNumber || hasDiscountLabel;
    });
  } else if (selectedFilter === "populer") {
    filteredProducts = filteredProducts.filter((p) => isPopular(p));
  }

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
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setMenuOpen(false);
              setShowAvatarInput(false);
            }}
          />

          <div className="absolute right-0 top-0 h-full w-64 bg-white dark:bg-card-dark shadow-xl p-4 flex flex-col gap-3">
            {userDoc ? (
              <div className="relative flex flex-col gap-2 text-xs text-slate-800 dark:text-[var(--text)]">
                {/* TANGGAL DI POJOK KANAN ATAS */}
                <span className="absolute top-0 right-0 text-[10px] text-slate-500 dark:text-[var(--text-secondary)]">
                  {createdDate}
                </span>

                {/* BARIS ATAS: FOTO + NAMA + SALDO+ROLE */}
                <div className="flex items-start pt-4">
                  {/* avatar + garis vertikal */}
                  <div className="relative pr-3 mr-3">
                    <button
                      type="button"
                      onClick={() => setShowAvatarInput((v) => !v)}
                      className="h-10 w-10 rounded-full border border-slate-300 dark:border-slate-600 overflow-hidden bg-white dark:bg-bg-dark flex-shrink-0"
                    >
                      {userDoc.photoURL ? (
                        <img
                          src={userDoc.photoURL}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FiUser className="text-slate-500 dark:text-[var(--text-secondary)] h-full w-full p-2" />
                      )}
                    </button>
                    {/* garis pembatas */}
                    <span className="pointer-events-none absolute right-0 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
                  </div>

                  {/* teks kanan */}
                  <div className="flex-1 space-y-1 min-w-0">
                    {/* nama (sendiri) */}
                    <span className="font-semibold block truncate">
                      {userDoc.username}
                    </span>

                    {/* saldo + role dalam 1 baris */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">
                        Saldo:{" "}
                        <span className="font-semibold">
                          Rp{" "}
                          {Number(userDoc.saldo || 0).toLocaleString("id-ID")}
                        </span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-medium whitespace-nowrap">
                        {userDoc.role || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* UID – di bawah role */}
                <div className="mt-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1.5 flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 dark:text-[var(--text-secondary)]">
                    UID:
                  </span>
                  <span className="text-[10px] font-mono truncate">
                    {userDoc.uid}
                  </span>
                </div>

                {/* KOLOM URL FOTO + BUTTON */}
                {showAvatarInput && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      className="input text-[11px] h-8 px-2 py-1 flex-1"
                      placeholder="URL foto profil"
                      value={avatarInput}
                      onChange={(e) => setAvatarInput(e.target.value)}
                    />
                    <button
                      onClick={handleSaveAvatar}
                      disabled={savingAvatar}
                      className="h-8 px-3 rounded-lg bg-primary text-white text-[11px] font-medium disabled:opacity-60 whitespace-nowrap"
                    >
                      {savingAvatar ? "Save..." : "Save"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
                Belum login
              </p>
            )}

            <div className="border-t border-slate-200 dark:border-slate-700" />

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
                <Link
                  href="/auth/login"
                  className="hover:underline mt-2 text-slate-800 dark:text-[var(--text)]"
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* HERO SLIDER */}
        <section className="mb-6">
          <div
            className="relative overflow-hidden rounded-2xl h-44 sm:h-52 bg-slate-900"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="absolute inset-0 flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {sliderData.map((slide) => (
                <div
                  key={slide.id}
                  className="relative w-full h-full flex-shrink-0"
                >
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/35" />
                  <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-6">
                    <h1 className="text-base sm:text-lg font-semibold text-white mb-1">
                      {slide.title}
                    </h1>
                    <p className="text-[11px] sm:text-xs text-slate-100 mb-3 max-w-[70%]">
                      {slide.description}
                    </p>
                    <Link
                      href={slide.buttonUrl}
                      className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-xs sm:text-sm font-medium text-white shadow-md w-max"
                    >
                      {slide.buttonLabel}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={goPrevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/40 flex items-center justify-center text-white text-xs"
            >
              <FiChevronLeft />
            </button>
            <button
              onClick={goNextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/40 flex items-center justify-center text-white text-xs"
            >
              <FiChevronRight />
            </button>

            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
              {sliderData.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setActiveSlide(idx)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    idx === activeSlide
                      ? "bg-primary scale-110"
                      : "bg-slate-300/80"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* JUDUL OUR PRODUCTS */}
        <section className="mb-4">
          <h2 className="text-center text-base sm:text-lg font-semibold text-slate-900 dark:text-[var(--text)]">
            Our Products
          </h2>
        </section>

        {/* SEARCH */}
        <section className="mb-3">
          <div className="relative max-w-md mx-auto">
            {!searchFocused && !searchTerm && (
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center gap-2 text-slate-400 dark:text-[var(--text-secondary)] text-xs sm:text-sm">
                <FiSearch />
                <span>Cari produk yang ingin anda cari...</span>
              </div>
            )}

            <input
              className="input text-xs sm:text-sm bg-white/95 dark:bg-card-dark pl-3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {
                if (!searchTerm) setSearchFocused(false);
              }}
            />
          </div>
        </section>

        {/* FILTER DROPDOWN */}
        <section className="mb-6">
          <div className="relative max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-card-dark text-xs sm:text-sm text-slate-800 dark:text-[var(--text)]"
            >
              <span>{filterLabel}</span>
              <span>▼</span>
            </button>

            {filterOpen && (
              <div className="absolute mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card-dark shadow-lg text-xs sm:text-sm overflow-hidden z-10">
                {[
                  ["semua", "Terbaru"],
                  ["diskon", "Diskon"],
                  ["populer", "Populer"],
                  ["termurah", "Termurah"],
                  ["termahal", "Termahal"],
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
              Tidak ada produk tersedia.
            </p>
          ) : (
            <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
              {filteredProducts.map((p) => {
                const mainImage =
                  Array.isArray(p.images) && p.images.length > 0
                    ? p.images[0]
                    : null;

                const discountPercent =
                  typeof p.discount === "number" ? p.discount : 0;
                const hasDiscount = discountPercent > 0;

                const basePrice = Number(p.price || 0);
                const finalPrice = hasDiscount
                  ? Math.round((basePrice * (100 - discountPercent)) / 100)
                  : basePrice;

                const productIsPopular = isPopular(p);
                const productIsNew = isNew(p);

                const topLabel = productIsPopular
                  ? "Populer"
                  : productIsNew
                  ? "Baru"
                  : null;

                // URL cantik
                const rawName = (p.name || "produk")
                  .toString()
                  .toLowerCase()
                  .trim();
                const slug =
                  rawName
                    .replace(/[^a-z0-9]+/gi, "-")
                    .replace(/(^-|-$)/g, "") || "produk";
                const prettyUrl = `/katalog/${slug}`;

                const hrefInternal = {
                  pathname: "/[id]", // pages/[id].js
                  query: { id: p.id },
                };

                return (
                  <Link
                    key={p.id}
                    href={hrefInternal}
                    as={prettyUrl}
                    className="rounded-xl bg-white dark:bg-card-dark shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all"
                  >
                    {/* IMAGE + LABEL ATAS */}
                    <div className="relative w-full aspect-[4/3] bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      {mainImage ? (
                        <img
                          src={mainImage}
                          alt={p.name || "Product image"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
                          Tidak ada gambar
                        </div>
                      )}

                      {/* diskon di pojok kiri */}
                      {hasDiscount && (
                        <span className="absolute top-2 left-2 px-2 py-1 rounded-full bg-red-500 text-[10px] font-semibold text-white shadow-sm">
                          -{discountPercent}%
                        </span>
                      )}

                      {/* label populer / baru di pojok kanan */}
                      {topLabel && (
                        <span className="absolute top-2 right-2 px-2 py-1 rounded-full bg-primary/90 text-[10px] font-semibold text-white shadow-sm">
                          {topLabel}
                        </span>
                      )}
                    </div>

                    {/* CONTENT */}
                    <div className="mt-2 px-3 pb-3 flex flex-col gap-1 flex-1">
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-[var(--text)] truncate">
                        {p.name}
                      </h3>

                      <span className="text-xs font-semibold text-primary whitespace-nowrap overflow-hidden text-ellipsis">
                        Rp {finalPrice.toLocaleString("id-ID")}
                      </span>

                      {p.description && (
                        <p className="text-[11px] text-slate-600 dark:text-[var(--text-secondary)] line-clamp-2 overflow-hidden whitespace-pre-line break-words">
                          {p.description}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}