import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  };
  return (
    <button className="btn-ghost" onClick={toggle} aria-label="Toggle dark mode" title="Toggle dark mode">
      {dark ? "\u2600 Light" : "\u263E Dark"}
    </button>
  );
}
