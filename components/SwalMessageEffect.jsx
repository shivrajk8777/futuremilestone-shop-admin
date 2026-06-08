"use client";

import { useEffect, useRef } from "react";
import Swal from "sweetalert2";

export default function SwalMessageEffect({ message, type = "error" }) {
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
