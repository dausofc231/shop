// pages/_app.js
import { createContext, useContext, useState } from "react";
import Link from "next/link";

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export default function MyApp({ Component, pageProps }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (existing) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, qty: p.qty + 1 } : p
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCartItems([]);

  const value = { cartItems, addToCart, removeFromCart, clearCart };

  return (
    <CartContext.Provider value={value}>
      <div style={{ fontFamily: "sans-serif", padding: "16px" }}>
        {/* Navbar sederhana */}
        <nav
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "24px",
            borderBottom: "1px solid #ddd",
            paddingBottom: "8px"
          }}
        >
          <Link href="/home">Home</Link>
          <Link href="/cart">Cart ({cartItems.length})</Link>
          <Link href="/admins/home">Admin Add</Link>
          <Link href="/admins/list">Admin List</Link>
        </nav>

        <Component {...pageProps} />
      </div>
    </CartContext.Provider>
  );
}