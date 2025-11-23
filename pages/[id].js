// pages/[id].js
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { FiChevronLeft } from "react-icons/fi";

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [theme, setTheme] = useState("dark");

  // THEME LOAD
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("theme") || "dark";
    setTheme(stored);
  }, []);

  // APPLY THEME
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  // LOAD PRODUK BY ID
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const ref = doc(db, "products", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setNotFound(true);
        } else {
          setProduct({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-bg-dark text-sm text-slate-900 dark:text-[var(--text)]">
        Memuat detail produk...
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-bg-dark p-6 text-sm">
        <Link href="/" className="text-primary text-xs flex items-center gap-1">
          <FiChevronLeft /> Kembali
        </Link>
        <h1 className="mt-4 text-lg font-semibold">Produk tidak ditemukan</h1>
        <p className="text-xs text-slate-500 mt-2">ID: {id}</p>
      </div>
    );
  }

  // ----- DATA FIRESTORE -----
  const {
    name,
    description,
    price,
    discount,
    stock,
    requireLogin,
    categories = [],
    images = [],
    labels = [],
    createdAt,
    createdBy,
  } = product;

  const discountPercent =
    typeof discount === "number" && discount > 0 ? discount : 0;

  const basePrice = Number(price || 0);
  const finalPrice =
    discountPercent > 0
      ? Math.round((basePrice * (100 - discountPercent)) / 100)
      : basePrice;

  const createdDate =
    createdAt?.toDate?.() ? createdAt.toDate().toLocaleString("id-ID") : "-";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-bg-dark text-slate-900 dark:text-[var(--text)] text-sm">
      {/* HEADER */}
      <header className="w-full border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-bg-dark/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-primary text-xs flex items-center gap-1">
            <FiChevronLeft /> Katalog
          </Link>
          <span className="text-xs">/ {name}</span>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* GAMBAR */}
        <section>
          <div className="rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-700 aspect-[4/3]">
            {images.length > 0 ? (
              <img
                src={images[0]}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-500">
                Tidak ada gambar
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto">
              {images.map((url, i) => (
                <div
                  key={url + i}
                  className="w-20 h-20 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0"
                >
                  <img src={url} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* DETAIL PRODUK */}
        <section className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
          {/* LABEL */}
          {(labels.length > 0 || requireLogin) && (
            <div className="flex flex-wrap gap-2 text-[10px]">
              {labels.map((l) => (
                <span
                  key={l}
                  className="px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-[var(--text-secondary)]"
                >
                  {l}
                </span>
              ))}

              {requireLogin && (
                <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  Wajib login
                </span>
              )}
            </div>
          )}

          <h1 className="text-lg font-semibold">{name}</h1>

          {/* HARGA */}
          <div className="text-xs space-y-1">
            {discountPercent > 0 && (
              <p className="line-through text-slate-500">Rp {basePrice.toLocaleString("id-ID")}</p>
            )}

            <p className="text-primary font-semibold text-sm">
              Rp {finalPrice.toLocaleString("id-ID")}
            </p>

            {discountPercent > 0 && (
              <p className="text-red-500 text-[11px]">Diskon {discountPercent}%</p>
            )}
          </div>

          {/* DESKRIPSI */}
          {description && (
            <p className="text-xs text-slate-700 dark:text-[var(--text-secondary)] whitespace-pre-line">
              {description}
            </p>
          )}
        </section>

        {/* INFO TAMBAHAN */}
        <section className="grid gap-4 md:grid-cols-2">
          <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs space-y-2">
            <h2 className="font-semibold">Info Produk</h2>
            <p>Stok: <b>{stock ?? "-"}</b></p>
            {categories.length > 0 && (
              <p>Kategori: <b>{categories.join(", ")}</b></p>
            )}
          </div>

          <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs space-y-2">
            <h2 className="font-semibold">Data Lainnya</h2>
            <p>ID Produk: {product.id}</p>
            <p>Dibuat: {createdDate}</p>
            <p>Dibuat oleh UID: {createdBy || "-"}</p>
          </div>
        </section>
      </main>
    </div>
  );
}