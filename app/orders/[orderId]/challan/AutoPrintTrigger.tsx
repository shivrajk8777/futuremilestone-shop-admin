"use client";

import { useEffect } from "react";

export default function AutoPrintTrigger() {
  useEffect(() => {
    // Delay slightly to allow rendering styles/fonts properly before printing
    const timer = setTimeout(() => {
      try {
        window.print();
      } catch (e) {
        console.error("Print dialog failed to open automatically:", e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full px-6 py-2 bg-black text-white font-semibold text-[12px] hover:opacity-90 transition cursor-pointer"
    >
      Print Challan
    </button>
  );
}
