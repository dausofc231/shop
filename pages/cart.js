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
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { FiArrowLeft, FiTrash2 } from "react-icons/fi";

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

  const totalHarga = items.reduce(
    (sum, it) => sum + Number(it.price || 0),
    0
  );

  const handleCheckout = () => {
    if (!currentUser || items.length === 0) return;
    // TODO: arahkan ke halaman checkout sesuai kebutuhan
    console.log("Checkout dengan item:", items);
  };

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
              <span className="text-primary text-xs">☀</span>
            ) : (
              <span className="text-slate-700 text-xs">🌙</span>
            )}
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-20">
        {!currentUser ? (
          <div className="card text-center py-8">
            <p className="text-sm font-semibold mb-1">
              Kamu belum login
            </p>
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
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-2"
                  >
                    <div className="h-16 w-16 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name || "Produk"}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-[12px] font-semibold text-slate-900 dark:text-[var(--text)] line-clamp-2">
                          {item.name || "Tanpa nama"}
                        </p>
                        <p className="text-[11px] text-primary font-semibold mt-0.5">
                          {formatRupiah(item.price)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <Link
                          href={`/${item.productId || item.id}`}
                          className="text-[11px] text-primary hover:underline"
                        >
                          Lihat produk
                        </Link>
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
                ))}
              </div>
            </section>

            {/* RINGKASAN */}
            <section className="card p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-600 dark:text-[var(--text-secondary)]">
                  Total ({items.length} produk)
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-[var(--text)]">
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