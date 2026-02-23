import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Debug: check env vars
console.log("ENV CHECK:", {
  url: import.meta.env.VITE_SUPABASE_URL,
  key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "set" : "missing",
  allKeys: Object.keys(import.meta.env).filter(k => k.startsWith("VITE_"))
});

createRoot(document.getElementById("root")!).render(<App />);
