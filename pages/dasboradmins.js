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

  const [priceInput, setPriceInput] = useState("");   // tampilan Rp 150.000
  const [discountInput, setDiscountInput] = useState(""); // angka 0-100
  const [stockInput, setStockInput] = useState("");   // tampilan 100.000

  const [requireLogin, setRequireLogin] = useState(true); // default wajib

  const [mainImages, setMainImages] = useState([]);
  const [mainImageInput, setMainImageInput] = useState("");

  const [extraImages, setExtraImages] = useState([]);
  const [extraImageInput, setExtraImageInput] = useState("");

  const [categories, setCategories] = useState([]);
  const [categoryInput, setCategoryInput] = useState("");

  // extra form fields (WhatsApp, Instagram, dll)
  const [extraFieldInput, setExtraFieldInput] = useState("");
  const [extraFields, setExtraFields] = useState([]);
  // { id, label, type, required, requireHttps }

  // label produk (diskon, baru, populer, dll)
  const [labelInput, setLabelInput] = useState("");
  const [labels, setLabels] = useState([]);

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

  // === HANDLER HARGA, DISKON, STOK ===
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

  // === KATEGORI (KATALOG) CHIP ===
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

  // === FOTO UTAMA CHIP ===
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

  // === FOTO TAMBAHAN CHIP ===
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

  // === EXTRA FORM FIELDS (WhatsApp, dll) ===
  const handleExtraFieldKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const label = extraFieldInput.trim();
      if (!label) return;
      const id = Date.now().toString() + Math.random().toString(16).slice(2);
      setExtraFields((prev) => [
        ...prev,
        {
          id,
          label,
          type: "text", // text | tel | url | number
          required: false,
          requireHttps: false,
        },
      ]);
      setExtraFieldInput("");
    }
  };

  const updateExtraField = (id, patch) => {
    setExtraFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f))
    );
  };

  const removeExtraField = (id) => {
    setExtraFields((prev) => prev.filter((f) => f.id !== id));
  };

  // === LABEL CHIP (diskon, populer, baru, dll) ===
  const handleLabelKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = labelInput.trim();
      if (!val) return;
      if (!labels.includes(val)) {
        setLabels((prev) => [...prev, val]);
      }
      setLabelInput("");
    }
  };

  const removeLabel = (lbl) => {
    setLabels((prev) => prev.filter((l) => l !== lbl));
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPriceInput("");
    setDiscountInput("");
    setStockInput("");
    setRequireLogin(true);
    setMainImages([]);
    setMainImageInput("");
    setExtraImages([]);
    setExtraImageInput("");
    setCategories([]);
    setCategoryInput("");
    setExtraFieldInput("");
    setExtraFields([]);
    setLabelInput("");
    setLabels([]);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!name) {
      setMessage("Nama produk wajib diisi.");
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

      // labels final (otomatis diskon + baru)
      let finalLabels = [...labels];
      if (discountNumber > 0 && !finalLabels.includes("diskon")) {
        finalLabels.push("diskon");
      }
      if (!finalLabels.includes("baru")) {
        finalLabels.push("baru");
      }

      await addDoc(collection(db, "products"), {
        name,
        description: description || null,
        price: priceNumber,
        discount: discountNumber,
        stock: stockNumber,
        requireLogin,
        categories,
        mainImages,
        extraImages,
        extraFields,
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

            {/* Harga + Diskon + Stok sebaris */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Harga */}
              <div className="grid gap-1">
                <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                  Harga (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-[var(--text-secondary)]">
                    Rp
                  </span>
                  <input
                    className="input pl-10"
                    value={priceInput}
                    onChange={handlePriceChange}
                    placeholder="150.000"
                  />
                </div>
              </div>

              {/* Diskon */}
              <div className="grid gap-1">
                <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                  Diskon
                </label>
                <div className="relative">
                  <input
                    className="input pr-8"
                    value={discountInput}
                    onChange={handleDiscountChange}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-[var(--text-secondary)]">
                    %
                  </span>
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
            </div>

            {/* Foto produk utama */}
            <div className="grid gap-1">
              <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                Foto produk (URL) – Enter untuk menambah beberapa foto
              </label>
              <div className="input flex flex-wrap items-center gap-1 min-h-[42px]">
                {mainImages.map((url) => (
                  <span
                    key={url}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-800 dark:text-[var(--text)]"
                  >
                    {url.length > 20 ? url.slice(0, 17) + "..." : url}
                    <button
                      type="button"
                      onClick={() => removeMainImage(url)}
                      className="text-[10px]"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <input
                  className="flex-1 bg-transparent outline-none border-none text-xs"
                  value={mainImageInput}
                  onChange={(e) => setMainImageInput(e.target.value)}
                  onKeyDown={handleMainImageKeyDown}
                  placeholder={
                    mainImages.length === 0
                      ? "https://example.com/foto-utama.jpg"
                      : ""
                  }
                />
              </div>
            </div>

            {/* Foto tambahan */}
            <div className="grid gap-1">
              <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                Foto tambahan (URL) – opsional
              </label>
              <div className="input flex flex-wrap items-center gap-1 min-h-[42px]">
                {extraImages.map((url) => (
                  <span
                    key={url}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-800 dark:text-[var(--text)]"
                  >
                    {url.length > 20 ? url.slice(0, 17) + "..." : url}
                    <button
                      type="button"
                      onClick={() => removeExtraImage(url)}
                      className="text-[10px]"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <input
                  className="flex-1 bg-transparent outline-none border-none text-xs"
                  value={extraImageInput}
                  onChange={(e) => setExtraImageInput(e.target.value)}
                  onKeyDown={handleExtraImageKeyDown}
                  placeholder={
                    extraImages.length === 0
                      ? "https://example.com/foto-lain.jpg"
                      : ""
                  }
                />
              </div>
            </div>

            {/* Form tambahan → definisi field */}
            <div className="grid gap-1">
              <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                Form tambahan (contoh: WhatsApp, Link Toko, dsb) – Enter untuk
                menambah
              </label>
              <div className="input flex flex-wrap items-center gap-1 min-h-[42px] mb-2">
                <input
                  className="flex-1 bg-transparent outline-none border-none text-xs"
                  value={extraFieldInput}
                  onChange={(e) => setExtraFieldInput(e.target.value)}
                  onKeyDown={handleExtraFieldKeyDown}
                  placeholder="Tulis nama field lalu Enter (misal: WhatsApp)"
                />
              </div>

              {extraFields.length > 0 && (
                <div className="grid gap-2">
                  {extraFields.map((field) => (
                    <div
                      key={field.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 flex flex-col gap-1 text-[11px] bg-white dark:bg-bg-dark"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{field.label}</span>
                        <button
                          type="button"
                          onClick={() => removeExtraField(field.id)}
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center mt-1">
                        <div className="flex items-center gap-1">
                          <span>Tipe input:</span>
                          <select
                            className="border border-slate-300 dark:border-slate-600 rounded px-1 py-[1px] bg-white dark:bg-card-dark"
                            value={field.type}
                            onChange={(e) =>
                              updateExtraField(field.id, {
                                type: e.target.value,
                              })
                            }
                          >
                            <option value="text">Teks biasa</option>
                            <option value="tel">Telepon / WhatsApp</option>
                            <option value="url">URL / Link</option>
                            <option value="number">Angka</option>
                          </select>
                        </div>
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            className="accent-primary"
                            checked={field.required}
                            onChange={(e) =>
                              updateExtraField(field.id, {
                                required: e.target.checked,
                              })
                            }
                          />
                          <span>Wajib diisi</span>
                        </label>
                        {field.type === "url" && (
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              className="accent-primary"
                              checked={field.requireHttps}
                              onChange={(e) =>
                                updateExtraField(field.id, {
                                  requireHttps: e.target.checked,
                                })
                              }
                            />
                            <span>Harus pakai https://</span>
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Wajib login checkbox */}
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
                <span>
                  Wajib login untuk melihat / membeli produk ini
                  (default aktif)
                </span>
              </label>
            </div>

            {/* KATEGORI / KATALOG */}
            <div className="grid gap-1">
              <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                Katalog / kategori – Enter untuk menambah beberapa kategori
              </label>
              <div className="input flex flex-wrap items-center gap-1 min-h-[42px]">
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
                <input
                  className="flex-1 bg-transparent outline-none border-none text-xs"
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
            </div>

            {/* LABEL PRODUK */}
            <div className="grid gap-1">
              <label className="text-xs text-slate-700 dark:text-[var(--text-secondary)]">
                Label produk (diskon, populer, dll) – Enter untuk menambah
              </label>
              <div className="input flex flex-wrap items-center gap-1 min-h-[42px]">
                {labels.map((lbl) => (
                  <span
                    key={lbl}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-[10px] text-primary"
                  >
                    {lbl}
                    <button
                      type="button"
                      onClick={() => removeLabel(lbl)}
                      className="text-[10px]"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <input
                  className="flex-1 bg-transparent outline-none border-none text-xs"
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  onKeyDown={handleLabelKeyDown}
                  placeholder={
                    labels.length === 0 ? "Contoh: populer, rekomendasi" : ""
                  }
                />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-[var(--text-secondary)]">
                Catatan: jika diskon &gt; 0, label <b>diskon</b> akan ditambahkan
                otomatis. Label <b>baru</b> juga otomatis untuk produk baru.
              </p>
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