// pages/admins/home.js
import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AdminAddProductPage() {
  const [form, setForm] = useState({
    name: "",
    price: "",
    imageUrl: "",
    description: ""
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const priceNumber = Number(form.price || 0);

      await addDoc(collection(db, "products"), {
        name: form.name,
        price: priceNumber,
        imageUrl: form.imageUrl || null,
        description: form.description || "",
        createdAt: serverTimestamp()
      });

      setMsg("Produk berhasil ditambahkan.");
      setForm({
        name: "",
        price: "",
        imageUrl: "",
        description: ""
      });
    } catch (err) {
      console.error(err);
      setMsg("Gagal menambahkan produk: " + err.message);
    } finally {
      setLoading(false);
    }
  };

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

        {msg && <p style={{ marginTop: "8px" }}>{msg}</p>}
      </form>
    </div>
  );
}