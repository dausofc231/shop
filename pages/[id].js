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
  setDoc,
  deleteDoc,
  increment,
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

  // title + deskripsi expand
  const [showFullTitle, setShowFullTitle] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  // komentar
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

  /* AUTH (untuk 1 akun 1 like + uid komentar) */
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

  /* CEK APAKAH USER SUDAH LIKE (1 akun 1 ♥) */
  useEffect(() => {
    if (!id || !currentUser) {
      setLiked(false);
      return;
    }

    const checkLiked = async () => {
      try {
        const likeRef = doc(db, "products", id, "likes", currentUser.uid);
        const snap = await getDoc(likeRef);
        setLiked(snap.exists());
      } catch (err) {
        console.error("Gagal cek like user:", err);
      }
    };

    checkLiked();
  }, [id, currentUser]);

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

  const handleTouchStartImage = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEndImage = (e) => {
    if (touchStartX === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 40) {
      if (diff < 0) handleNextImage();
      else handlePrevImage();
    }
    setTouchStartX(null);
  };

  /* LIKE HANDLER – wajib login, 1 akun 1 ♥ */
  const handleToggleLike = async () => {
    if (!product) return;

    if (!currentUser) {
      alert("Silakan login dulu untuk memberi ♥ pada produk ini.");
      return;
    }

    const prevLiked = liked;
    const prevCount = likeCount;

    const newLiked = !prevLiked;
    const productRef = doc(db, "products", product.id);
    const likeRef = doc(
      db,
      "products",
      product.id,
      "likes",
      currentUser.uid
    );

    // Optimistic UI
    let newCount = prevCount;
    if (newLiked) newCount = prevCount + 1;
    else newCount = Math.max(prevCount - 1, 0);

    setLiked(newLiked);
    setLikeCount(newCount);
    setProduct((prev) => (prev ? { ...prev, likes: newCount } : prev));

    try {
      if (newLiked) {
        await setDoc(likeRef, {
          userUid: currentUser.uid,
          createdAt: serverTimestamp(),
        });
        await updateDoc(productRef, { likes: increment(1) });
      } else {
        await deleteDoc(likeRef);
        await updateDoc(productRef, { likes: increment(-1) });
      }
    } catch (err) {
      console.error("Gagal update likes:", err);
      // rollback
      setLiked(prevLiked);
      setLikeCount(prevCount);
      setProduct((prev) => (prev ? { ...prev, likes: prevCount } : prev));
      alert("Gagal mengupdate like. Coba lagi beberapa saat lagi.");
    }
  };

  /* KOMENTAR HANDLER – SIMPAN KE FIRESTORE */
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!id) {
      alert("Produk belum siap. Muat ulang halaman dan coba lagi.");
      return;
    }

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

      // Tambah ke state biar langsung kelihatan
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
      alert("Gagal mengirim komentar. Cek koneksi / aturan akses (login) kamu.");
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

  const commentsToShow = showAllComments ? comments : comments.slice(0, 3);

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
          <div className="space-y-4 md:space-y-5">
            {/* CARD UTAMA */}
            <section className="card flex flex-col gap-3">
              {/* IMAGE + VARIASI */}
              <div className="flex flex-col gap-2">
                {/* IMAGE BESAR */}
                <div
                  className="relative w-full aspect-[4/3] bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden"
                  onTouchStart={handleTouchStartImage}
                  onTouchEnd={handleTouchEndImage}
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

                {/* THUMBNAILS SLIDER */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img, idx) => (
                      <button
                        key={img + idx}
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        className={`relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 border ${
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

                {/* TERJUAL | STOK – kecil di bawah image, sebelum garis pembatas */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-[var(--text-secondary)]">
                  <span>
                    Terjual:{" "}
                    <span className="font-semibold">
                      {formatCount(sold)}
                    </span>
                  </span>
                  <span>
                    Stok:{" "}
                    <span className="font-semibold">
                      {formatCount(stock)}
                    </span>
                  </span>
                </div>
              </div>

              {/* TITLE + HARGA + ♥ DI POJOK KANAN */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between gap-2">
                  {/* Title + harga */}
                  <div className="flex-1 min-w-0">
                    <h1
                      className={`text-base sm:text-lg font-semibold text-slate-900 dark:text-[var(--text)] break-words ${
                        showFullTitle ? "line-clamp-none" : "line-clamp-2"
                      } cursor-pointer`}
                      onClick={() => setShowFullTitle((v) => !v)}
                      title={product.name}
                    >
                      {product.name}
                    </h1>

                    {/* kalau mau lihat full title, tampilkan blok kecil di bawahnya */}
                    {showFullTitle && (
                      <div className="mt-1 max-h-16 overflow-y-auto pr-1 rounded-md bg-slate-50 dark:bg-slate-800/70 p-1">
                        <p className="text-[11px] text-slate-600 dark:text-[var(--text-secondary)] whitespace-pre-wrap break-words">
                          {product.name}
                        </p>
                      </div>
                    )}

                    <div className="mt-1 flex items-baseline gap-1.5 text-sm sm:text-base flex-wrap">
                      {hasDiscount && (
                        <>
                          <span className="text-[11px] text-slate-400 line-through">
                            Rp {basePrice.toLocaleString("id-ID")}
                          </span>
                          <span className="text-[11px] text-slate-400">|</span>
                        </>
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

                  {/* Hanya ♥ di pojok kanan, tanpa tulisan rating */}
                  <button
                    type="button"
                    onClick={handleToggleLike}
                    className="mt-0.5 h-7 w-7 flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-bg-dark"
                    aria-label="Suka"
                  >
                    <FiHeart
                      className={
                        liked
                          ? "text-red-500 fill-red-500 text-sm"
                          : "text-slate-500 text-sm"
                      }
                    />
                  </button>
                </div>
              </div>

              {/* KATEGORI – slider horizontal, lebih rapat */}
              {Array.isArray(product.categories) &&
                product.categories.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {product.categories.map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-[3px] rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-700 dark:text-[var(--text)] border border-slate-200 dark:border-slate-600 flex-shrink-0"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* DESKRIPSI – klik card, tinggi dibatasi (slide) */}
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <h2 className="text-xs font-semibold mb-1 text-slate-900 dark:text-[var(--text)]">
                  Deskripsi Produk
                </h2>
                {product.description ? (
                  <div
                    onClick={() => setShowFullDesc((v) => !v)}
                    className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 p-2 cursor-pointer"
                  >
                    <div
                      className={`text-xs text-slate-700 dark:text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap break-words ${
                        showFullDesc ? "max-h-40" : "max-h-16"
                      } overflow-y-auto`}
                    >
                      {product.description}
                    </div>
                  </div>
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
                  Ulasan & Komentar
                </h2>
                <span className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
                  Rating:{" "}
                  <span className="font-semibold">
                    {formatCount(likeCount)}
                  </span>{" "}
                  | Komentar:{" "}
                  <span className="font-semibold">
                    {comments.length}
                  </span>
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

              {/* LIST KOMENTAR – default sedikit, sisanya di-toggle */}
              <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-slate-50/60 dark:bg-slate-800/40">
                {comments.length === 0 ? (
                  <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
                    Belum ada komentar. Jadilah yang pertama memberikan ulasan.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="max-h-40 overflow-y-auto pr-1 space-y-2">
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
                            className="rounded-md bg-white/70 dark:bg-slate-900/60 px-2 py-1.5 border border-slate-200 dark:border-slate-700"
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
                            <p className="text-[11px] text-slate-600 dark:text-[var(--text-secondary)] leading-snug">
                              {c.text}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {comments.length > 3 && (
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