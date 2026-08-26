"use client";

import { useEffect, useRef } from "react";
import Swal, { SweetAlertIcon } from "sweetalert2";

export interface SwalMessageEffectProps {
  message?: string | null;
  type?: SweetAlertIcon;
}

export default function SwalMessageEffect({ message, type = "error" }: SwalMessageEffectProps) {
  const lastMessageRef = useRef("");

  useEffect(() => {
    if (!message || lastMessageRef.current === message) {
      return;
    }

    lastMessageRef.current = message;

    Swal.fire({
      icon: type,
      text: message,
      confirmButtonColor: "#181b1c",
    });
  }, [message, type]);

  return null;
}
