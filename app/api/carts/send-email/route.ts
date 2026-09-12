import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { sendEmail } from "@/lib/email";
import { ObjectId } from "mongodb";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { cartId, slug, sendAll } = body;

    const db = await getDatabase();
    const cartsCollection = db.collection("carts");
    const usersCollection = db.collection("users");

    let targetCarts: any[] = [];

    if (sendAll) {
      targetCarts = await cartsCollection.find({}).toArray();
    } else if (slug) {
      targetCarts = await cartsCollection
        .find({
          $or: [{ "items.product.slug": slug }, { "items.slug": slug }],
        })
        .toArray();
    } else if (cartId) {
      const cart = await cartsCollection.findOne({ _id: new ObjectId(cartId) });
      if (cart) {
        targetCarts = [cart];
      }
    }

    if (targetCarts.length === 0) {
      return NextResponse.json(
        { success: false, error: "No target cart(s) found." },
        { status: 404 }
      );
    }

    const shopUrl = process.env.NEXT_PUBLIC_SHOP_URL || "http://localhost:3001";
    const checkoutUrl = `${shopUrl}/checkout`;

    let successCount = 0;
    let failCount = 0;
    let lastError: string | null = null;

    for (const cart of targetCarts) {
      const itemsRaw = cart.items || [];
      if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
        continue;
      }

      let user: any = null;
      if (cart.userId) {
        user = await usersCollection.findOne({ _id: new ObjectId(cart.userId) });
      }

      const recipientEmail = user?.email;
      if (!recipientEmail) {
        failCount++;
        lastError = "Missing recipient email address.";
        continue;
      }

      const customerName = user?.name || "Valued Customer";

      const items = itemsRaw.map((raw: any) => {
        const prod = raw.product || {};
        const price = Number(prod.price || raw.price || 0);
        const quantity = Number(raw.quantity || 1);
        const rawImg = prod.imageUrl || prod.image || raw.imageUrl || raw.image;
        const storeUrl = process.env.NEXT_PUBLIC_STORE_URL || "https://futuremilestone.shop";
        let imageUrl = "https://res.cloudinary.com/dhkf4qmql/image/upload/futuremilestone/futuremilestone_logo.png";
        if (rawImg) {
          if (rawImg.startsWith("http://") || rawImg.startsWith("https://")) {
            imageUrl = rawImg;
          } else {
            imageUrl = `${storeUrl.replace(/\/$/, "")}${rawImg.startsWith("/") ? "" : "/"}${rawImg}`;
          }
        }

        return {
          name: prod.name || raw.name || "Product",
          variant: [prod.selectedMaterial || raw.selectedMaterial, prod.selectedDimension || raw.selectedDimension]
            .filter(Boolean)
            .join(" • ") || "Standard",
          imageUrl,
          price,
          quantity,
          total: price * quantity,
        };
      });

      const totalValue = items.reduce((sum, item) => sum + item.total, 0);

      const itemsRowsHtml = items
        .map(
          (item) => `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 8px 10px 0; width: 52px; vertical-align: middle;">
              <img src="${item.imageUrl}" alt="${item.name}" width="48" height="48" style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb; display: block;" />
            </td>
            <td style="padding: 10px 8px; vertical-align: middle;">
              <div style="font-weight: 700; color: #111827; font-size: 13.5px; line-height: 1.3;">${item.name}</div>
              <span style="font-size: 11px; font-weight: 400; color: #6b7280; display: block; margin-top: 2px;">${item.variant}</span>
            </td>
            <td style="padding: 10px 8px; text-align: center; font-weight: 600; color: #111827; vertical-align: middle;">${item.quantity}</td>
            <td style="padding: 10px 0 10px 8px; text-align: right; font-weight: 700; color: #111827; vertical-align: middle; white-space: nowrap;">${formatPrice(item.total)}</td>
          </tr>
        `
        )
        .join("");

      const emailHtml = `
        <div style="font-family: 'DM Sans', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e5e7eb; border-radius: 20px; background-color: #ffffff; color: #111827;">
          <div style="text-align: center; border-bottom: 2px solid #111827; padding-bottom: 16px; margin-bottom: 24px;">
            <img src="https://res.cloudinary.com/dhkf4qmql/image/upload/futuremilestone/futuremilestone_logo.png" alt="Future Milestone" width="42" height="34" style="display: block; margin: 0 auto 10px auto; width: 42px; height: auto; border: 0;" />
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: #111827; text-transform: uppercase; line-height: 1;">FUTURE MILESTONE</h1>
          </div>

          <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 12px;">You Left Something Special in Your Cart 🛒</h2>
          
          <p style="font-size: 13.5px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
            Dear <strong>${customerName}</strong>,<br/><br/>
            We noticed that you have items waiting in your shopping cart. They are reserved for you, but stock is limited! Complete your order now to secure your pieces before they run out.
          </p>

          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; padding: 18px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #4b5563;">Items in Your Cart</h3>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="border-bottom: 1.5px solid #e5e7eb; text-align: left; color: #6b7280; font-size: 10.5px; text-transform: uppercase;">
                  <th style="padding-bottom: 8px;" colspan="2">Product</th>
                  <th style="padding-bottom: 8px; text-align: center;">Qty</th>
                  <th style="padding-bottom: 8px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRowsHtml}
              </tbody>
            </table>

            <div style="border-top: 1.5px solid #e5e7eb; margin-top: 14px; padding-top: 14px; text-align: right;">
              <span style="font-size: 14px; font-weight: 800; color: #111827;">Total Cart Value: ${formatPrice(totalValue)}</span>
            </div>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${checkoutUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 12px; font-weight: 800; font-size: 14px; letter-spacing: 0.02em; shadow: 0 4px 12px rgba(0,0,0,0.1);">
              Complete Purchase →
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; font-size: 11px; color: #9ca3af;">
            <p style="margin: 0 0 4px 0; font-weight: 600; color: #4b5563;">Future Milestone Customer Care</p>
            <p style="margin: 0;">If you need assistance, reply directly to this email.</p>
          </div>
        </div>
      `;

      const result = await sendEmail({
        to: recipientEmail,
        subject: "Complete Your Purchase at Future Milestone 🛒",
        html: emailHtml,
      });

      if (result.success) {
        successCount++;
      } else {
        failCount++;
        lastError = result.error;
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      failCount,
      error: lastError,
    });
  } catch (error: any) {
    console.error("Failed to send cart email:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
