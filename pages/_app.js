// pages/_app.js
import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  getIdTokenResult
} from "firebase/auth";
import { auth } from "../lib/firebase";

// ==== CART CONTEXT ====
const CartContext = createContext();
export function useCart() {
  return useContext(CartContext);
}

// ==== AUTH CONTEXT ====
const AuthContext = createContext();
export function useAuth() {
  return useContext(AuthContext);
}

// ==== NOTIFICATION CONTEXT ====
const NotificationContext = createContext();
export function useNotification() {
  return useContext(NotificationContext);
}

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // Cart state
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

  const cartValue = { cartItems, addToCart, removeFromCart, clearCart };

  // Auth state
  const [user, setUser] = useState(null);
  const [claims, setClaims] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const tokenResult = await getIdTokenResult(firebaseUser);
          setClaims(tokenResult.claims || {});
        } catch (err) {
          console.error("Error getting token claims:", err);
          setClaims({});
        }
      } else {
        setUser(null);
        setClaims(null);
      }
      setAuthLoading(false);
    });

    return () => unsub();
  }, []);

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const tokenResult = await getIdTokenResult(cred.user);
    setUser(cred.user);
    setClaims(tokenResult.claims || {});
    return { user: cred.user, claims: tokenResult.claims || {} };
  };

  const register = async (email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const tokenResult = await getIdTokenResult(cred.user);
    setUser(cred.user);
    setClaims(tokenResult.claims || {});
    return { user: cred.user, claims: tokenResult.claims || {} };
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setClaims(null);
  };

  const authValue = {
    user,
    claims,
    authLoading,
    login,
    register,
    resetPassword,
    logout
  };

  // Notification (toast)
  const [notifications, setNotifications] = useState([]);

  const showNotification = (type, message) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  const notificationValue = { showNotification };

  const isAuthPage = router.pathname.startsWith("/auth");

  return (
    <CartContext.Provider value={cartValue}>
      <AuthContext.Provider value={authValue}>
        <NotificationContext.Provider value={notificationValue}>
          {/* TOAST / NOTIFIKASI */}
          <div
            style={{
              position: "fixed",
              top: 16,
              right: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              zIndex: 9999
            }}
          >
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  minWidth: "220px",
                  maxWidth: "320px",
                  padding: "10px 14px",
                  borderRadius: 8,
                  backgroundColor:
                    n.type === "error"
                      ? "#fee2e2"
                      : n.type === "success"
                      ? "#dcfce7"
                      : "#e5e7eb",
                  color:
                    n.type === "error"
                      ? "#991b1b"
                      : n.type === "success"
                      ? "#166534"
                      : "#111827",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                  fontSize: 14
                }}
              >
                {n.message}
              </div>
            ))}
          </div>

          <div
            style={{
              fontFamily: "sans-serif",
              padding: isAuthPage ? 0 : 16
            }}
          >
            {/* Navbar: tidak muncul di halaman auth */}
            {!isAuthPage && (
              <nav
                style={{
                  display: "flex",
                  gap: "16px",
                  marginBottom: "24px",
                  borderBottom: "1px solid #ddd",
                  paddingBottom: "8px",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ display: "flex", gap: 16 }}>
                  <Link href="/home">Home</Link>
                  <Link href="/cart">Cart ({cartItems.length})</Link>
                  <Link href="/admins/home">Admin Add</Link>
                  <Link href="/admins/list">Admin List</Link>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  {user ? (
                    <>
                      <span style={{ fontSize: 12 }}>
                        {claims?.isAdmin ? "Admin" : "User"}: {user.email}
                      </span>
                      <button
                        onClick={logout}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid #ddd",
                          cursor: "pointer",
                          fontSize: 12
                        }}
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <Link href="/auth/login">Login</Link>
                  )}
                </div>
              </nav>
            )}

            <Component {...pageProps} />
          </div>
        </NotificationContext.Provider>
      </AuthContext.Provider>
    </CartContext.Provider>
  );
}