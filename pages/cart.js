// pages/cart.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { db, auth } from "../lib/firebase";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { FiArrowLeft, FiTrash2, FiSun, FiMoon } from "react-icons/fi";

function formatRupiah(n) {
  const num = Number(n || 0);
  return "Rp " + num.toLocaleString("id-ID");
}

export default function CartPage() {
  const router = useRouter();

  const [theme, setTheme] = useState("dark");
  const [currentUser, setCurrentUser] = useState(null);

  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [removing, setRemoving] = useState({});
  const [changingQty, setChangingQty] = useState({});

  const [expandedNames, setExpandedNames] = useState({});
  const [expandedPrices, setExpandedPrices] = useState({});

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

  /* AUTH */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
    });
    return () => unsub();
  }, []);

  /* LOAD CART ITEMS */
  useEffect(() => {
    const loadCart = async () => {
      if (!currentUser) {
        setItems([]);
        setLoadingItems(false);
        return;
      }

      setLoadingItems(true);
      try {
        const cartRef = collection(db, "users", currentUser.uid, "cart");
        const snap = await getDocs(cartRef);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(list);
      } catch (err) {
        console.error("Gagal load cart:", err);
      } finally {
        setLoadingItems(false);
      }
    };

    loadCart();
  }, [currentUser]);

  const handleRemoveItem = async (itemId) => {
    if (!currentUser) return;
    setRemoving((prev) => ({ ...prev, [itemId]: true }));
    try {
      const ref = doc(db, "users", currentUser.uid, "cart", itemId);
      await deleteDoc(ref);
      setItems((prev) => prev.filter((it) => it.id !== itemId));
    } catch (err) {
      console.error("Gagal hapus item cart:", err);
    } finally {
      setRemoving((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleChangeQty = async (itemId, delta) => {
    if (!currentUser) return;

    const item = items.find((it) => it.id === itemId);
    if (!item) return;

    const currentQty = Number(item.qty || 1);
    const newQty = currentQty + delta;

    if (newQty < 1) return; // minimal 1

    setChangingQty((prev) => ({ ...prev, [itemId]: true }));

    try {
      const ref = doc(db, "users", currentUser.uid, "cart", itemId);
      await updateDoc(ref, { qty: newQty });

      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, qty: newQty } : it))
      );
    } catch (err) {
      console.error("Gagal ubah qty:", err);
    } finally {
      setChangingQty((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const totalHarga = items.reduce(
    (sum, it) => sum + Number(it.price || 0) * Number(it.qty || 1),
    0
  );

  const handleCheckout = () => {
    if (!currentUser || items.length === 0) return;
    console.log("Checkout dengan item:", items);
  };

  const totalItem = items.reduce((acc, it) => acc + Number(it.qty || 1), 0);

  const useSlider = items.length > 5; // <--- KONDISI SLIDER

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-bg-dark text-slate-900 dark:text-[var(--text)] text-sm">
      {/* NAVBAR ATAS */}
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
      <main className="max-w-5xl mx-auto px-4 py-6 pb-20">
        {!currentUser ? (
          <div className="card text-center py-8">
            <p className="text-sm font-semibold mb-1">Kamu belum login</p>
            <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)] mb-3">
              Silakan login terlebih dahulu untuk melihat keranjang belanja.
            </p>
          </div>
        ) : loadingItems ? (
          <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
            Memuat keranjang...
          </p>
        ) : items.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-sm font-semibold mb-1">
              Keranjang belanja kosong
            </p>
            <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)] mb-3">
              Yuk cari produk dulu di beranda.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs text-slate-800 dark:text-[var(--text)] bg-white dark:bg-bg-dark"
            >
              Kembali ke beranda
            </Link>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-5">
            {/* LIST ITEM CART */}
            <section className="card p-3 sm:p-4 space-y-3">
              <h1 className="text-sm font-semibold text-slate-900 dark:text-[var(--text)] mb-1">
                Keranjang Belanja
              </h1>

              {/* WRAPPER YANG JADI SLIDER KALAU > 5 ITEM */}
              <div
                className={`space-y-2 ${
                  useSlider
                    ? "max-h-80 overflow-y-auto pr-1" // tinggi bisa diatur sesuai selera
                    : ""
                }`}
              >
                {items.map((item) => {
                  const qty = Number(item.qty || 1);
                  const isNameExpanded = !!expandedNames[item.id];
                  const isPriceExpanded = !!expandedPrices[item.id];

                  return (
                    <div
                      key={item.id}
                      className="flex gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-2 items-stretch"
                    >
                      {/* KIRI: IMAGE + LINK */}
                      <div className="flex flex-col items-center gap-1 w-20">
                        <div className="h-16 w-16 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name || "Produk"}
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                        <Link
                          href={`/${item.productId || item.id}`}
                          className="text-[11px] text-primary hover:underline text-center"
                        >
                          Lihat produk
                        </Link>
                      </div>

                      {/* PEMBATAS VERTIKAL */}
                      <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1" />

                      {/* KANAN: NAMA, HARGA, QTY + HAPUS */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          {/* NAMA */}
                          <p
                            className={`text-[12px] font-semibold text-slate-900 dark:text-[var(--text)] cursor-pointer break-words ${
                              isNameExpanded
                                ? "line-clamp-none"
                                : "line-clamp-1"
                            }`}
                            title={item.name}
                            onClick={() =>
                              setExpandedNames((prev) => ({
                                ...prev,
                                [item.id]: !prev[item.id],
                              }))
                            }
                          >
                            {item.name || "Tanpa nama"}
                          </p>

                          {/* HARGA */}
                          <p
                            className={`text-[11px] text-primary font-semibold mt-0.5 cursor-pointer ${
                              isPriceExpanded
                                ? "whitespace-normal break-words"
                                : "truncate"
                            }`}
                            onClick={() =>
                              setExpandedPrices((prev) => ({
                                ...prev,
                                [item.id]: !prev[item.id],
                              }))
                            }
                            title={formatRupiah(item.price)}
                          >
                            {formatRupiah(item.price)}
                          </p>
                        </div>

                        {/* BAWAH: QTY CONTROLS + HAPUS */}
                        <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                          {/* QTY - angka + */}
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleChangeQty(item.id, -1)
                              }
                              disabled={
                                qty <= 1 || !!changingQty[item.id]
                              }
                              className="h-6 w-6 flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-900 text-[12px] disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className="min-w-[24px] text-center text-[12px]">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleChangeQty(item.id, 1)
                              }
                              disabled={!!changingQty[item.id]}
                              className="h-6 w-6 flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-900 text-[12px] disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>

                          {/* HAPUS */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={!!removing[item.id]}
                            className="inline-flex items-center gap-1 text-[11px] text-red-500 disabled:opacity-60"
                          >
                            <FiTrash2 className="text-xs" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* RINGKASAN */}
            <section className="card p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-600 dark:text-[var(--text-secondary)]">
                  Total ({totalItem} item)
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-[var(--text)] max-w-[90%] break-all">
                  {formatRupiah(totalHarga)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={items.length === 0}
                className="w-full inline-flex items-center justify-center rounded-lg bg-primary text-white text-[11px] font-semibold py-2 disabled:opacity-60"
              >
                Lanjut ke Checkout
              </button>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}