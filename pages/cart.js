// pages/cart.js
import { useCart } from "./_app";

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart } = useCart();

  const total = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * item.qty,
    0
  );

  return (
    <div>
      <h1>Keranjang Belanja</h1>
      {cartItems.length === 0 ? (
        <p>Keranjang masih kosong.</p>
      ) : (
        <>
          <ul style={{ listStyle: "none", padding: 0, marginTop: "16px" }}>
            {cartItems.map((item) => (
              <li
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #ddd",
                  padding: "8px 0"
                }}
              >
                <div>
                  <div style={{ fontWeight: "bold" }}>{item.name}</div>
                  <div>
                    {item.qty} x Rp {item.price?.toLocaleString("id-ID")}
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
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

          <div style={{ marginTop: "16px", fontWeight: "bold" }}>
            Total: Rp {total.toLocaleString("id-ID")}
          </div>

          <button
            onClick={clearCart}
            style={{
              marginTop: "12px",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer"
            }}
          >
            Bersihkan Cart
          </button>
        </>
      )}
    </div>
  );
}