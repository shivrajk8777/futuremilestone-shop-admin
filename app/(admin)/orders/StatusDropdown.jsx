"use client";

import { useTransition } from "react";
import { updateOrderStatusAction } from "./actions";

export default function StatusDropdown({ orderId, currentStatus }) {
  const [isPending, startTransition] = useTransition();

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    const formData = new FormData();
    formData.append("status", newStatus);

    startTransition(async () => {
      await updateOrderStatusAction(orderId, formData);
    });
  };

  return (
    <div className="relative inline-block w-full max-w-[150px]">
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={isPending}
        className={`w-full appearance-none rounded-full px-4 py-2 text-[13px] font-semibold bg-fjord-ink/6 border-none focus:outline-none focus:ring-1 focus:ring-fjord-accent transition cursor-pointer pr-8 ${
          currentStatus === "Delivered"
            ? "text-fjord-success bg-fjord-success/12"
            : currentStatus === "Processing" || currentStatus === "Shipped"
              ? "text-[#9b6b2b] bg-[#9b6b2b]/12"
              : currentStatus === "Refunded"
                ? "text-red-600 bg-red-600/12"
                : "text-fjord-ink"
        }`}
      >
        <option value="Processing">Processing</option>
        <option value="Shipped">Shipped</option>
        <option value="Delivered">Delivered</option>
        <option value="Refunded">Refunded</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-fjord-muted">
        {isPending ? (
          <svg className="animate-spin h-3.5 w-3.5 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
    </div>
  );
}
