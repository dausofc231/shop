// pages/admins/home.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth, useNotification } from "../_app";

export default function AdminAddProductPage() {
  const router = useRouter();
  const { user, claims, authLoading } = useAuth();
  const { showNotification } = useNotification();

  const [form, setForm] = useState({
    name: "",
    price: "",
    imageUrl: "",
    description: ""
  });
  const [loading, setLoading] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const priceNumber = Number(form.price || 0);

      await addDoc(collection(db, "products"), {
        name: form.name,
        price: priceNumber,
        imageUrl: form.imageUrl || null,
        description: form.description || "",
        createdAt: serverTimestamp()
      });

      showNotification("success", "Produk berhasil ditambahkan.");

      setForm({
        name: "",
        price: "",
        imageUrl: "",
        description: ""
      });
    } catch (err) {
      console.error(err);
      showNotification("error", "Gagal menambahkan produk: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div>Memeriksa akses admin...</div>;

  return (
    <div>
      <h1>Admin - Tambah Produk</h1>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          maxWidth: "400px",
          marginTop: "16px"
        }}
      >
        <label>
          Nama
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "6px" }}
          />
        </label>

        <label>
          Harga
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "6px" }}
          />
        </label>

        <label>
          Image URL (opsional)
          <input
            type="text"
            name="imageUrl"
            value={form.imageUrl}
            onChange={handleChange}
            style={{ width: "100%", padding: "6px" }}
          />
        </label>

        <label>
          Deskripsi
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            style={{ width: "100%", padding: "6px" }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "8px",
            padding: "8px 12px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer"
          }}
        >
          {loading ? "Menyimpan..." : "Simpan Produk"}
        </button>
      </form>
    </div>
  );
}