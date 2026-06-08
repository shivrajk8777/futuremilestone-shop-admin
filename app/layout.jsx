import { Suspense } from "react";
import { DM_Sans } from "next/font/google";
import AdminUrlAlertBridge from "../components/AdminUrlAlertBridge";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Futuremilestone Admin",
  description: "Admin dashboard for the Futuremilestone storefront.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                const saved = localStorage.getItem("theme");
                const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                const theme = saved || (dark ? "dark" : "light");
                document.documentElement.setAttribute("data-theme", theme);
              } catch (e) {}
            })()`,
          }}
        />
      </head>
      <body className={dmSans.className}>
        <Suspense fallback={null}>
          <AdminUrlAlertBridge />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
