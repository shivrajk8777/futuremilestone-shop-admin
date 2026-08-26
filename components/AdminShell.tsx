"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, ReactNode } from "react";

const navigation = [
  { href: "/dashboard", label: "Dashboard", meta: "Overview" },
  { href: "/products", label: "Products", meta: "Catalog" },
  { href: "/collections", label: "Collections", meta: "Merch" },
  { href: "/orders", label: "Orders", meta: "Fulfillment" },
  { href: "/carts", label: "Active Carts", meta: "Customer Carts" },
  { href: "/discounts", label: "Discounts", meta: "Campaigns" },
  { href: "/blogs", label: "Blogs", meta: "Editorial" },
  { href: "/contacts", label: "Contacts", meta: "Inquiries" },
  { href: "/team", label: "Team Members", meta: "About Us" },
  { href: "/delivery-partners", label: "Delivery Partners", meta: "Shipping" },
  { href: "/master", label: "Master Settings", meta: "Configuration" },
  { href: "/chats", label: "Chats", meta: "Support" },
];

function getNavIcon(href: string) {
  switch (href) {
    case "/dashboard":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case "/products":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case "/collections":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    case "/orders":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      );
    case "/carts":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
      );
    case "/discounts":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      );
    case "/blogs":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      );
    case "/contacts":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case "/team":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case "/delivery-partners":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      );
    case "/master":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "/chats":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    default:
      return null;
  }
}

export interface AdminShellProps {
  admin: {
    id: string;
    email: string;
    role: string;
  };
  children: ReactNode;
}

export default function AdminShell({ admin, children }: AdminShellProps) {
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
    <div className="min-h-screen p-2 sm:p-3 bg-futuremilestone-bg text-futuremilestone-ink transition-colors duration-200">
      <div className="min-h-[calc(100vh-24px)] grid grid-cols-1 xl:grid-cols-[292px_minmax(0,1fr)] gap-3">
        <aside className="relative sticky top-3 self-start h-[calc(100vh-24px)] max-h-[calc(100vh-24px)] p-4 sm:p-5 bg-futuremilestone-panel backdrop-blur-[18px] border border-futuremilestone-soft-line rounded-[28px] shadow-futuremilestone-soft flex flex-col gap-3 overflow-y-auto scrollbar-none max-xl:static max-xl:h-auto max-xl:max-h-none">
          <div className="flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-futuremilestone-ink text-futuremilestone-bg grid place-items-center text-[16px] font-bold">F</div>
              <div className="block mt-0.5">
                <small className="block text-futuremilestone-muted text-[10px] tracking-[0.12em] uppercase">Futuremilestone</small>
                <strong className="block text-[18px] font-semibold tracking-[-0.04em] leading-tight">Admin</strong>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full bg-futuremilestone-accent-soft hover:bg-futuremilestone-ink text-futuremilestone-ink hover:text-futuremilestone-bg flex items-center justify-center transition-all cursor-pointer border border-futuremilestone-soft-line focus:outline-none"
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

          <nav className="flex-1 min-h-0 grid gap-1.5 border-0 overflow-y-auto pr-1 scrollbar-none" aria-label="Admin navigation">
            {navigation.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-futuremilestone-md border border-transparent transition-all duration-[180ms] hover:translate-x-0.5 hover:border-futuremilestone-line ${
                    active
                      ? "bg-futuremilestone-accent text-futuremilestone-bg"
                      : "bg-futuremilestone-panel-strong/40 text-futuremilestone-ink"
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-[9px] grid place-items-center flex-shrink-0 ${
                      active ? "bg-futuremilestone-bg/15 text-futuremilestone-bg" : "bg-futuremilestone-ink/8 text-futuremilestone-ink"
                    }`}
                  >
                    {getNavIcon(item.href)}
                  </span>
                  <span className="text-[13.5px] font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex-shrink-0 pt-2 border-t border-futuremilestone-soft-line">
            <div className="px-3.5 py-2.5 bg-futuremilestone-accent text-futuremilestone-bg rounded-xl border border-futuremilestone-soft-line flex items-center justify-between gap-2">
              <div className="min-w-0">
                <small className="block text-[9px] tracking-[0.12em] uppercase text-futuremilestone-bg/60 font-bold">Administrator</small>
                <p className="m-0 text-futuremilestone-bg/90 text-[12px] font-semibold truncate leading-tight">{admin.email}</p>
              </div>
              <form action="/api/auth/logout" method="post" className="flex-shrink-0">
                <button className="px-2.5 py-1 bg-futuremilestone-bg/20 hover:bg-futuremilestone-bg/30 text-futuremilestone-bg font-bold rounded-lg text-[11px] transition cursor-pointer" type="submit">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex flex-col gap-3">{children}</main>
      </div>
    </div>
  );
}
