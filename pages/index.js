// pages/index.js
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import Link from "next/link";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-bg-dark text-slate-900 dark:text text-sm">
      <header className="w-full border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-bg-dark/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-semibold text-lg tracking-tight">
            Shop<span className="text-primary">Lite</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/auth/login" className="hover:underline">
              Login
            </Link>
            <Link href="/auth/register" className="hover:underline">
              Register
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold mb-1">Katalog Produk</h1>
            <p className="text-xs text-slate-500 dark:text-text-secondary">
              Halaman ini bisa diakses tanpa login.
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <Link href="/dasborUser" className="underline">
              Dasbor User
            </Link>
            <Link href="/dasboradmins" className="underline">
              Dasbor Admin
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-slate-500">Memuat produk...</p>
        ) : products.length === 0 ? (
          <p className="text-xs text-slate-500">
            Belum ada produk. Silakan tambah dari dasbor admin.
          </p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="card flex flex-col justify-between">
                <div>
                  <h2 className="font-semibold text-sm mb-1">{p.name}</h2>
                  {p.description && (
                    <p className="text-xs text-slate-600 dark:text-text-secondary mb-2 line-clamp-3">
                      {p.description}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="font-semibold text-primary">
                    {p.price ? `Rp ${Number(p.price).toLocaleString("id-ID")}` : "Harga tidak tersedia"}
                  </span>
                  {p.category && (
                    <span className="px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
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