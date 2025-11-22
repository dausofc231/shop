// pages/dasboradmins.js
import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/router";
import Link from "next/link";
import { FiSun, FiMoon } from "react-icons/fi";

export default function DasborAdmins() {
  const router = useRouter();
  const [adminData, setAdminData] = useState(null);
  const [checking, setChecking] = useState(true);
  const [theme, setTheme] = useState("dark");

  // form state baru
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [stock, setStock] = useState("");
  const [extraForm, setExtraForm] = useState("");
  const [requireLogin, setRequireLogin] = useState(false);

  const [categories, setCategories] = useState([]);
  const [categoryInput, setCategoryInput] = useState("");

  const [mainImages, setMainImages] = useState([]);
  const [mainImageInput, setMainImageInput] = useState("");

  const [extraImages, setExtraImages] = useState([]);
  const [extraImageInput, setExtraImageInput] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // THEME INIT (ambil dari localStorage)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme") || "dark";
      setTheme(stored);
    }
  }, []);

  // THEME APPLY (pasang class .dark di <html>)
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

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // AUTH CHECK ROLE ADMIN
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

  // helper kategori (katalog) – Enter → jadi chip
  const handleCategoryKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = categoryInput.trim();
      if (!val) return;
      if (!categories.includes(val)) {
        setCategories((prev) => [...prev, val]);
      }
      setCategoryInput("");
    }
  };

  const removeCategory = (cat) => {
    setCategories((prev) => prev.filter((c) => c !== cat));
  };

  // helper foto utama
  const handleMainImageKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = mainImageInput.trim();
      if (!val) return;
      setMainImages((prev) => [...prev, val]);
      setMainImageInput("");
    }
  };

  const removeMainImage = (url) => {
    setMainImages((prev) => prev.filter((u) => u !== url));
  };

  // helper foto tambahan
  const handleExtraImageKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = extraImageInput.trim();
      if (!val) return;
      setExtraImages((prev) => [...prev, val]);
      setExtraImageInput("");
    }
  };

  const removeExtraImage = (url) => {
    setExtraImages((prev) => prev.filter((u) => u !== url));
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setDiscount("");
    setStock("");
    setExtraForm("");
    setRequireLogin(false);
    setCategories([]);
    setCategoryInput("");
    setMainImages([]);
    setMainImageInput("");
    setExtraImages([]);
    setExtraImageInput("");
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
        description: description || null,
        price: Number(price),
        discount: discount ? Number(discount) : 0,
        stock: stock ? Number(stock) : 0,
        extraForm: extraForm || null,
        requireLogin,
        categories,
        mainImages,
        extraImages,
        createdAt: serverTimestamp(),
        createdBy: adminData?.uid || null,
      });
      setMessage("Produk berhasil ditambahkan.");
      resetForm();
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
          {/* darkmode icon bulat */}
          <button
            type="button"
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
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* SATU CARD BESAR: header + form tambah produk */}
        <div className="card">
          {/* header dalam card */}
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <h1 className="text-lg font-semibold mb-1 text-slate-900 dark:text-[var(--text)]">
                Tambah Produk
              </h1>
              <p className="text-xs text-slate-600 dark:text-[var(--text-secondary)]">
                Role: <span className="font-semibold">{adminData.role}</span> |{" "}
                {adminData.email}
              </p>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              <Link
                href="/"
                className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-bg-dark text-slate-800 dark:text-[var(--text)] text-center"
              >
                Home / Katalog
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-1 rounded-lg border border-red-500 text-red-500 text-center"
              >
                Logout
              </button>
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={handleAddProduct} className="grid gap-4">
            {/* Nama */}
            <div className="grid gap-1">
              <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                Nama produk
              </label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama produk"
              />
            </div>

            {/* Deskripsi */}
            <div className="grid gap-1">
              <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                Deskripsi
              </label>
              <textarea
                className="input min-h-[80px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi singkat produk"
              />
            </div>

            {/* Harga + Diskon + Stok */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-1">
                <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                  Harga
                </label>
                <input
                  className="input"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="contoh: 150000"
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                  Diskon (%)
                </label>
                <input
                  className="input"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="misal: 10"
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                  Stok
                </label>
                <input
                  className="input"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="misal: 25"
                />
              </div>
            </div>

            {/* Foto produk (bisa banyak) */}
            <div className="grid gap-1">
              <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                Foto produk (URL) – tekan Enter untuk menambah beberapa foto
              </label>
              <input
                className="input text-xs"
                value={mainImageInput}
                onChange={(e) => setMainImageInput(e.target.value)}
                onKeyDown={handleMainImageKeyDown}
                placeholder="https://example.com/foto-utama.jpg"
              />
              {mainImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {mainImages.map((url) => (
                    <span
                      key={url}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-800 dark:text-[var(--text)]"
                    >
                      {url.length > 26 ? url.slice(0, 23) + "..." : url}
                      <button
                        type="button"
                        onClick={() => removeMainImage(url)}
                        className="text-[10px]"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Foto tambahan */}
            <div className="grid gap-1">
              <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                Foto tambahan (URL) – opsional
              </label>
              <input
                className="input text-xs"
                value={extraImageInput}
                onChange={(e) => setExtraImageInput(e.target.value)}
                onKeyDown={handleExtraImageKeyDown}
                placeholder="https://example.com/foto-lain.jpg"
              />
              {extraImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {extraImages.map((url) => (
                    <span
                      key={url}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-800 dark:text-[var(--text)]"
                    >
                      {url.length > 26 ? url.slice(0, 23) + "..." : url}
                      <button
                        type="button"
                        onClick={() => removeExtraImage(url)}
                        className="text-[10px]"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Form tambahan */}
            <div className="grid gap-1">
              <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                Form tambahan (opsional)
              </label>
              <textarea
                className="input min-h-[60px]"
                value={extraForm}
                onChange={(e) => setExtraForm(e.target.value)}
                placeholder="Misal: catatan khusus, syarat & ketentuan, dll."
              />
            </div>

            {/* Wajib login atau tidak */}
            <div className="grid gap-1">
              <span className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                Wajib login untuk melihat / membeli produk ini?
              </span>
              <div className="flex items-center gap-4 text-xs mt-1">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    className="accent-primary"
                    checked={requireLogin === true}
                    onChange={() => setRequireLogin(true)}
                  />
                  <span>Ya, wajib login</span>
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    className="accent-primary"
                    checked={requireLogin === false}
                    onChange={() => setRequireLogin(false)}
                  />
                  <span>Tidak perlu login</span>
                </label>
              </div>
            </div>

            {/* Katalog / kategori */}
            <div className="grid gap-1">
              <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                Katalog / kategori – tekan Enter untuk menambah beberapa kategori
              </label>
              <input
                className="input text-xs"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyDown={handleCategoryKeyDown}
                placeholder="Contoh: elektronik, fashion, teknologi"
              />
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-800 dark:text-[var(--text)]"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => removeCategory(cat)}
                        className="text-[10px]"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* FOOTER FORM */}
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