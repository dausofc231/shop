// pages/_app.js
import "../styles/globals.css";
import { useEffect } from "react";

function MyApp({ Component, pageProps }) {
  // set tema awal dari localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("theme");
    const root = document.documentElement;
    if (stored === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;