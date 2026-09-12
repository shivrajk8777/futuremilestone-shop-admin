"use client";

import { useTransition, useState, useEffect, ChangeEvent } from "react";
import Swal from "sweetalert2";
import { updateOrderStatusAction } from "./actions";

export interface StatusDropdownProps {
  orderId: string;
  currentStatus: string;
}

export default function StatusDropdown({ orderId, currentStatus }: StatusDropdownProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus]);

  const handleChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;

    if (newStatus === "Cancelled") {
      const result = await Swal.fire({
        title: "Cancel Order?",
        text: "Please enter the reason for cancelling this order:",
        input: "textarea",
        inputPlaceholder: "e.g., Customer requested cancellation, Item out of stock, Address not serviceable...",
        inputAttributes: {
          "aria-label": "Cancellation Reason",
          style: "font-size: 13px; font-family: inherit;",
          rows: "3",
        },
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Confirm Cancellation",
        cancelButtonText: "Keep Order",
        inputValidator: (value) => {
          if (!value || !value.trim()) {
            return "Please provide a reason for cancellation!";
          }
        },
      });

      if (!result.isConfirmed || !result.value) {
        // Reset dropdown to previous status
        setSelectedStatus(currentStatus);
        return;
      }

      const reason = result.value.trim();
      setSelectedStatus("Cancelled");

      const formData = new FormData();
      formData.append("status", "Cancelled");
      formData.append("reason", reason);

      startTransition(async () => {
        const res = await updateOrderStatusAction(orderId, formData);
        if (res?.error) {
          Swal.fire("Error", res.error, "error");
          setSelectedStatus(currentStatus);
        } else {
          Swal.fire({
            title: "Order Cancelled",
            text: "Order status updated to Cancelled with reason.",
            icon: "success",
            confirmButtonColor: "#0e1011",
            timer: 2000,
            showConfirmButton: false,
          });
        }
      });
      return;
    }

    setSelectedStatus(newStatus);
    const formData = new FormData();
    formData.append("status", newStatus);

    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, formData);
      if (res?.error) {
        Swal.fire("Error", res.error, "error");
        setSelectedStatus(currentStatus);
      }
    });
  };

  return (
    <div className="relative inline-block w-full max-w-[150px]">
      <select
        value={selectedStatus}
        onChange={handleChange}
        disabled={isPending}
        className={`w-full appearance-none rounded-full px-4 py-2 text-[13px] font-semibold bg-futuremilestone-ink/6 border-none focus:outline-none focus:ring-1 focus:ring-futuremilestone-accent transition cursor-pointer pr-8 ${
          selectedStatus === "Delivered"
            ? "text-futuremilestone-success bg-futuremilestone-success/12"
            : selectedStatus === "Out for Delivery"
              ? "text-amber-500 bg-amber-500/12"
              : ["Processing", "Accepted", "Dispatched", "Shipped"].includes(selectedStatus)
                ? "text-[#9b6b2b] bg-[#9b6b2b]/12"
                : ["Cancelled", "Refunded"].includes(selectedStatus)
                  ? "text-red-600 bg-red-600/12"
                  : "text-futuremilestone-ink"
        }`}
      >
        <option value="Processing">Processing</option>
        <option value="Accepted">Accepted</option>
        <option value="Dispatched">Dispatched</option>
        <option value="Shipped">Shipped</option>
        <option value="Out for Delivery">Out for Delivery</option>
        <option value="Delivered">Delivered</option>
        <option value="Cancelled">Cancelled</option>
        <option value="Refunded">Refunded</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-futuremilestone-muted">
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
