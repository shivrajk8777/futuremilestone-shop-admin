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
