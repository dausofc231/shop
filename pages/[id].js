// pages/[id].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { db, auth } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  FiSun,
  FiMoon,
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
} from "react-icons/fi";

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [theme, setTheme] = useState("dark");
  const [currentUser, setCurrentUser] = useState(null);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // image slider
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);

  // like / love
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  /* THEME INIT */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("theme") || "dark";
    setTheme(stored);
  }, []);

  /* THEME APPLY */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  /* AUTH (opsional – buat nanti kalau mau pakai requireLogin dsb) */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  /* LOAD PRODUCT BY ID */
  useEffect(() => {
    if (!id) return;
    const loadProduct = async () => {
      try {
        setLoading(true);
        const ref = doc(db, "products", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setNotFound(true);
          setProduct(null);
          return;
        }
        const data = snap.data();
        setProduct({ id: snap.id, ...data });

        // set initial like (kalau suatu saat kamu simpan di DB => likes)
        const initialLikes = typeof data.likes === "number" ? data.likes : 0;
        setLikeCount(initialLikes);
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  /* IMAGE SLIDER HANDLERS */
  const handlePrevImage = () => {
    if (!product?.images || product.images.length === 0) return;
    setActiveIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!product?.images || product.images.length === 0) return;
    setActiveIndex((prev) =>
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 40) {
      if (diff < 0) handleNextImage();
      else handlePrevImage();
    }
    setTouchStartX(null);
  };

  /* LIKE HANDLER (suka) – masih lokal, belum ke Firestore */
  const handleToggleLike = () => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? Math.max(prev - 1, 0) : prev + 1));
  };

  /* FORMAT DATA PRODUK */
  const images =
    product && Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [];

  const basePrice = product ? Number(product.price || 0) : 0;
  const discountPercent =
    product && typeof product.discount === "number" ? product.discount : 0;
  const hasDiscount = discountPercent > 0;

  const finalPrice = hasDiscount
    ? Math.round((basePrice * (100 - discountPercent)) / 100)
    : basePrice;

  const stock = product?.stock ?? 0;
  const sold = product?.sold ?? 0; // kalau nanti mau tambah ke DB

  const topLabel = Array.isArray(product?.labels)
    ? product.labels.includes("populer")
      ? "Populer"
      : product.labels.includes("baru")
      ? "Baru"
      : null
    : null;

  // require login gate (opsional)
  const loginRequired = product?.requireLogin && !currentUser;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-bg-dark text-slate-900 dark:text-[var(--text)] text-sm">
      {/* NAVBAR */}
      <header className="w-full border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-bg-dark/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="h-8 w-8 flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-card-dark"
              aria-label="Kembali"
            >
              <FiArrowLeft className="text-slate-700 dark:text-[var(--text)]" />
            </button>
            <Link
              href="/"
              className="font-semibold text-base text-slate-900 dark:text-[var(--text)]"
            >
              Shop<span className="text-primary">Lite</span>
            </Link>
          </div>

          <button
            onClick={toggleTheme}
            className="h-8 w-8 flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-card-dark"
            aria-label="Dark / light mode"
          >
            {theme === "dark" ? (
              <FiSun className="text-primary" />
            ) : (
              <FiMoon className="text-slate-700" />
            )}
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
            Memuat detail produk...
          </p>
        ) : notFound || !product ? (
          <div className="card text-center py-8">
            <p className="text-sm font-semibold mb-1">
              Produk tidak ditemukan
            </p>
            <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)] mb-3">
              Mungkin produk sudah dihapus atau link tidak valid.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs text-slate-800 dark:text-[var(--text)] bg-white dark:bg-bg-dark"
            >
              Kembali ke beranda
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {/* LEFT: IMAGE + VARIASI */}
            <section className="card flex flex-col">
              {/* IMAGE BESAR */}
              <div
                className="relative w-full aspect-[4/3] bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {images.length > 0 ? (
                  <img
                    src={images[activeIndex]}
                    alt={product.name || "Product image"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 dark:text-[var(--text-secondary)]">
                    Tidak ada gambar
                  </div>
                )}

                {topLabel && (
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-primary/90 text-[11px] font-semibold text-white shadow-sm">
                    {topLabel}
                  </span>
                )}

                {hasDiscount && (
                  <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-red-500 text-[11px] font-semibold text-white shadow-sm">
                    -{discountPercent}%
                  </span>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/35 flex items-center justify-center text-white text-xs"
                    >
                      <FiChevronLeft />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/35 flex items-center justify-center text-white text-xs"
                    >
                      <FiChevronRight />
                    </button>
                  </>
                )}
              </div>

              {/* THUMBNAILS / VARIASI */}
              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={img + idx}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={`relative h-14 w-14 rounded-lg overflow-hidden flex-shrink-0 border ${
                        idx === activeIndex
                          ? "border-primary"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Varian ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* RIGHT: INFO PRODUK */}
            <section className="flex flex-col gap-4">
              {/* CARD: JUDUL + HARGA + TERJUAL + LOVE */}
              <div className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h1 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-[var(--text)]">
                      {product.name}
                    </h1>

                    <div className="flex items-baseline gap-2">
                      {hasDiscount && (
                        <span className="text-[11px] text-slate-400 line-through">
                          Rp {basePrice.toLocaleString("id-ID")}
                        </span>
                      )}
                      <span className="text-lg font-semibold text-primary">
                        Rp {finalPrice.toLocaleString("id-ID")}
                      </span>
                    </div>

                    {hasDiscount && (
                      <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
                        Hemat {discountPercent}% dari harga awal
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] text-right">
                      Terjual <span className="font-semibold">{sold}</span> |{" "}
                      Stok{" "}
                      <span className="font-semibold">
                        {stock > 0 ? stock : "Habis"}
                      </span>
                    </p>

                    <button
                      type="button"
                      onClick={handleToggleLike}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-bg-dark text-[11px]"
                    >
                      <FiHeart
                        className={
                          liked
                            ? "text-red-500 fill-red-500"
                            : "text-slate-500"
                        }
                      />
                      <span>
                        {likeCount} suka
                      </span>
                    </button>
                  </div>
                </div>

                {/* Info kategori / login */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {Array.isArray(product.categories) &&
                    product.categories.map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-700 dark:text-[var(--text)] border border-slate-200 dark:border-slate-600"
                      >
                        {cat}
                      </span>
                    ))}

                  {loginRequired && (
                    <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40">
                      Wajib login untuk melihat / membeli
                    </span>
                  )}
                </div>
              </div>

              {/* CARD: DESKRIPSI */}
              <div className="card">
                <h2 className="text-sm font-semibold mb-2 text-slate-900 dark:text-[var(--text)]">
                  Deskripsi Produk
                </h2>
                {product.description ? (
                  <p className="text-xs text-slate-700 dark:text-[var(--text-secondary)] leading-relaxed">
                    {product.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
                    Belum ada deskripsi yang ditambahkan.
                  </p>
                )}
              </div>

              {/* CARD: ULASAN & RATING (UI SAJA) */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-[var(--text)]">
                    Ulasan & Rating
                  </h2>
                  <span className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
                    Rating: <span className="font-semibold">{likeCount}</span>{" "}
                    love
                  </span>
                </div>

                <div className="border border-dashed border-slate-200 dark:border-slate-600 rounded-lg p-3 mb-3">
                  <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mb-1">
                    Belum ada komentar yang tersimpan. Kamu bisa gunakan bagian
                    ini nanti untuk menyimpan ulasan di Firestore (subkoleksi
                    per produk).
                  </p>
                </div>

                {/* Form ulasan (non-aktif, tampilan saja) */}
                <div className="grid gap-2">
                  <label className="text-[11px] text-slate-700 dark:text-[var(--text-secondary)]">
                    Komentar
                  </label>
                  <textarea
                    className="input text-[11px] min-h-[70px]"
                    placeholder="Tulis komentar kamu di sini (UI saja, belum tersimpan ke database)..."
                    disabled
                  />
                  <button
                    type="button"
                    disabled
                    className="mt-1 inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-slate-300 dark:bg-slate-700 text-[11px] text-slate-700 dark:text-[var(--text-secondary)] cursor-not-allowed"
                  >
                    Kirim (contoh, belum aktif)
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}