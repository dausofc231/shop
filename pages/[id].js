// pages/[id].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { db, auth } from "../lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  FiSun,
  FiMoon,
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
} from "react-icons/fi";

// format 1000 -> "1 rb", 1500000 -> "1,5 jt"
function formatCount(n) {
  const num = Number(n || 0);
  if (num >= 1_000_000) {
    return (
      (num / 1_000_000).toLocaleString("id-ID", {
        maximumFractionDigits: 1,
      }) + " jt"
    );
  }
  if (num >= 1_000) {
    return (
      (num / 1_000).toLocaleString("id-ID", {
        maximumFractionDigits: 1,
      }) + " rb"
    );
  }
  return num.toString();
}

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

  // like / rating
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // title expand
  const [showFullTitle, setShowFullTitle] = useState(false);

  // komentar (sekarang ke Firestore)
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [showAllComments, setShowAllComments] = useState(false);
  const [savingComment, setSavingComment] = useState(false);

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

  /* AUTH (opsional, buat nanti kalau mau pakai user di komentar) */
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
        const initialLikes = typeof data.likes === "number" ? data.likes : 0;

        setProduct({ id: snap.id, ...data, likes: initialLikes });
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

  /* LOAD COMMENTS DARI SUBKOLEKSI */
  useEffect(() => {
    if (!id) return;
    const loadComments = async () => {
      try {
        const commentsRef = collection(db, "products", id, "comments");
        const q = query(commentsRef, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setComments(list);
      } catch (err) {
        console.error("Gagal load komentar:", err);
      }
    };
    loadComments();
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

  /* LIKE HANDLER – update ke Firestore */
  const handleToggleLike = async () => {
    if (!product) return;

    const prevLiked = liked;
    const prevCount = likeCount;

    const newLiked = !prevLiked;
    const newCount = Math.max(prevCount + (newLiked ? 1 : -1), 0);

    // update UI dulu (optimistik)
    setLiked(newLiked);
    setLikeCount(newCount);
    setProduct((prev) => (prev ? { ...prev, likes: newCount } : prev));

    try {
      const ref = doc(db, "products", product.id);
      await updateDoc(ref, { likes: newCount });
    } catch (err) {
      console.error("Gagal update likes:", err);
      // rollback kalau gagal
      setLiked(prevLiked);
      setLikeCount(prevCount);
      setProduct((prev) => (prev ? { ...prev, likes: prevCount } : prev));
    }
  };

  /* KOMENTAR HANDLER – SIMPAN KE FIRESTORE */
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!id) return;

    const name = commentName.trim() || "Anonim";
    const text = commentText.trim();
    if (!text) return;

    try {
      setSavingComment(true);
      const commentsRef = collection(db, "products", id, "comments");
      const payload = {
        name,
        text,
        createdAt: serverTimestamp(),
        userUid: currentUser?.uid || null,
      };
      const newDoc = await addDoc(commentsRef, payload);

      // tambah ke UI (createdAt pakai Date lokal biar ada tampilan)
      setComments((prev) => [
        {
          id: newDoc.id,
          ...payload,
          createdAt: new Date(),
        },
        ...prev,
      ]);
      setCommentText("");
    } catch (err) {
      console.error("Gagal kirim komentar:", err);
    } finally {
      setSavingComment(false);
    }
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
  const sold = product?.sold ?? 0;

  const commentsToShow = showAllComments ? comments : comments.slice(0, 2);

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
          <div className="space-y-4 md:space-y-6">
            {/* CARD UTAMA */}
            <section className="card flex flex-col gap-4">
              {/* IMAGE + VARIASI */}
              <div className="flex flex-col gap-3">
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

                {/* THUMBNAILS */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
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
              </div>

              {/* INFO BAR TERJUAL / RATING */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
                <span>
                  Terjual:{" "}
                  <span className="font-semibold">{formatCount(sold)}</span> |
                  Stok:{" "}
                  <span className="font-semibold">
                    {formatCount(stock)}
                  </span>
                </span>

                <span className="flex items-center gap-1">
                  Rating:{" "}
                  <span className="font-semibold">
                    {formatCount(likeCount)}
                  </span>{" "}
                  |
                  <button
                    type="button"
                    onClick={handleToggleLike}
                    className="ml-0.5 inline-flex items-center justify-center h-5 w-5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-bg-dark"
                  >
                    <FiHeart
                      className={
                        liked
                          ? "text-red-500 fill-red-500 text-xs"
                          : "text-slate-500 text-xs"
                      }
                    />
                  </button>
                </span>
              </div>

              {/* TITLE + HARGA */}
              <div className="space-y-2">
                <h1
                  className={`text-base sm:text-lg font-semibold text-slate-900 dark:text-[var(--text)] ${
                    showFullTitle ? "" : "line-clamp-2"
                  } cursor-pointer`}
                  onClick={() => setShowFullTitle((v) => !v)}
                  title={product.name}
                >
                  {product.name}
                </h1>

                <div className="flex flex-wrap items-baseline gap-2 text-sm sm:text-base">
                  {hasDiscount && (
                    <span className="text-xs text-slate-400 line-through">
                      Rp {basePrice.toLocaleString("id-ID")}
                    </span>
                  )}

                  <span className="font-semibold text-primary">
                    Rp {finalPrice.toLocaleString("id-ID")}
                  </span>

                  {hasDiscount && (
                    <span className="text-[11px] font-semibold text-red-500">
                      -{discountPercent}%
                    </span>
                  )}
                </div>
              </div>

              {/* KATEGORI */}
              {Array.isArray(product.categories) &&
                product.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {product.categories.map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-700 dark:text-[var(--text)] border border-slate-200 dark:border-slate-600"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

              {/* DESKRIPSI */}
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <h2 className="text-xs font-semibold mb-1 text-slate-900 dark:text-[var(--text)]">
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
            </section>

            {/* CARD RATING & KOMENTAR */}
            <section className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-[var(--text)]">
                  Ulasan & Rating
                </h2>
                <span className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
                  Rating:{" "}
                  <span className="font-semibold">
                    {formatCount(likeCount)}
                  </span>{" "}
                  love
                </span>
              </div>

              {/* FORM KOMENTAR */}
              <form onSubmit={handleSubmitComment} className="grid gap-2 mb-4">
                <div className="grid gap-1">
                  <label className="text-[11px] text-slate-700 dark:text-[var(--text-secondary)]">
                    Nama
                  </label>
                  <input
                    className="input text-[11px]"
                    placeholder="Nama kamu (boleh kosong, jadi Anonim)"
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                  />
                </div>

                <div className="grid gap-1">
                  <label className="text-[11px] text-slate-700 dark:text-[var(--text-secondary)]">
                    Komentar
                  </label>
                  <textarea
                    className="input text-[11px] min-h-[70px]"
                    placeholder="Tulis komentar kamu di sini..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingComment}
                  className="mt-1 inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-medium disabled:opacity-60"
                >
                  {savingComment ? "Mengirim..." : "Kirim"}
                </button>
              </form>

              {/* LIST KOMENTAR */}
              <div className="border border-dashed border-slate-200 dark:border-slate-600 rounded-lg p-3">
                {comments.length === 0 ? (
                  <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
                    Belum ada komentar. Jadilah yang pertama memberikan ulasan.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {commentsToShow.map((c) => {
                      let tanggal = "";
                      try {
                        if (c.createdAt?.toDate) {
                          tanggal = c.createdAt
                            .toDate()
                            .toLocaleDateString("id-ID");
                        } else if (c.createdAt instanceof Date) {
                          tanggal = c.createdAt.toLocaleDateString("id-ID");
                        }
                      } catch {
                        tanggal = "";
                      }

                      return (
                        <div
                          key={c.id}
                          className="rounded-md bg-slate-50 dark:bg-slate-800/70 px-2 py-1.5"
                        >
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <p className="text-[11px] font-semibold text-slate-800 dark:text-[var(--text)]">
                              {c.name || "Anonim"}
                            </p>
                            {tanggal && (
                              <span className="text-[10px] text-slate-400 dark:text-[var(--text-secondary)]">
                                {tanggal}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-[var(--text-secondary)]">
                            {c.text}
                          </p>
                        </div>
                      );
                    })}

                    {comments.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setShowAllComments((v) => !v)}
                        className="mt-1 text-[11px] text-primary hover:underline"
                      >
                        {showAllComments
                          ? "Sembunyikan komentar lainnya"
                          : `Lihat semua komentar (${comments.length})`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}