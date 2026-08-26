"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";

export default function AdminUrlAlertBridge() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledValueRef = useRef("");

  useEffect(() => {
    const status = searchParams.get("status");
    const message = searchParams.get("message");

    if (!status || !message) {
      handledValueRef.current = "";
      return;
    }

    const signature = `${status}:${message}:${pathname}`;

    if (handledValueRef.current === signature) {
      return;
    }

    handledValueRef.current = signature;

    Swal.fire({
      icon: status === "success" ? "success" : "error",
      text: message,
      confirmButtonColor: "#181b1c",
    }).finally(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("status");
      params.delete("message");
      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(nextUrl, { scroll: false });
    });
  }, [pathname, router, searchParams]);

  return null;
}
