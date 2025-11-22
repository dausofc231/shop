// pages/dasboradmins.js
import { useEffect, useState, useRef } from "react";
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

function formatWithDots(rawDigits) {
  if (!rawDigits) return "";
  const cleaned = rawDigits.replace(/\D/g, "");
  if (!cleaned) return "";
  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function DasborAdmins() {
  const router = useRouter();
  const [adminData, setAdminData] = useState(null);
  const [checking, setChecking] = useState(true);
  const [theme, setTheme] = useState("dark");

  // form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [priceInput, setPriceInput] = useState(""); // "1.000"
  const [discountInput, setDiscountInput] = useState(""); // "10"
  const [stockInput, setStockInput] = useState(""); // "25"

  const [requireLogin, setRequireLogin] = useState(true); // default wajib

  // FOTO PRODUK
  const [images, setImages] = useState([]);
  const [imageInput, setImageInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const imageInputRef = useRef(null);

  // KATEGORI
  const [categories, setCategories] = useState([]);
  const [categoryInput, setCategoryInput] = useState("");
  const categoryInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // THEME INIT
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme") || "dark";
      setTheme(stored);
    }
  }, []);

  // THEME APPLY
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

  // AUTH CHECK
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

  // === HARGA, DISKON, STOK ===
  const handlePriceChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    setPriceInput(formatWithDots(digits));
  };

  const handleStockChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    setStockInput(formatWithDots(digits));
  };

  const handleDiscountChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    if (!digits) {
      setDiscountInput("");
      return;
    }
    let num = parseInt(digits, 10);
    if (isNaN(num)) num = 0;
    if (num > 100) num = 100;
    setDiscountInput(String(num));
  };

  // === FOTO PRODUK (CHIP) ===
  const addImage = () => {
    const val = imageInput.trim();
    if (!val) return;

    // wajib http / https
    if (!/^https?:\/\//i.test(val)) {
      setUrlError("URL harus diawali dengan http:// atau https://");
      return;
    }
    setUrlError("");

    setImages((prev) => [...prev, val]);
    setImageInput("");
    // balik fokus ke input url
    setTimeout(() => {
      if (imageInputRef.current) imageInputRef.current.focus();
    }, 0);
  };

  const handleImageKeyDown = (e) => {
    if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      addImage();
    }
  };

  const handleImageBlur = () => {
    if (imageInput.trim()) {
      addImage();
    }
  };

  const removeImage = (url) => {
    setImages((prev) => prev.filter((u) => u !== url));
  };

  // === KATEGORI (CHIP) ===
  const handleCategoryKeyDown = (e) => {
    if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      const val = categoryInput.trim();
      if (!val) return;
      if (!categories.includes(val)) {
        setCategories((prev) => [...prev, val]);
      }
      setCategoryInput("");
      setTimeout(() => {
        if (categoryInputRef.current) categoryInputRef.current.focus();
      }, 0);
    }
  };

  const removeCategory = (cat) => {
    setCategories((prev) => prev.filter((c) => c !== cat));
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPriceInput("");
    setDiscountInput("");
    setStockInput("");
    setRequireLogin(true);
    setImages([]);
    setImageInput("");
    setUrlError("");
    setCategories([]);
    setCategoryInput("");
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!name) {
      setMessage("Nama produk wajib diisi.");
      return;
    }

    if (images.length === 0) {
      setMessage("Minimal 1 foto produk wajib diisi.");
      return;
    }

    const priceDigits = priceInput.replace(/\D/g, "");
    const stockDigits = stockInput.replace(/\D/g, "");
    const priceNumber = priceDigits ? Number(priceDigits) : 0;
    const stockNumber = stockDigits ? Number(stockDigits) : 0;
    const discountNumber = discountInput ? Number(discountInput) : 0;

    if (!priceNumber) {
      setMessage("Harga wajib diisi.");
      return;
    }

    try {
      setSaving(true);

      // label otomatis: diskon + baru
      let finalLabels = [];
      if (discountNumber > 0) finalLabels.push("diskon");
      finalLabels.push("baru");

      await addDoc(collection(db, "products"), {
        name,
        description: description || null,
        price: priceNumber,
        discount: discountNumber,
        stock: stockNumber,
        requireLogin,
        categories,
        images,
        labels: finalLabels,
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

  // === HITUNG HASIL HARGA SETELAH DISKON (UNTUK DITAMPILKAN SAJA) ===
  const basePriceDigits = priceInput.replace(/\D/g, "");
  const discountNumberPreview = discountInput ? Number(discountInput) : 0;
  let finalPricePreview = "";
  if (basePriceDigits) {
    const base = Number(basePriceDigits);
    const disc = isNaN(discountNumberPreview) ? 0 : discountNumberPreview;
    const discounted = Math.round((base * (100 - disc)) / 100);
    finalPricePreview = formatWithDots(String(discounted));
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-bg-dark text-slate-900 dark:text-[var(--text)] text-sm">
      {/* NAVBAR */}
      <header className="w-full border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-bg-dark/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-semibold text-lg tracking-tight text-slate-900 dark:text-[var(--text)]">
            Shop<span className="text-primary">Lite</span> Admin
          </div>
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
        <div className="card">
          {/* header card */}
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
            {/* Nama produk */}
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

            {/* Harga + Diskon + Hasil */}
            <div className="grid gap-2">
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Harga */}
                <div className="grid gap-1">
                  <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                    Harga
                  </label>
                  <div className="flex">
                    {/* Rp di lapisan sendiri */}
                    <div className="flex items-center px-3 text-xs border border-slate-300 dark:border-slate-600 rounded-l-xl rounded-r-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-[var(--text-secondary)]">
                      Rp
                    </div>
                    <input
                      className="input rounded-l-none flex-1"
                      value={priceInput}
                      onChange={handlePriceChange}
                      placeholder="1.000"
                    />
                  </div>
                </div>

                {/* Diskon */}
                <div className="grid gap-1">
                  <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                    Diskon (%)
                  </label>
                  <div className="relative">
                    <input
                      className="input pr-10"
                      value={discountInput}
                      onChange={handleDiscountChange}
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-[var(--text-secondary)]">
                      %
                    </span>
                  </div>
                </div>

                {/* Harga setelah diskon */}
                <div className="grid gap-1">
                  <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                    Harga setelah diskon
                  </label>
                  <div className="flex">
                    <div className="flex items-center px-3 text-xs border border-slate-300 dark:border-slate-600 rounded-l-xl rounded-r-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-[var(--text-secondary)]">
                      Rp
                    </div>
                    <input
                      className="input rounded-l-none flex-1 bg-slate-200 dark:bg-slate-800 cursor-not-allowed"
                      value={finalPricePreview}
                      disabled
                      readOnly
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stok */}
            <div className="grid gap-1">
              <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                Stok
              </label>
              <input
                className="input"
                value={stockInput}
                onChange={handleStockChange}
                placeholder="25"
              />
            </div>

            {/* Foto produk */}
            <div className="grid gap-1">
              <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                Foto produk (URL)
              </label>
              <div className="input">
                <input
                  ref={imageInputRef}
                  className="bg-transparent outline-none border-none text-xs w-full"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyDown={handleImageKeyDown}
                  onBlur={handleImageBlur}
                  placeholder={
                    images.length === 0
                      ? "https://example.com/foto-produk.jpg"
                      : ""
                  }
                />
              </div>
              {urlError && (
                <p className="text-[10px] text-red-400 mt-1">{urlError}</p>
              )}
              {images.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                  {images.map((url) => (
                    <span
                      key={url}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-800 dark:text-[var(--text)] flex-shrink-0 max-w-[150px]"
                    >
                      <span className="truncate">{url}</span>
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="text-[10px]"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-slate-500 dark:text-[var(--text-secondary)]">
                Minimal 1 URL foto. Format http:// atau https://
              </p>
            </div>

            {/* Kategori */}
            <div className="grid gap-1">
              <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                Kategori
              </label>
              <div className="input">
                <input
                  ref={categoryInputRef}
                  className="bg-transparent outline-none border-none text-xs w-full"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  onKeyDown={handleCategoryKeyDown}
                  placeholder={
                    categories.length === 0
                      ? "Contoh: elektronik, fashion, teknologi"
                      : ""
                  }
                />
              </div>
              {categories.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-800 dark:text-[var(--text)] flex-shrink-0 max-w-[150px]"
                    >
                      <span className="truncate">{cat}</span>
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
              <p className="text-[10px] text-slate-500 dark:text-[var(--text-secondary)]">
                Tekan Enter untuk menambah kategori.
              </p>
            </div>

            {/* Akses produk */}
            <div className="grid gap-1">
              <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                Akses produk
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={requireLogin}
                  onChange={(e) => setRequireLogin(e.target.checked)}
                />
                <span>Wajib login untuk melihat / membeli produk ini</span>
              </label>
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