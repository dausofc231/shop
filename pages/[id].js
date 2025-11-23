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
  FiEyeOff,
  FiShoppingCart,
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
  const [userProfile, setUserProfile] = useState(null);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // image slider
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);

  // like / rating
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);

  // title + deskripsi expand
  const [showFullTitle, setShowFullTitle] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  // komentar
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [showAllComments, setShowAllComments] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});

  // CART STATE (ikon atas & tombol bawah)
  const [cartCount, setCartCount] = useState(0); // jumlah item di cart user
  const [cartAdded, setCartAdded] = useState(false); // apakah produk ini sudah di cart user
  const [cartBusy, setCartBusy] = useState(false);

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

  /* AUTH (untuk like & komentar & cart) */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
    });
    return () => unsub();
  }, []);

  /* LOAD PROFIL USER (username -> default nama komentar) */
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) {
        setUserProfile(null);
        return;
      }
      try {
        const ref = doc(db, "users", currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setUserProfile(data);
          if (!commentName) {
            setCommentName(data.username || "");
          }
        }
      } catch (err) {
        console.error("Gagal load profil user:", err);
      }
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

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

  /* CEK APAKAH USER SUDAH LIKE (SUBKOLEKSI likes) */
  useEffect(() => {
    const checkLiked = async () => {
      if (!id || !currentUser) {
        setLiked(false);
        return;
      }
      try {
        const likeRef = doc(db, "products", id, "likes", currentUser.uid);
        const snap = await getDoc(likeRef);
        setLiked(snap.exists());
      } catch (err) {
        console.error("Gagal cek like:", err);
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

  /* LOAD CART COUNT USER (untuk ikon cart atas) */
  useEffect(() => {
    const loadCartCount = async () => {
      if (!currentUser) {
        setCartCount(0);
        return;
      }
      try {
        const cartRef = collection(db, "users", currentUser.uid, "cart");
        const snap = await getDocs(cartRef);
        setCartCount(snap.size); // jumlah doc = jumlah produk berbeda
      } catch (err) {
        console.error("Gagal load cart user:", err);
      }
    };
    loadCartCount();
  }, [currentUser]);

  /* CEK APAKAH PRODUK INI SUDAH ADA DI CART USER */
  useEffect(() => {
    const checkCart = async () => {
      if (!currentUser || !id) {
        setCartAdded(false);
        return;
      }
      try {
        const cartDocRef = doc(db, "users", currentUser.uid, "cart", id);
        const snap = await getDoc(cartDocRef);
        setCartAdded(snap.exists());
      } catch (err) {
        console.error("Gagal cek cart produk:", err);
      }
    };
    checkCart();
  }, [currentUser, id]);

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

  const handleTouchStartImg = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEndImg = (e) => {
    if (touchStartX === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 40) {
      if (diff < 0) handleNextImage();
      else handlePrevImage();
    }
    setTouchStartX(null);
  };

  /* LIKE HANDLER – 1 akun = 1 like, wajib login */
  const handleToggleLike = async () => {
    if (!product || !id) return;
    if (!currentUser) return;
    if (likeBusy) return;

    setLikeBusy(true);

    const productRef = doc(db, "products", id);
    const likeRef = doc(db, "products", id, "likes", currentUser.uid);

    const prevLiked = liked;
    const prevCount = likeCount;

    try {
      if (!liked) {
        setLiked(true);
        setLikeCount((c) => c + 1);

        await Promise.all([
          setDoc(likeRef, {
            userUid: currentUser.uid,
            createdAt: serverTimestamp(),
          }),
          updateDoc(productRef, {
            likes: increment(1),
          }),
        ]);
      } else {
        setLiked(false);
        setLikeCount((c) => Math.max(c - 1, 0));

        await Promise.all([
          deleteDoc(likeRef),
          updateDoc(productRef, {
            likes: increment(-1),
          }),
        ]);
      }
    } catch (err) {
      console.error("Gagal update like:", err);
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLikeBusy(false);
    }
  };

  /* KOMENTAR HANDLER – SIMPAN KE FIRESTORE (wajib login di UI) */
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!id || !currentUser) return;

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
        userUid: currentUser.uid,
      };
      const newDoc = await addDoc(commentsRef, payload);

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
      console.error("Gagal mengirim komentar:", err);
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

  /* CART HANDLERS */
  const handleAddToCart = async () => {
    if (!product || !id) return;
    if (!currentUser) return; // wajib login
    if (stock <= 0) return;
    if (cartBusy || cartAdded) return; // hanya sekali per akun per produk

    setCartBusy(true);

    try {
      const cartDocRef = doc(db, "users", currentUser.uid, "cart", id);
      await setDoc(cartDocRef, {
        productId: id,
        name: product.name || "",
        price: finalPrice,
        image: images[0] || "",
        createdAt: serverTimestamp(),
      });

      setCartAdded(true);
      setCartCount((c) => c + 1); // nambah 1 produk di badge
    } catch (err) {
      console.error("Gagal tambah ke keranjang:", err);
    } finally {
      setCartBusy(false);
    }
  };

  const handleBuyNow = () => {
    if (!product || !id) return;
    if (!currentUser) return;
    if (stock <= 0) return;

    // TODO: arahkan ke halaman checkout sesuai kebutuhan
    console.log("Beli sekarang:", id);
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

          <div className="flex items-center gap-2">
            {/* CART ICON ATAS – hanya muncul kalau sudah login, angka mulai dari 0 */}
            {currentUser && (
              <button
                type="button"
                onClick={() => router.push("/cart")}
                className="relative h-8 w-8 flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-card-dark"
                aria-label="Lihat keranjang"
              >
                <FiShoppingCart className="text-slate-700 dark:text-[var(--text)]" />
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-primary text-[10px] text-white flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              </button>
            )}

            {/* THEME TOGGLE */}
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
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-20">
        {/* pb-20 supaya konten tidak ketutupan navbar bawah */}
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
            <section className="card flex flex-col gap-3 p-3 sm:p-4">
              {/* IMAGE + VARIASI */}
              <div className="flex flex-col gap-1.5">
                {/* IMAGE BESAR (slider geser) */}
                <div
                  className="relative w-full aspect-[4/3] bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden"
                  onTouchStart={handleTouchStartImg}
                  onTouchEnd={handleTouchEndImg}
                >
                  {images.length > 0 ? (
                    <div
                      className="absolute inset-0 flex transition-transform duration-300 ease-out"
                      style={{
                        transform: `translateX(-${activeIndex * 100}%)`,
                      }}
                    >
                      {images.map((img, idx) => (
                        <div
                          key={img + idx}
                          className="w-full h-full flex-shrink-0"
                        >
                          <img
                            src={img}
                            alt={product.name || "Product image"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
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

                {/* TERJUAL | STOK */}
                <div className="flex gap-1.5 text-[11px] px-0.5 mt-1">
                  <div className="flex-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 flex items-center justify-between">
                    <span className="text-slate-500 dark:text-[var(--text-secondary)]">
                      Terjual:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-[var(--text)]">
                      {formatCount(sold)}
                    </span>
                  </div>
                  <div className="flex-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 flex items-center justify-between">
                    <span className="text-slate-500 dark:text-[var(--text-secondary)]">
                      Stok:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-[var(--text)]">
                      {formatCount(stock)}
                    </span>
                  </div>
                </div>

                {/* THUMBNAILS */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 px-0.5">
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
              </div>

              {/* TITLE + HARGA */}
              <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 space-y-1 px-0.5">
                <h1
                  className={`text-base sm:text-lg font-semibold text-slate-900 dark:text-[var(--text)] break-words ${
                    showFullTitle ? "" : "line-clamp-1"
                  } cursor-pointer`}
                  onClick={() => setShowFullTitle((v) => !v)}
                  title={product.name}
                >
                  {product.name}
                </h1>

                {/* garis pemisah judul ↔ harga, lebih rapat */}
                <div className="border-t border-slate-200 dark:border-slate-700 my-1" />

                {/* HARGA: baru, diskon, lama jadi satu baris (wrap kalau kecil) */}
                <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                  <span className="font-semibold text-primary text-[13px]">
                    Rp {finalPrice.toLocaleString("id-ID")}
                  </span>

                  {hasDiscount && (
                    <>
                      <span className="text-[10px] font-semibold text-red-500">
                        -{discountPercent}%
                      </span>
                      <span className="text-[10px] text-slate-400 line-through">
                        Rp {basePrice.toLocaleString("id-ID")}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* DESKRIPSI */}
              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 px-0.5">
                <h2 className="text-xs font-semibold mb-1 text-slate-900 dark:text-[var(--text)]">
                  Deskripsi Produk
                </h2>
                {product.description ? (
                  <div
                    className={`rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 px-2 py-2 cursor-pointer overflow-y-auto ${
                      showFullDesc ? "max-h-52" : "max-h-24"
                    }`}
                    onClick={() => setShowFullDesc((v) => !v)}
                  >
                    <p className="text-xs text-slate-700 dark:text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap break-words">
                      {product.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
                    Belum ada deskripsi yang ditambahkan.
                  </p>
                )}
              </div>

              {/* KATEGORI */}
              {Array.isArray(product.categories) &&
                product.categories.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 px-0.5">
                    <h2 className="text-xs font-semibold mb-1 text-slate-900 dark:text-[var(--text)]">
                      Kategori
                    </h2>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {product.categories.map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-700 dark:text-[var(--text)] border border-slate-200 dark:border-slate-600 flex-shrink-0"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </section>

            {/* CARD RATING & KOMENTAR */}
            <section className="card">
              <div className="flex items-center justify-between mb-3 px-0.5">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-[var(--text)]">
                  Ulasan & Rating
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
                  <button
                    type="button"
                    onClick={currentUser ? handleToggleLike : undefined}
                    disabled={!currentUser || likeBusy}
                    className={`relative h-7 w-7 flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-bg-dark ${
                      !currentUser ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                    aria-label="Berikan like"
                  >
                    <FiHeart
                      className={
                        liked
                          ? "text-red-500 fill-red-500 text-sm"
                          : "text-slate-500 text-sm"
                      }
                    />
                    {!currentUser && (
                      <span className="absolute w-[1px] h-5 bg-slate-500 rotate-45" />
                    )}
                  </button>
                  <span>
                    {formatCount(likeCount)} ♥ | {comments.length} komentar
                  </span>
                </div>
              </div>

              {!currentUser && (
                <div className="mb-4 mx-0.5 flex items-start gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2">
                  <FiEyeOff className="mt-0.5 text-slate-500 dark:text-[var(--text-secondary)] text-sm" />
                  <p className="text-[11px] text-slate-600 dark:text-[var(--text-secondary)] leading-snug">
                    Login terlebih dahulu untuk memberi ♥ dan menulis komentar.
                    Ulasan dari pengguna lain tetap bisa kamu lihat di bawah ini.
                  </p>
                </div>
              )}

              {currentUser && (
                <form
                  onSubmit={handleSubmitComment}
                  className="grid gap-2 mb-4 mx-0.5"
                >
                  <div className="grid gap-1">
                    <label className="text-[11px] text-slate-700 dark:text-[var(--text-secondary)]">
                      Nama
                    </label>
                    <input
                      className="input text-[11px]"
                      placeholder="Nama kamu (boleh diubah, default dari username)"
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
                      maxLength={500}
                    />
                    <p className="text-[10px] text-slate-400 dark:text-[var(--text-secondary)] text-right">
                      {commentText.length}/500
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={savingComment}
                    className="mt-1 inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-medium disabled:opacity-60"
                  >
                    {savingComment ? "Mengirim..." : "Kirim"}
                  </button>
                </form>
              )}

              <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-slate-50/60 dark:bg-slate-800/40 mx-0.5">
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

                        const isExpanded = !!expandedComments[c.id];

                        return (
                          <div
                            key={c.id}
                            className="rounded-md bg-white/70 dark:bg-slate-900/60 px-2 py-1.5 border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[11px] font-semibold text-slate-800 dark:text-[var(--text)] max-w-[60%] truncate">
                                {c.name || "Anonim"}
                              </p>
                              {tanggal && (
                                <span className="text-[10px] text-slate-400 dark:text-[var(--text-secondary)]">
                                  {tanggal}
                                </span>
                              )}
                            </div>
                            <div className="border-t border-slate-200 dark:border-slate-700 mt-1 pt-1">
                              <p
                                className={`text-[11px] text-slate-600 dark:text-[var(--text-secondary)] leading-snug whitespace-pre-wrap break-words cursor-pointer ${
                                  isExpanded ? "" : "line-clamp-3"
                                }`}
                                onClick={() =>
                                  setExpandedComments((prev) => ({
                                    ...prev,
                                    [c.id]: !prev[c.id],
                                  }))
                                }
                              >
                                {c.text}
                              </p>
                            </div>
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

      {/* NAVBAR BAWAH: Add to Cart + Buy Now */}
      {!loading && !notFound && product && (
        <div className="sticky bottom-0 inset-x-0 border-t border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-bg-dark/90 backdrop-blur z-20">
          <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-2">
            {/* Tombol Add to Cart (bawah) – hanya kalau sudah login */}
            {currentUser && (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={stock <= 0 || cartBusy || cartAdded}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-card-dark text-[11px] font-medium text-slate-800 dark:text-[var(--text)] py-2 disabled:opacity-60"
              >
                <FiShoppingCart className="text-xs" />
                <span>
                  {cartAdded
                    ? "Sudah di keranjang"
                    : stock > 0
                    ? "Tambah ke Keranjang"
                    : "Stok Habis"}
                </span>
              </button>
            )}

            {/* Tombol Buy Now */}
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!currentUser || stock <= 0}
              className="flex-1 inline-flex items-center justify-center rounded-lg bg-primary text-white text-[11px] font-semibold py-2 disabled:opacity-60"
            >
              {!currentUser
                ? "Login untuk beli"
                : stock > 0
                ? "Beli Sekarang"
                : "Stok Habis"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}