"use client";

import { useState, useEffect, FormEvent } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import {
  acceptOrderAction,
  cancelOrderAction,
  dispatchOrderAction,
  markDeliveredAction,
  refundOrderAction,
} from "../actions";

export interface OrderActionsProps {
  orderId: string;
  orderNumber: string;
  currentStatus: string;
  customerEmail: string;
  customerName: string;
}

export default function OrderActions({
  orderId,
  orderNumber,
  currentStatus,
  customerEmail,
  customerName,
}: OrderActionsProps) {
  const [isPending, setIsPending] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Form states
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [adminMessage, setAdminMessage] = useState("");

  // Load delivery partners when modal opens
  useEffect(() => {
    if (isDispatchModalOpen) {
      fetch("/api/delivery-partners")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const active = data.partners.filter((p: any) => p.active);
            setDeliveryPartners(active);
            if (active.length > 0) {
              setSelectedPartnerId(active[0].id);
            }
          }
        })
        .catch((err) => console.error("Error loading delivery partners:", err));
    }
  }, [isDispatchModalOpen]);

  const selectedPartner = deliveryPartners.find((p) => p.id === selectedPartnerId);
  const partnerName = selectedPartner ? selectedPartner.name : "Courier Partner";
  const partnerLogo = selectedPartner ? selectedPartner.logo : "🚚";

  const handleAccept = async () => {
    const result = await Swal.fire({
      title: "Accept Order?",
      text: `Are you sure you want to accept order ${orderNumber}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0e1011",
      confirmButtonText: "Accept Order",
    });

    if (result.isConfirmed) {
      setIsPending(true);
      const res = await acceptOrderAction(orderId);
      setIsPending(false);

      if (res?.success) {
        Swal.fire({
          title: "Accepted!",
          text: "Order marked as Accepted.",
          icon: "success",
          confirmButtonColor: "#0e1011",
        });
      } else {
        Swal.fire("Error", res?.error || "Failed to accept order.", "error");
      }
    }
  };

  const handleCancel = async () => {
    const { value: reason } = await Swal.fire({
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

    if (reason) {
      setIsPending(true);
      const res = await cancelOrderAction(orderId, reason);
      setIsPending(false);

      if (res?.success) {
        Swal.fire({
          title: "Cancelled!",
          text: "Order has been cancelled.",
          icon: "success",
          confirmButtonColor: "#0e1011",
        });
      } else {
        Swal.fire("Error", res?.error || "Failed to cancel order.", "error");
      }
    }
  };

  const handleRefund = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Process Refund",
      html: `
        <div style="text-align: left; font-size: 13px; font-family: inherit;">
          <label style="display: block; font-weight: 600; margin-bottom: 6px; color: #111;">Refund Note / Reason</label>
          <textarea id="swal-refund-reason" class="swal2-textarea" style="width: 100%; margin: 0 0 14px 0; font-size: 13px; box-sizing: border-box; resize: vertical;" rows="2" placeholder="e.g. Order cancelled - full refund initiated to customer"></textarea>

          <label style="display: block; font-weight: 600; margin-bottom: 6px; color: #111;">Transaction / Reference ID (Optional)</label>
          <input id="swal-refund-txnid" class="swal2-input" style="width: 100%; margin: 0; font-size: 13px; box-sizing: border-box; font-family: monospace;" placeholder="e.g. rfnd_984729104 or Bank UTR" />
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: "#7c3aed",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Confirm & Process Refund",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        const reason = (document.getElementById("swal-refund-reason") as HTMLTextAreaElement)?.value;
        const refundTxnId = (document.getElementById("swal-refund-txnid") as HTMLInputElement)?.value;
        return {
          reason: reason?.trim() || "Full refund processed for cancelled order.",
          refundTxnId: refundTxnId?.trim() || "",
        };
      },
    });

    if (formValues) {
      setIsPending(true);
      const res = await refundOrderAction(orderId, formValues);
      setIsPending(false);

      if (res?.success) {
        Swal.fire({
          title: "Refund Processed!",
          text: "Order marked as Refunded and notification sent to customer.",
          icon: "success",
          confirmButtonColor: "#0e1011",
        });
      } else {
        Swal.fire("Error", res?.error || "Failed to process refund.", "error");
      }
    }
  };

  const handleDeliver = async () => {
    const result = await Swal.fire({
      title: "Mark as Delivered?",
      text: "Has the courier delivered this order?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2f5a4f",
      confirmButtonText: "Yes, Delivered",
    });

    if (result.isConfirmed) {
      setIsPending(true);
      const res = await markDeliveredAction(orderId);
      setIsPending(false);

      if (res?.success) {
        Swal.fire({
          title: "Delivered!",
          text: "Order status updated to Delivered.",
          icon: "success",
          confirmButtonColor: "#0e1011",
        });
      } else {
        Swal.fire("Error", res?.error || "Failed to mark delivered.", "error");
      }
    }
  };

  const handleDispatchSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId) {
      Swal.fire("Warning", "Please select a delivery partner.", "warning");
      return;
    }
    if (!trackingId || !trackingId.trim()) {
      Swal.fire("Warning", "Please enter a tracking ID.", "warning");
      return;
    }

    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #111;">
        <h2>FUTURE MILESTONE</h2>
        <h3>Your Order ${orderNumber} Has Been Dispatched!</h3>
        <p>Dear ${customerName || 'Customer'},</p>
        <p>Your package is on its way via <strong>${partnerName}</strong> with tracking number: <strong>${trackingId.trim()}</strong>.</p>
        ${adminMessage.trim() ? `<p><em>Note: "${adminMessage.trim()}"</em></p>` : ''}
        <p>Thank you for shopping with Futuremilestone.</p>
      </div>
    `;

    setIsPending(true);
    const res = await dispatchOrderAction(orderId, {
      trackingId: trackingId.trim(),
      deliveryPartnerId: selectedPartnerId,
      deliveryPartnerName: partnerName,
      adminMessage: adminMessage.trim(),
      sendToUser: true,
      sendToAdmin: true,
      emailPreviewHtml: emailHtml,
    });
    setIsPending(false);

    if (res?.success) {
      setIsDispatchModalOpen(false);
      setTrackingId("");
      setAdminMessage("");
      Swal.fire({
        title: "Dispatched!",
        text: "Order marked as Dispatched.",
        icon: "success",
        confirmButtonColor: "#0e1011",
      });
    } else {
      Swal.fire("Error", res?.error || "Failed to dispatch order.", "error");
    }
  };

  const openChallanPrint = () => {
    window.open(`/orders/${orderId}/challan`, "_blank");
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Accept button */}
      {currentStatus === "Processing" && (
        <button
          onClick={handleAccept}
          disabled={isPending}
          className="w-full text-center rounded-xl py-3 bg-futuremilestone-accent text-futuremilestone-bg font-semibold text-[13px] hover:bg-opacity-90 transition-all cursor-pointer disabled:opacity-50"
        >
          Accept Order
        </button>
      )}

      {/* Dispatch button */}
      {currentStatus === "Accepted" && (
        <button
          onClick={() => setIsDispatchModalOpen(true)}
          disabled={isPending}
          className="w-full text-center rounded-xl py-3 bg-futuremilestone-accent text-futuremilestone-bg font-semibold text-[13px] hover:bg-opacity-90 transition-all cursor-pointer disabled:opacity-50"
        >
          Dispatch Order
        </button>
      )}

      {/* Mark Delivered button */}
      {(currentStatus === "Dispatched" || currentStatus === "Shipped" || currentStatus === "Out for Delivery") && (
        <button
          onClick={handleDeliver}
          disabled={isPending}
          className="w-full text-center rounded-xl py-3 bg-futuremilestone-success text-futuremilestone-panel-strong border border-futuremilestone-success/20 font-semibold text-[13px] hover:bg-opacity-95 transition-all cursor-pointer disabled:opacity-50"
        >
          Mark as Delivered
        </button>
      )}

      {/* Print Challan button */}
      {["Accepted", "Dispatched", "Shipped", "Out for Delivery", "Delivered"].includes(currentStatus) && (
        <button
          onClick={openChallanPrint}
          className="w-full text-center rounded-xl py-3 bg-futuremilestone-panel-strong border border-futuremilestone-soft-line text-futuremilestone-ink font-semibold text-[13px] hover:bg-futuremilestone-bg/30 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>🖨️</span> Print Challan
        </button>
      )}

      {/* Process Refund button (For Cancelled or Delivered orders) */}
      {["Cancelled", "Delivered"].includes(currentStatus) && (
        <button
          onClick={handleRefund}
          disabled={isPending}
          className="w-full text-center rounded-xl py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[13px] shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span>💳</span> Process Refund
        </button>
      )}

      {/* Refunded indicator */}
      {currentStatus === "Refunded" && (
        <div className="w-full text-center py-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 font-semibold text-[13px] flex items-center justify-center gap-2">
          <span>✓</span> Refund Completed
        </div>
      )}

      {/* Cancel button */}
      {["Processing", "Accepted", "Dispatched", "Shipped", "Out for Delivery"].includes(currentStatus) && (
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="w-full text-center rounded-xl py-3 border border-red-500/20 text-red-500 hover:bg-red-500/5 font-semibold text-[13px] transition-all cursor-pointer disabled:opacity-50"
        >
          Cancel Order
        </button>
      )}

      {/* Sleek Minimal Dispatch Modal */}
      {mounted && isDispatchModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-[460px] w-full p-6 shadow-2xl border border-gray-100 animate-fade-in text-gray-900">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-lg">
                  📦
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-tight">Dispatch Order</h3>
                  <p className="text-xs text-gray-500 font-medium font-mono">{orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition cursor-pointer text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleDispatchSubmit} className="mt-5 space-y-4">

              {/* Delivery Partner */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Delivery Partner</label>
                {deliveryPartners.length === 0 ? (
                  <div className="text-xs p-3 rounded-xl bg-red-50 text-red-600 font-medium border border-red-100">
                    No active delivery partners found.
                  </div>
                ) : (
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-gray-900 focus:outline-none focus:border-black cursor-pointer"
                  >
                    {deliveryPartners.map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.logo} {partner.name} ({partner.transitTime})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Tracking ID */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Tracking Number / AWB</label>
                <input
                  type="text"
                  required
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="e.g. AWB-9847201934"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              {/* Note for Customer */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Note for Customer (Optional)</label>
                <textarea
                  rows={2}
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  placeholder="Dispatched from Mumbai warehouse..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-black resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  disabled={isPending || deliveryPartners.length === 0}
                  className="flex-1 rounded-xl py-3 bg-black text-white font-bold text-xs hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {isPending ? "Dispatching..." : "Confirm & Dispatch"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
