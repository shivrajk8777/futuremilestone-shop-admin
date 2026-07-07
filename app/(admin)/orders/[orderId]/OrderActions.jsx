"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import {
  acceptOrderAction,
  cancelOrderAction,
  dispatchOrderAction,
  markDeliveredAction,
} from "../actions";

export default function OrderActions({
  orderId,
  orderNumber,
  currentStatus,
  customerEmail,
  customerName,
}) {
  const [isPending, setIsPending] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Dispatch modal form states
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [sendToUser, setSendToUser] = useState(true);
  const [sendToAdmin, setSendToAdmin] = useState(true);

  // Load delivery partners when dispatch modal opens
  useEffect(() => {
    if (isDispatchModalOpen) {
      fetch("/api/delivery-partners")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const active = data.partners.filter((p) => p.active);
            setDeliveryPartners(active);
            if (active.length > 0) {
              setSelectedPartnerId(active[0].id);
            }
          }
        })
        .catch((err) => console.error("Error loading delivery partners:", err));
    }
  }, [isDispatchModalOpen]);

  // Derived values for email preview
  const selectedPartner = deliveryPartners.find((p) => p.id === selectedPartnerId);
  const partnerName = selectedPartner ? selectedPartner.name : "Courier Services";
  const partnerLogo = selectedPartner ? selectedPartner.logo : "🚚";

  const emailPreviewHtml = `
    <div style="font-family: 'DM Sans', -apple-system, sans-serif; max-width: 100%; padding: 20px; border: 1px solid #ececec; border-radius: 12px; background-color: #ffffff; color: #0e1011; font-size: 13px;">
      <div style="text-align: center; border-bottom: 1px solid #ececec; padding-bottom: 15px; margin-bottom: 15px;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #0e1011;">fjord</h2>
        <span style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #0e101199; display: block; margin-top: 2px;">Future Milestone</span>
      </div>
      <h3 style="font-size: 15px; font-weight: 600; margin-top: 0; margin-bottom: 10px; color: #0e1011;">Your Order Has Been Dispatched!</h3>
      <div style="line-height: 1.5; color: #0e101199; margin-bottom: 15px;">
        <p>Dear ${customerName},</p>
        <p>Your order <strong>${orderNumber}</strong> has been shipped and is on its way to you.</p>
        
        <div style="background-color: #f6f6f6; border-radius: 8px; padding: 12px; margin: 12px 0; border: 1px solid #ececec;">
          <h4 style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0e1011;">Shipment Details</h4>
          <table style="width: 100%; font-size: 12px;">
            <tr>
              <td style="color: #0e101199;"><strong>Courier:</strong></td>
              <td style="color: #0e1011; text-align: right;">${partnerLogo} ${partnerName}</td>
            </tr>
            <tr>
              <td style="color: #0e101199;"><strong>Tracking ID:</strong></td>
              <td style="color: #0e1011; font-family: monospace; text-align: right;">${trackingId || "N/A"}</td>
            </tr>
          </table>
        </div>

        <p style="margin-top: 10px; font-size: 11px;"><strong>Message from Fjord team:</strong></p>
        <p style="background-color: #fcfbf9; border-left: 3px solid #d8ccb7; padding: 8px 12px; margin: 5px 0; font-style: italic; font-size: 12px; color: #0e1011;">
          "${adminMessage || `Your order has been dispatched via ${partnerName}.`}"
        </p>
      </div>
      <div style="border-top: 1px solid #ececec; padding-top: 15px; text-align: center; font-size: 10px; color: #0e10114d;">
        <p style="margin: 0;">This is an automated notification from Fjord.</p>
      </div>
    </div>
  `;

  const handleAccept = async () => {
    const result = await Swal.fire({
      title: "Accept Order?",
      text: `Are you sure you want to accept order ${orderNumber}? This will mark it as processing/accepted.`,
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
          text: "Order has been marked as Accepted. Status update mail sent to user.",
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
      title: "Cancel Order",
      input: "text",
      inputLabel: "Reason for cancellation",
      inputPlaceholder: "Enter the cancellation explanation...",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Cancel Order",
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return "Please write a reason!";
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
          text: "Order has been cancelled. Notification email sent to customer.",
          icon: "success",
          confirmButtonColor: "#0e1011",
        });
      } else {
        Swal.fire("Error", res?.error || "Failed to cancel order.", "error");
      }
    }
  };

  const handleDeliver = async () => {
    const result = await Swal.fire({
      title: "Mark as Delivered?",
      text: "Has the courier successfully delivered this order?",
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
          text: "Order status updated to Delivered. Receipt confirmation mail sent.",
          icon: "success",
          confirmButtonColor: "#0e1011",
        });
      } else {
        Swal.fire("Error", res?.error || "Failed to mark delivered.", "error");
      }
    }
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPartnerId) {
      Swal.fire("Warning", "Please select a delivery partner.", "warning");
      return;
    }
    if (!trackingId || !trackingId.trim()) {
      Swal.fire("Warning", "Please enter a tracking ID.", "warning");
      return;
    }

    setIsPending(true);
    const res = await dispatchOrderAction(orderId, {
      trackingId: trackingId.trim(),
      deliveryPartnerId: selectedPartnerId,
      deliveryPartnerName: partnerName,
      adminMessage: adminMessage.trim(),
      sendToUser,
      sendToAdmin,
      emailPreviewHtml,
    });
    setIsPending(false);

    if (res?.success) {
      setIsDispatchModalOpen(false);
      // Reset form
      setTrackingId("");
      setAdminMessage("");
      Swal.fire({
        title: "Dispatched!",
        text: "Order marked as Dispatched. Mail sent to configured destinations.",
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
      {/* Accept button - visible in Processing */}
      {currentStatus === "Processing" && (
        <button
          onClick={handleAccept}
          disabled={isPending}
          className="w-full text-center rounded-xl py-3 bg-fjord-accent text-fjord-bg font-semibold text-[13px] hover:bg-opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Accept Order
        </button>
      )}

      {/* Dispatch button - visible in Accepted */}
      {currentStatus === "Accepted" && (
        <button
          onClick={() => setIsDispatchModalOpen(true)}
          disabled={isPending}
          className="w-full text-center rounded-xl py-3 bg-fjord-accent text-fjord-bg font-semibold text-[13px] hover:bg-opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Dispatch Order
        </button>
      )}

      {/* Mark Delivered button - visible in Dispatched/Shipped */}
      {(currentStatus === "Dispatched" || currentStatus === "Shipped") && (
        <button
          onClick={handleDeliver}
          disabled={isPending}
          className="w-full text-center rounded-xl py-3 bg-fjord-success text-fjord-panel-strong border border-fjord-success/20 font-semibold text-[13px] hover:bg-opacity-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Mark as Delivered
        </button>
      )}

      {/* Print Challan button - visible once accepted, dispatched, or delivered */}
      {["Accepted", "Dispatched", "Shipped", "Delivered"].includes(currentStatus) && (
        <button
          onClick={openChallanPrint}
          className="w-full text-center rounded-xl py-3 bg-fjord-panel-strong border border-fjord-soft-line text-fjord-ink font-semibold text-[13px] hover:bg-fjord-bg/30 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>🖨️</span> Print Challan
        </button>
      )}

      {/* Cancel button - visible in Processing / Accepted */}
      {["Processing", "Accepted"].includes(currentStatus) && (
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="w-full text-center rounded-xl py-3 border border-red-500/20 text-red-500 hover:bg-red-500/5 font-semibold text-[13px] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel Order
        </button>
      )}

      {/* Dispatch Modal Dialog */}
      {mounted && isDispatchModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-fjord-panel-strong border border-fjord-soft-line rounded-[28px] max-w-4xl w-full max-h-[90vh] flex flex-col shadow-fjord-soft overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="px-6 py-5 border-b border-fjord-soft-line flex justify-between items-center bg-fjord-bg/10">
              <div>
                <h3 className="text-[18px] font-bold text-fjord-ink">Dispatch Shipment</h3>
                <p className="text-fjord-muted text-[12px] mt-0.5">Assign courier partner and tracking details for order {orderNumber}</p>
              </div>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="w-8 h-8 rounded-full border border-fjord-soft-line flex items-center justify-center hover:bg-fjord-bg/40 text-fjord-muted hover:text-fjord-ink transition cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Split Content */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {/* Form Input fields */}
              <form onSubmit={handleDispatchSubmit} className="space-y-4">
                {/* Select Partner */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-fjord-muted">Delivery Partner</label>
                  {deliveryPartners.length === 0 ? (
                    <div className="text-[12px] p-3 rounded-xl border border-red-500/10 text-red-500 bg-red-500/5">
                      No active delivery partners configured. Please add/enable them under the "Delivery Partners" tab first.
                    </div>
                  ) : (
                    <select
                      value={selectedPartnerId}
                      onChange={(e) => setSelectedPartnerId(e.target.value)}
                      required
                      className="w-full bg-fjord-input-bg border border-fjord-soft-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-fjord-ink cursor-pointer"
                    >
                      {deliveryPartners.map((partner) => (
                        <option key={partner.id} value={partner.id}>
                          {partner.logo} {partner.name} (${partner.price.toFixed(2)} - {partner.transitTime})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Tracking ID */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-fjord-muted">Tracking ID</label>
                  <input
                    type="text"
                    required
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    placeholder="Enter air waybill (AWB) or tracking number..."
                    className="w-full bg-fjord-input-bg border border-fjord-soft-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-fjord-ink font-mono"
                  />
                </div>

                {/* Admin Message */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-fjord-muted">Admin Message / Note for User</label>
                  <textarea
                    rows={3}
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    placeholder="Your package is dispatched from our Mumbai warehouse..."
                    className="w-full bg-fjord-input-bg border border-fjord-soft-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-fjord-ink resize-none"
                  />
                </div>

                {/* Print Challan shortcut */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={openChallanPrint}
                    className="inline-flex items-center gap-1.5 text-xs text-fjord-muted hover:text-fjord-ink underline cursor-pointer"
                  >
                    <span>🖨️</span> Print Challan Invoice (opens in new tab)
                  </button>
                </div>

                {/* Checkboxes for Mail Destinations */}
                <div className="border-t border-fjord-soft-line pt-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-fjord-muted block">Send notifications to:</span>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2.5 text-[13px] font-medium text-fjord-ink cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={sendToUser}
                        onChange={(e) => setSendToUser(e.target.checked)}
                        className="rounded border-gray-300 accent-black w-4.5 h-4.5"
                      />
                      <span>Store Customer (${customerEmail})</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-[13px] font-medium text-fjord-ink cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={sendToAdmin}
                        onChange={(e) => setSendToAdmin(e.target.checked)}
                        className="rounded border-gray-300 accent-black w-4.5 h-4.5"
                      />
                      <span>Admin Self Copy</span>
                    </label>
                  </div>
                </div>

                {/* Submit action */}
                <div className="pt-4 flex gap-3 border-t border-fjord-soft-line">
                  <button
                    type="submit"
                    disabled={isPending || deliveryPartners.length === 0}
                    className="flex-1 rounded-xl py-3 bg-fjord-accent text-fjord-bg font-bold text-[13px] hover:bg-opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? "Dispatching..." : "Submit Dispatch"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDispatchModalOpen(false)}
                    className="px-5 rounded-xl border border-fjord-line bg-fjord-panel-strong text-fjord-ink font-semibold text-[13px] hover:bg-fjord-bg/30 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              {/* Live Preview Column */}
              <div className="border-l border-fjord-soft-line pl-6 flex flex-col gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-fjord-muted block">Live Email Preview</span>
                <div className="flex-1 overflow-y-auto max-h-[360px] border border-fjord-soft-line rounded-xl bg-gray-50/50 p-2">
                  <div dangerouslySetInnerHTML={{ __html: emailPreviewHtml }} />
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
