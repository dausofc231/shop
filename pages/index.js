// pages/index.js
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/home");
    }, 1500); // 1.5 detik loading
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "8px"
      }}
    >
      <div style={{ fontSize: "24px", fontWeight: "bold" }}>Loading...</div>
      <div>mengalihkan ke katalog produk</div>
    </div>
  );
}