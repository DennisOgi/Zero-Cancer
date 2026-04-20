// import { zValidator } from "@hono/zod-validator";
// import { PrismaClient } from "@prisma/client";
// import {
//   CreateReceiptRequestSchema,
//   ReceiptData,
//   ReceiptListQuerySchema,
//   ResendReceiptRequestSchema,
// } from "@zerocancer/shared";
// import fs from "fs/promises";
// import { Hono } from "hono";
// import { ReceiptService } from "../lib/receipt.service";

// const db = new PrismaClient();
// const receiptService = new ReceiptService(db);

// const app = new Hono();

// // =========================================
// // TO BE REVAMPED
// // =========================================

// /**
//  * GET /api/receipts/:transactionId
//  * Get receipt data for a transaction
//  */
// app.get("/:transactionId", async (c) => {
//   try {
//     const transactionId = c.req.param("transactionId");

//     let receipt = await receiptService.getReceipt(transactionId);

//     // If receipt doesn't exist, try to generate it
//     if (!receipt) {
//       receipt = await receiptService.createReceipt(transactionId);
//     }

//     if (!receipt) {
//       return c.json({ error: "Receipt not found" }, 404);
//     }

//     return c.json({
//       success: true,
//       data: {
//         id: receipt.id,
//         transactionId: receipt.transactionId,
//         receiptNumber: receipt.receiptNumber,
//         receiptData: receipt.receiptData as ReceiptData,
//         pdfPath: receipt.pdfPath,
//         emailSentAt: receipt.emailSentAt,
//         emailRecipient: receipt.emailRecipient,
//         createdAt: receipt.createdAt,
//         updatedAt: receipt.updatedAt,
//       },
//     });
//   } catch (error) {
//     console.error("Error getting receipt:", error);
//     return c.json(
//       {
//         error: "Failed to get receipt",
//         details: error instanceof Error ? error.message : "Unknown error",
//       },
//       500
//     );
//   }
// });

// /**
//  * GET /api/receipts/:transactionId/pdf
//  * Download receipt PDF
//  */
// app.get("/:transactionId/pdf", async (c) => {
//   try {
//     const transactionId = c.req.param("transactionId");

//     let receipt = await receiptService.getReceipt(transactionId);

//     // If receipt doesn't exist, try to generate it
//     if (!receipt) {
//       receipt = await receiptService.createReceipt(transactionId);
//     }

//     if (!receipt || !receipt.pdfPath) {
//       return c.json({ error: "Receipt PDF not found" }, 404);
//     }

//     // Check if file exists
//     try {
//       await fs.access(receipt.pdfPath);
//     } catch {
//       // If file doesn't exist, regenerate it
//       receipt = await receiptService.createReceipt(transactionId, true);
//       if (!receipt || !receipt.pdfPath) {
//         return c.json({ error: "Failed to generate receipt PDF" }, 500);
//       }
//     }

//     // Read and return the PDF file
//     const fileBuffer = await fs.readFile(receipt.pdfPath);

//     // Set appropriate headers for PDF download
//     c.header("Content-Type", "application/pdf");
//     c.header(
//       "Content-Disposition",
//       `attachment; filename="receipt-${receipt.receiptNumber}.pdf"`
//     );

//     return c.body(fileBuffer);
//   } catch (error) {
//     console.error("Error getting receipt PDF:", error);
//     return c.json(
//       {
//         error: "Failed to get receipt PDF",
//         details: error instanceof Error ? error.message : "Unknown error",
//       },
//       500
//     );
//   }
// });

// /**
//  * POST /api/receipts/:transactionId
//  * Create or regenerate a receipt
//  */
// app.post(
//   "/:transactionId",
//   zValidator("json", CreateReceiptRequestSchema),
//   async (c) => {
//     try {
//       const transactionId = c.req.param("transactionId");
//       const { forceRegenerate } = c.req.valid("json");

//       const receipt = await receiptService.createReceipt(
//         transactionId,
//         forceRegenerate
//       );

//       return c.json({
//         success: true,
//         data: {
//           id: receipt.id,
//           transactionId: receipt.transactionId,
//           receiptNumber: receipt.receiptNumber,
//           receiptData: receipt.receiptData as ReceiptData,
//           pdfPath: receipt.pdfPath,
//           emailSentAt: receipt.emailSentAt,
//           emailRecipient: receipt.emailRecipient,
//           createdAt: receipt.createdAt,
//           updatedAt: receipt.updatedAt,
//         },
//       });
//     } catch (error) {
//       console.error("Error creating receipt:", error);
//       return c.json(
//         {
//           error: "Failed to create receipt",
//           details: error instanceof Error ? error.message : "Unknown error",
//         },
//         500
//       );
//     }
//   }
// );

// /**
//  * POST /api/receipts/:transactionId/resend
//  * Resend receipt via email
//  */
// app.post(
//   "/:transactionId/resend",
//   zValidator("json", ResendReceiptRequestSchema),
//   async (c) => {
//     try {
//       const transactionId = c.req.param("transactionId");
//       const { emailRecipient } = c.req.valid("json");

//       await receiptService.sendReceiptEmail(transactionId, emailRecipient);

//       return c.json({
//         success: true,
//         message: "Receipt sent successfully",
//       });
//     } catch (error) {
//       console.error("Error resending receipt:", error);
//       return c.json(
//         {
//           error: "Failed to resend receipt",
//           details: error instanceof Error ? error.message : "Unknown error",
//         },
//         500
//       );
//     }
//   }
// );

// /**
//  * GET /api/receipts
//  * List receipts with pagination and filters
//  */
// app.get("/", zValidator("query", ReceiptListQuerySchema), async (c) => {
//   try {
//     const query = c.req.valid("query");

//     const result = await receiptService.listReceipts({
//       page: query.page,
//       limit: query.limit,
//       type: query.type,
//       userId: query.userId,
//       startDate: query.startDate,
//       endDate: query.endDate,
//     });

//     return c.json({
//       success: true,
//       data: {
//         receipts: result.receipts.map((receipt) => ({
//           id: receipt.id,
//           transactionId: receipt.transactionId,
//           receiptNumber: receipt.receiptNumber,
//           receiptData: receipt.receiptData as ReceiptData,
//           pdfPath: receipt.pdfPath,
//           emailSentAt: receipt.emailSentAt,
//           emailRecipient: receipt.emailRecipient,
//           createdAt: receipt.createdAt,
//           updatedAt: receipt.updatedAt,
//         })),
//         total: result.total,
//         page: result.page,
//         limit: result.limit,
//       },
//     });
//   } catch (error) {
//     console.error("Error listing receipts:", error);
//     return c.json(
//       {
//         error: "Failed to list receipts",
//         details: error instanceof Error ? error.message : "Unknown error",
//       },
//       500
//     );
//   }
// });

// export default app;
