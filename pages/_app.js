// pages/_app.js
import "../styles/globals.css";
import { useEffect } from "react";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const stored = localStorage.getItem("theme");

    if (!stored) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else if (stored === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;