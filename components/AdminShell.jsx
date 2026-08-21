"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navigation = [
  {
    href: "/dashboard",
    label: "Dashboard",
    meta: "Overview",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    href: "/products",
    label: "Products",
    meta: "Catalog",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    href: "/collections",
    label: "Collections",
    meta: "Merch",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    href: "/orders",
    label: "Orders",
    meta: "Fulfillment",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    href: "/discounts",
    label: "Discounts",
    meta: "Campaigns",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    href: "/blogs",
    label: "Blogs",
    meta: "Editorial",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
  {
    href: "/contacts",
    label: "Contacts",
    meta: "Inquiries",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/team",
    label: "Team Members",
    meta: "About Us",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    href: "/delivery-partners",
    label: "Delivery Partners",
    meta: "Shipping",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
  },
  {
    href: "/master",
    label: "Master Settings",
    meta: "Configuration",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: "/chats",
    label: "Chats",
    meta: "Support",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
];

export default function AdminShell({ admin, children }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState("light");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");
    setTheme(initialTheme);
  }, []);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-fjord-soft-line">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-fjord-ink text-fjord-bg grid place-items-center text-[16px] font-bold shadow-sm">
            F
          </div>
          <div className="block">
            <small className="block text-fjord-muted text-[10px] tracking-[0.14em] uppercase font-semibold">Futuremilestone</small>
            <strong className="block text-[18px] font-bold tracking-[-0.04em] leading-tight">Admin</strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
      </div>

      <nav className="flex-1 overflow-y-auto my-3 pr-1 grid gap-1.5 scrollbar-thin" aria-label="Admin navigation">
        {navigation.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[16px] border transition-all duration-150 ${
                active
                  ? "bg-fjord-accent text-fjord-bg border-transparent shadow-sm font-semibold"
                  : "bg-fjord-panel-strong/40 text-fjord-ink border-transparent hover:bg-fjord-panel-strong hover:border-fjord-soft-line"
              }`}
            >
              <span
                className={`w-8 h-8 rounded-[10px] grid place-items-center flex-shrink-0 transition-colors ${
                  active ? "bg-fjord-bg/20 text-fjord-bg" : "bg-fjord-ink/8 text-fjord-ink"
                }`}
              >
                {item.icon}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] leading-tight truncate">{item.label}</span>
                <span className={`text-[10px] tracking-wide ${active ? "text-fjord-bg/70" : "text-fjord-muted"}`}>{item.meta}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="pt-2 border-t border-fjord-soft-line grid gap-2.5">
        <div className="p-3 bg-fjord-accent text-fjord-bg rounded-[20px] border border-fjord-soft-line flex items-center justify-between gap-2 overflow-hidden">
          <div className="min-w-0">
            <small className="block text-[9px] tracking-[0.12em] uppercase text-fjord-bg/60 font-semibold">Administrator</small>
            <p className="mt-0.5 mb-0 text-fjord-bg/90 text-[12px] font-medium leading-snug truncate">{admin?.email}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" title="Active session" />
        </div>

        <form action="/api/auth/logout" className="block" method="post">
          <button
            className="w-full text-center rounded-full px-4 py-2 border border-fjord-line bg-fjord-panel-strong text-fjord-ink font-semibold transition hover:bg-fjord-accent hover:text-fjord-bg active:scale-[0.98] cursor-pointer text-[13px]"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="min-h-screen p-2 sm:p-3 text-fjord-ink">
      {/* Top Header Bar for Mobile & Tablet screens (< lg) */}
      <header className="lg:hidden flex items-center justify-between p-3.5 mb-3 bg-fjord-panel border border-fjord-soft-line rounded-[24px] shadow-fjord-soft backdrop-blur-[18px]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-10 h-10 rounded-[14px] bg-fjord-panel-strong border border-fjord-soft-line text-fjord-ink flex items-center justify-center transition active:scale-95 cursor-pointer"
            aria-label="Open sidebar menu"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-fjord-ink text-fjord-bg grid place-items-center text-[14px] font-bold">
              F
            </div>
            <div>
              <small className="block text-fjord-muted text-[9px] tracking-[0.12em] uppercase font-semibold">Futuremilestone</small>
              <strong className="block text-[15px] font-bold leading-none">Admin Panel</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full bg-fjord-accent-soft text-fjord-ink flex items-center justify-center border border-fjord-soft-line cursor-pointer"
            title="Toggle theme"
            type="button"
          >
            {theme === "light" ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer (< lg) */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-[290px] p-4 bg-fjord-panel backdrop-blur-[24px] border-r border-fjord-soft-line shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-fjord-soft-line">
          <span className="text-[12px] font-semibold text-fjord-muted tracking-wider uppercase">Menu</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 rounded-full bg-fjord-ink/10 text-fjord-ink grid place-items-center cursor-pointer hover:bg-fjord-ink/20"
            aria-label="Close menu"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop Layout Grid (>= lg) */}
      <div className="min-h-[calc(100vh-24px)] grid grid-cols-1 lg:grid-cols-[270px_minmax(0,1fr)] xl:grid-cols-[285px_minmax(0,1fr)] gap-3">
        {/* Desktop Sticky Sidebar */}
        <aside className="hidden lg:flex sticky top-3 self-start h-[calc(100vh-24px)] p-5 bg-fjord-panel backdrop-blur-[18px] border border-fjord-soft-line rounded-[32px] shadow-fjord-soft flex-col overflow-hidden">
          {sidebarContent}
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 flex flex-col gap-3">{children}</main>
      </div>
    </div>
  );
}

