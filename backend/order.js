import express from "express";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import bwipjs from "bwip-js";
import QRCode from "qrcode";
import axios from "axios";
import { config } from "./sms_email.js"; // adjust path

const router = express.Router();

export default function orderAdminRoutes(db) {

  // GET ALL ORDERS WITH ITEMS AND IMAGES
  router.get("/order-history", (req, res) => {
    db.query(`
      SELECT o.orderID, o.order_number, o.userID, o.delivery_address, o.created_at, o.status
      FROM orders o
      ORDER BY o.created_at DESC
    `)
    .then(([orders]) => {
      return db.query(`
        SELECT 
          oi.orderItemID,
          oi.orderID,
          oi.productID,
          oi.quantity,
          oi.price,
          p.name AS name,
          (
            SELECT image_url 
            FROM product_images 
            WHERE product_id = p.id AND is_main = 1 
            LIMIT 1
          ) AS image_url
        FROM order_items oi
        JOIN product p ON oi.productID = p.id
      `)
      .then(([items]) => {
        const merged = orders.map(order => ({
          ...order,
          products: items.filter(i => i.orderID === order.orderID)
        }));
        res.json(merged);
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    });
  });

// UPDATE STATUS AND SEND SMS
router.put("/update-order/:id/status", async (req, res) => {
  try {
    // Sanitize and validate orderID
    const orderID = parseInt(req.params.id);
    if (isNaN(orderID)) return res.status(400).json({ error: "Invalid order ID" });

    // Sanitize and validate status
    const status = (req.body.status || "").toLowerCase().trim();
    const allowedStatus = ["pending", "paid", "shipping", "completed", "cancelled", "refunded"];
    if (!allowedStatus.includes(status)) return res.status(400).json({ error: "Invalid status value" });

    // Update the order status
    await db.query("UPDATE orders SET status = ? WHERE orderID = ?", [status, orderID]);

    // Only send SMS if status is 'shipping'
    if (status === "shipping") {
      const [[order]] = await db.query(
        `SELECT o.delivery_phone, o.payment_method, u.first_name, u.last_name 
         FROM orders o 
         JOIN users u ON o.userID = u.userID 
         WHERE o.orderID = ? LIMIT 1`,
        [orderID]
      );

      if (order?.delivery_phone) {
        // Clean phone number
        const cleanPhone = order.delivery_phone.replace(/\D/g, '');
        if (cleanPhone.length >= 10) {
          const fullName = `${order.first_name} ${order.last_name}`;
          const message = order.payment_method === "cod"
            ? `Hi ${fullName}, your product is already on its way. Please prepare the exact amount for COD. Thank you for your purchase! – Glid + Grove: Born from the grove. Made for you.`
            : `Hi ${fullName}, your product is already on its way. Thank you for your purchase! – Glid + Grove: Born from the grove. Made for you.`;

          // Send SMS via iProgSMS API
          const smsUrl = "https://www.iprogsms.com/api/v1/sms_messages";
          await axios.post(
            smsUrl,
            {},
            {
              params: {
                api_token: config.iprogSms.apiToken,
                phone_number: cleanPhone,
                sender_name: "kaprets",
                message,
                sms_provider: 0
              },
              headers: { "Content-Type": "application/json" }
            }
          );

          console.log(`Shipping SMS sent to ${cleanPhone} for order ${orderID}`);
        }
      }
    }

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("Update order error:", err);
    res.status(500).json({ error: "Cannot update status or send SMS" });
  }
});


  // WAYBILL PDF GENERATION
  router.get("/waybill", (req, res) => {
    const idsParam = req.query.ids;
    if (!idsParam) return res.status(400).json({ error: "Missing ids parameter" });

    const ids = idsParam.split(",").map(Number);

    PDFDocument.create()
      .then(async pdfDoc => {
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const genBarcodePng = text =>
          new Promise((resolve, reject) => {
            bwipjs.toBuffer(
              { bcid: "code128", text, scale: 3, height: 10, includetext: false, textxalign: "center" },
              (err, png) => (err ? reject(err) : resolve(png))
            );
          });

        async function createWaybillPage(order, items) {
          const page = pdfDoc.addPage([450, 740]);
          const { width, height } = page.getSize();
          const margin = 20;
          const pageWidth = width - margin * 2;

          const orderIdStr = order.order_number || `#${order.orderID}`;
          const trackingNumber = order.tracking_number || `SPEPH${orderIdStr}`.replace(/[^A-Za-z0-9]/g, "");

          const orderBarcodeImg = await pdfDoc.embedPng(await genBarcodePng(orderIdStr));
          const trackBarcodeImg = await pdfDoc.embedPng(await genBarcodePng(trackingNumber));
          const qrImg = await pdfDoc.embedPng(await QRCode.toBuffer(trackingNumber, { width: 200 }));

          // HEADER
          const headerHeight = 70;
          page.drawRectangle({ x: margin, y: height - margin - headerHeight, width: pageWidth, height: headerHeight, borderColor: rgb(0,0,0), borderWidth: 1 });
          page.drawText("Sort Code:", { x: margin+10, y: height - margin - 25, size: 10, font: helveticaBold });
          page.drawText("RTS-A-620-WCQ-EUQ-220", { x: margin+10, y: height - margin - 40, size: 9, font: helvetica });

          const storeName = "GILD + GROVE";
          const storeWidth = helveticaBold.widthOfTextAtSize(storeName, 18);
          page.drawText(storeName, { x: margin + pageWidth/2 - storeWidth/2, y: height - margin - 28, size: 18, font: helveticaBold });
          page.drawText("Online Store", { x: margin + pageWidth/2 - 30, y: height - margin - 48, size: 10, font: helvetica });

          // MAIN BARCODE
          const barcodeBoxHeight = 110;
          const barcodeBoxY = height - margin - headerHeight - barcodeBoxHeight;
          page.drawRectangle({ x: margin, y: barcodeBoxY, width: pageWidth, height: barcodeBoxHeight, borderColor: rgb(0,0,0), borderWidth: 1 });
          page.drawImage(orderBarcodeImg, { x: margin + 20, y: barcodeBoxY + 40, width: pageWidth - 40, height: 50 });
          const idWidth = helveticaBold.widthOfTextAtSize(orderIdStr, 11);
          page.drawText(orderIdStr, { x: margin + pageWidth/2 - idWidth/2, y: barcodeBoxY + 25, size: 11, font: helveticaBold });

          // BUYER/SELLER
          const infoHeight = 180;
          const infoY = barcodeBoxY - infoHeight - 6;
          page.drawRectangle({ x: margin, y: infoY, width: pageWidth, height: infoHeight, borderColor: rgb(0,0,0), borderWidth: 1 });
          const halfWidth = pageWidth/2;
          page.drawLine({ start:{x: margin+halfWidth, y: infoY}, end:{x: margin+halfWidth, y: infoY+infoHeight}, thickness: 1 });

          page.drawText("BUYER", { x: margin+12, y: infoY + infoHeight - 20, size: 10, font: helveticaBold });
          page.drawText(order.delivery_name || "N/A", { x: margin+12, y: infoY + infoHeight - 40, size: 10, font: helvetica });
          if(order.delivery_phone) page.drawText(`Phone: ${order.delivery_phone}`, { x: margin+12, y: infoY + infoHeight - 56, size: 9, font: helvetica });
          if(order.delivery_email) page.drawText(`Email: ${order.delivery_email}`, { x: margin+12, y: infoY + infoHeight - 70, size: 9, font: helvetica });
          const addressLines = order.delivery_address ? order.delivery_address.split(",") : ["N/A"];
          let lineY = infoY + infoHeight - 84;
          addressLines.forEach(line => { page.drawText(line.trim(), { x: margin+12, y: lineY, size: 9, font: helvetica }); lineY -= 14; });

          page.drawText("SELLER", { x: margin + halfWidth + 12, y: infoY + infoHeight - 20, size: 10, font: helveticaBold });
          page.drawText("GILD + GROVE", { x: margin + halfWidth + 12, y: infoY + infoHeight - 40, size: 11, font: helvetica });
          page.drawText("Quezon City", { x: margin + halfWidth + 12, y: infoY + infoHeight - 56, size: 9, font: helvetica });

          // PRODUCT SUMMARY
          const prodHeight = 90;
          const prodY = infoY - prodHeight - 6;
          page.drawRectangle({ x: margin, y: prodY, width: pageWidth, height: prodHeight, borderColor: rgb(0,0,0), borderWidth: 1 });
          page.drawText("Product Summary", { x: margin + 12, y: prodY + prodHeight - 20, size: 11, font: helveticaBold });
          let pY = prodY + prodHeight - 40;
          items.forEach(it => { page.drawText(`${it.name} (Qty: ${it.quantity})`, { x: margin+12, y: pY, size: 10, font: helvetica }); pY -= 16; });

          // QR + tracking barcode
          const bottomY = 40;
          page.drawImage(qrImg, { x: margin, y: bottomY + 50, width: 120, height: 120 });
          page.drawText(`Total Qty: ${items.reduce((a,b)=>a+b.quantity,0)}`, { x: margin+125, y: bottomY + 70, size: 10, font: helvetica });
          page.drawText(`Weight: ${order.weight || "—"} g`, { x: margin+125, y: bottomY + 54, size: 10, font: helvetica });
          page.drawImage(trackBarcodeImg, { x: margin + 15, y: bottomY + 20, width: pageWidth - 30, height: 26 });
          page.drawText(trackingNumber, { x: margin+20, y: bottomY+10, size: 10, font: helveticaBold });

          // DELIVERY ATTEMPT
          const attX = width - margin - 120;
          page.drawText("Delivery Attempt", { x: attX, y: bottomY + 88, size: 10, font: helveticaBold });
          let bx = attX;
          for(let i=1;i<=3;i++){
            page.drawRectangle({x: bx, y: bottomY+60, width:26, height:20, borderColor: rgb(0,0,0), borderWidth:1});
            page.drawText(String(i), { x: bx+10, y: bottomY+66, size:10, font: helvetica });
            bx += 32;
          }

          // FOOTER
          page.drawRectangle({ x: margin, y: 10, width: pageWidth, height: 20, color: rgb(0.95,0.95,0.95) });
          page.drawText("GILD + GROVE — Free & Easy Returns", { x: margin+12, y:16, size:9, font: helveticaBold });
        }

        // PROCESS EACH ID
        for(const id of ids){
          const [[order]] = await db.query(`SELECT * FROM orders WHERE orderID = ? LIMIT 1`, [id]);
          const [items] = await db.query(`
            SELECT oi.quantity, oi.price, p.name 
            FROM order_items oi
            JOIN product p ON oi.productID = p.id
            WHERE oi.orderID = ?`, [order.orderID]
          );
          await createWaybillPage(order, items);
        }

        return pdfDoc.save();
      })
      .then(pdfBytes => {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename=waybill-multiple.pdf`);
        res.send(Buffer.from(pdfBytes));
      })
      .catch(err => {
        console.error("Waybill multi error:", err);
        res.status(500).json({ error: "Failed to generate multi-waybill PDF" });
      });
  });

  return router;
}
