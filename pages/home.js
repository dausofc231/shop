// pages/home.js
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useCart } from "./_app";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, "products"));
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(list);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div>Sedang memuat produk...</div>;
  }

  return (
    <div>
      <h1>Katalog Produk</h1>
      {products.length === 0 && <p>Belum ada produk.</p>}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginTop: "16px"
        }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "12px"
            }}
          >
            <h3>{product.name}</h3>
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "150px",
                  objectFit: "cover",
                  borderRadius: "4px",
                  marginBottom: "8px"
                }}
              />
            )}
            <p>Harga: Rp {product.price?.toLocaleString("id-ID")}</p>
            {product.description && <p>{product.description}</p>}
            <button
              onClick={() => addToCart(product)}
              style={{
                marginTop: "8px",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer"
              }}
            >
              Tambah ke Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}