// pages/admins/list.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  query
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth, useNotification } from "../_app";

export default function AdminListProductsPage() {
  const router = useRouter();
  const { user, claims, authLoading } = useAuth();
  const { showNotification } = useNotification();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Proteksi admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        showNotification("error", "Harap login sebagai admin.");
        router.replace("/auth/login");
      } else if (!claims?.isAdmin) {
        showNotification("error", "Anda bukan admin.");
        router.replace("/home");
      }
    }
  }, [authLoading, user, claims, router, showNotification]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "products"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProducts(list);
    } catch (err) {
      console.error(err);
      showNotification("error", "Gagal mengambil data produk: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && claims?.isAdmin) {
      fetchProducts();
    }
  }, [authLoading, user, claims]);

  const handleDelete = async (id) => {
    const ok = confirm("Yakin ingin menghapus produk ini?");
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "products", id));
      showNotification("success", "Produk dihapus.");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      showNotification("error", "Gagal menghapus produk: " + err.message);
    }
  };

  if (authLoading) return <div>Memeriksa akses admin...</div>;

  return (
    <div>
      <h1>Admin - List Produk</h1>
      {loading && <p>Sedang memuat...</p>}
      {!loading && products.length === 0 && <p>Belum ada produk.</p>}

      <ul style={{ listStyle: "none", padding: 0, marginTop: "16px" }}>
        {products.map((product) => (
          <li
            key={product.id}
            style={{
              borderBottom: "1px solid #ddd",
              padding: "8px 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <div style={{ fontWeight: "bold" }}>{product.name}</div>
              <div>Rp {product.price?.toLocaleString("id-ID")}</div>
            </div>
            <button
              onClick={() => handleDelete(product.id)}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer"
              }}
            >
              Hapus
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}