"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navigation = [
  { href: "/dashboard", label: "Dashboard", meta: "Overview", icon: "01" },
  { href: "/products", label: "Products", meta: "Catalog", icon: "02" },
  { href: "/collections", label: "Collections", meta: "Merch", icon: "03" },
  { href: "/orders", label: "Orders", meta: "Fulfillment", icon: "04" },
  { href: "/blogs", label: "Blogs", meta: "Editorial", icon: "05" },
];

export default function AdminShell({ admin, children }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");
    setTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <div className="min-h-screen p-2 sm:p-3 text-fjord-ink">
      <div className="min-h-[calc(100vh-24px)] grid grid-cols-1 xl:grid-cols-[292px_minmax(0,1fr)] gap-3">
        <aside className="relative sticky top-3 self-start min-h-[calc(100vh-24px)] p-4 sm:p-6 bg-fjord-panel backdrop-blur-[18px] border border-fjord-soft-line rounded-[36px] shadow-fjord-soft flex flex-col gap-6 overflow-hidden max-xl:static max-xl:min-h-0 sidebar-pattern">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-fjord-ink text-fjord-bg grid place-items-center text-[16px] font-bold">F</div>
              <div className="block mt-0.5">
                <small className="block text-fjord-muted text-[10px] tracking-[0.12em] uppercase">Futuremilestone</small>
                <strong className="block text-[18px] font-semibold tracking-[-0.04em] leading-tight">Admin</strong>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full bg-fjord-accent-soft hover:bg-fjord-ink text-fjord-ink hover:text-fjord-bg flex items-center justify-center transition-all cursor-pointer border border-fjord-soft-line focus:outline-none"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              type="button"
            >
              {theme === "light" ? (
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              )}
            </button>
          </div>

          <nav className="grid gap-2.5" aria-label="Admin navigation">
            {navigation.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-fjord-md border border-transparent transition-all duration-[180ms] hover:translate-x-0.5 hover:border-fjord-line ${
                    active
                      ? "bg-fjord-accent text-fjord-bg"
                      : "bg-fjord-panel-strong/40 text-fjord-ink"
                  }`}
                >
                  <span
                    className={`w-[34px] h-[34px] rounded-[10px] grid place-items-center text-[14px] flex-shrink-0 ${
                      active ? "bg-fjord-bg/15" : "bg-fjord-ink/8"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[14px] font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto grid gap-3">
            <div className="p-4 bg-fjord-accent text-fjord-bg rounded-fjord-md border border-fjord-soft-line">
              <small className="block text-[10px] tracking-[0.12em] uppercase text-fjord-bg/60">Administrator</small>
              <p className="mt-1.5 mb-0 text-fjord-bg/80 text-[13px] leading-snug truncate">{admin.email}</p>
            </div>

            <form action="/api/auth/logout" className="block" method="post">
              <button className="w-full text-center rounded-full px-4 py-2.5 border border-fjord-line bg-fjord-panel-strong text-fjord-ink font-semibold transition hover:bg-fjord-accent hover:text-fjord-bg active:scale-[0.98] cursor-pointer text-[13px]" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <main className="min-w-0 flex flex-col gap-3">{children}</main>
      </div>
    </div>
  );
}
