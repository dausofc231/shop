// pages/dasboradmins.js
import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/router";
import Link from "next/link";

export default function DasborAdmins() {
  const router = useRouter();
  const [adminData, setAdminData] = useState(null);
  const [checking, setChecking] = useState(true);
  const [theme, setTheme] = useState("dark");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
        if (data.role !== "admins") {
          router.replace("/dasborUser");
          return;
        }
        setAdminData(data);
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

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!name || !price) {
      setMessage("Nama dan harga wajib diisi.");
      return;
    }

    try {
      setSaving(true);
      await addDoc(collection(db, "products"), {
        name,
        price: Number(price),
        category: category || null,
        description: description || null,
        createdAt: serverTimestamp(),
        createdBy: adminData?.uid || null,
      });
      setMessage("Produk berhasil ditambahkan.");
      setName("");
      setPrice("");
      setCategory("");
      setDescription("");
    } catch (err) {
      console.error(err);
      setMessage("Gagal menambahkan produk.");
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-bg-dark text-sm text-slate-900 dark:text-[var(--text)]">
        <p>Memeriksa sesi admin...</p>
      </div>
    );
  }

  if (!adminData) return null;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-bg-dark text-slate-900 dark:text-[var(--text)] text-sm">
      {/* NAVBAR */}
      <header className="w-full border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-bg-dark/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-semibold text-lg tracking-tight text-slate-900 dark:text-[var(--text)]">
            Shop<span className="text-primary">Lite</span> Admin
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
            Dasbor Admin
          </h1>
          <p className="text-xs text-slate-600 dark:text-[var(--text-secondary)] mb-4">
            Role: <span className="font-semibold">{adminData.role}</span> |{" "}
            {adminData.email}
          </p>

          <div className="mb-4 flex gap-2 text-xs">
            <Link href="/" className="btn-primary text-center w-full">
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

        <div className="card">
          <h2 className="text-sm font-semibold mb-4 text-slate-900 dark:text-[var(--text)]">
            Tambah Produk
          </h2>
          <form onSubmit={handleAddProduct} className="grid gap-4">
            <div className="grid gap-1">
              <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                Nama Produk
              </label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama produk"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                Harga
              </label>
              <input
                className="input"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Misal: 150000"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                Kategori (opsional)
              </label>
              <input
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Misal: Fashion, Elektronik"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                Deskripsi (opsional)
              </label>
              <textarea
                className="input min-h-[80px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi singkat produk"
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <button
                type="submit"
                className="btn-primary text-xs"
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Tambah Produk"}
              </button>
              {message && (
                <p className="text-xs text-slate-600 dark:text-[var(--text-secondary)]">
                  {message}
                </p>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}