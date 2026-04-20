// import { PrismaClient } from "@prisma/client";
// import { ReceiptData } from "@zerocancer/shared/schemas/receipt.schema";
// import fssync from "fs";
// import fs from "fs/promises";
// import path from "path";
// import PDFDocument from "pdfkit";
// import { sendEmail } from "./email";

// export class ReceiptService {
//   constructor(private prisma: PrismaClient) {}

//   /**
//    * Generate receipt data from transaction ID
//    */
//   async generateReceiptData(transactionId: string): Promise<ReceiptData> {
//     // Find the transaction first
//     const transaction = await this.prisma.transaction.findUnique({
//       where: { id: transactionId },
//       include: {
//         donation: true,
//         appointments: {
//           include: {
//             patient: true,
//             center: true,
//             screeningType: true,
//           },
//         },
//       },
//     });

//     if (!transaction) {
//       throw new Error(`Transaction not found: ${transactionId}`);
//     }

//     const receiptNumber = this.generateReceiptNumber();

//     // Determine receipt type and build data based on transaction relationships
//     if (transaction.appointments && transaction.appointments.length > 0) {
//       // Appointment-based transaction
//       const appointment = transaction.appointments[0]; // Use first appointment

//       return {
//         receiptNumber,
//         transactionId: transaction.id,
//         type: "APPOINTMENT",
//         amount: transaction.amount,
//         date: transaction.createdAt.toISOString(),
//         paymentReference: transaction.paymentReference || undefined,
//         paymentChannel: transaction.paymentChannel || undefined,
//         recipientName: appointment.patient.fullName || "Unknown",
//         recipientEmail: appointment.patient.email,
//         recipientPhone: appointment.patient.phone || undefined,
//         centerName: appointment.center.centerName,
//         centerAddress: appointment.center.address,
//         appointmentDateTime: appointment.appointmentDateTime.toISOString(),
//         serviceType: appointment.screeningType.name,
//         campaignName: undefined,
//         campaignDescription: undefined,
//         taxDeductible: false,
//         organizationName: "Zero Cancer Initiative",
//         organizationAddress: "123 Health Street, Medical City, State 12345",
//         organizationTaxId: "TAX-123456789",
//         organizationEmail: "contact@zerocancer.org",
//         organizationPhone: "+1 (555) 123-4567",
//       };
//     } else if (transaction.donation) {
//       // Donation-based transaction - need to get donor info
//       const donor = await this.prisma.user.findUnique({
//         where: { id: transaction.donation.donorId },
//       });

//       return {
//         receiptNumber,
//         transactionId: transaction.id,
//         type: "DONATION",
//         amount: transaction.amount,
//         date: transaction.createdAt.toISOString(),
//         paymentReference: transaction.paymentReference || undefined,
//         paymentChannel: transaction.paymentChannel || undefined,
//         recipientName: donor?.fullName || "Unknown",
//         recipientEmail: donor?.email || "unknown@email.com",
//         recipientPhone: donor?.phone || undefined,
//         campaignName: "Donation Campaign",
//         campaignDescription:
//           transaction.donation.purpose ||
//           "General donation to support cancer screening",
//         taxDeductible: true,
//         centerName: undefined,
//         centerAddress: undefined,
//         appointmentDateTime: undefined,
//         serviceType: undefined,
//         organizationName: "Zero Cancer Initiative",
//         organizationAddress: "123 Health Street, Medical City, State 12345",
//         organizationTaxId: "TAX-123456789",
//         organizationEmail: "contact@zerocancer.org",
//         organizationPhone: "+1 (555) 123-4567",
//       };
//     } else {
//       // Generic transaction - fallback
//       return {
//         receiptNumber,
//         transactionId: transaction.id,
//         type: "PAYOUT",
//         amount: transaction.amount,
//         date: transaction.createdAt.toISOString(),
//         paymentReference: transaction.paymentReference || undefined,
//         paymentChannel: transaction.paymentChannel || undefined,
//         recipientName: "Unknown",
//         recipientEmail: "unknown@email.com",
//         recipientPhone: undefined,
//         campaignName: undefined,
//         campaignDescription: undefined,
//         taxDeductible: false,
//         centerName: undefined,
//         centerAddress: undefined,
//         appointmentDateTime: undefined,
//         serviceType: undefined,
//         organizationName: "Zero Cancer Initiative",
//         organizationAddress: "123 Health Street, Medical City, State 12345",
//         organizationTaxId: "TAX-123456789",
//         organizationEmail: "contact@zerocancer.org",
//         organizationPhone: "+1 (555) 123-4567",
//       };
//     }
//   }

//   /**
//    * Generate PDF receipt from receipt data
//    */
//   async generatePDF(receiptData: ReceiptData): Promise<string> {
//     const doc = new PDFDocument();
//     const fileName = `receipt-${receiptData.receiptNumber}.pdf`;
//     const uploadDir = path.join(process.cwd(), "uploads", "receipts");

//     // Ensure upload directory exists
//     await fs.mkdir(uploadDir, { recursive: true });

//     const filePath = path.join(uploadDir, fileName);
//     const stream = fssync.createWriteStream(filePath);

//     doc.pipe(stream);

//     // Header
//     doc.fontSize(20).text("RECEIPT", 50, 50);
//     doc
//       .fontSize(12)
//       .text(receiptData.organizationName || "Zero Cancer Initiative", 50, 80);
//     doc.text(
//       receiptData.organizationAddress ||
//         "123 Health Street, Medical City, State 12345",
//       50,
//       95
//     );
//     doc.text(
//       `Email: ${receiptData.organizationEmail || "contact@zerocancer.org"}`,
//       50,
//       110
//     );
//     doc.text(
//       `Phone: ${receiptData.organizationPhone || "+1 (555) 123-4567"}`,
//       50,
//       125
//     );

//     // Receipt details
//     doc.text(`Receipt Number: ${receiptData.receiptNumber}`, 350, 80);
//     doc.text(
//       `Date: ${new Date(receiptData.date || "").toLocaleDateString()}`,
//       350,
//       95
//     );
//     doc.text(`Transaction ID: ${receiptData.transactionId}`, 350, 110);

//     // Horizontal line
//     doc.moveTo(50, 150).lineTo(550, 150).stroke();

//     // Customer information
//     doc.fontSize(14).text("Bill To:", 50, 170);
//     doc.fontSize(12).text(receiptData.recipientName || "Unknown", 50, 190);
//     doc.text(receiptData.recipientEmail || "unknown@email.com", 50, 205);
//     if (receiptData.recipientPhone) {
//       doc.text(receiptData.recipientPhone, 50, 220);
//     }

//     // Service/Item details
//     let yPosition = 260;
//     doc.fontSize(14).text("Description:", 50, yPosition);
//     yPosition += 20;

//     if (receiptData.type === "APPOINTMENT") {
//       doc
//         .fontSize(12)
//         .text(
//           `Appointment - ${receiptData.serviceType || "Health Screening"}`,
//           50,
//           yPosition
//         );
//       yPosition += 15;
//       doc.text(`Center: ${receiptData.centerName || "N/A"}`, 50, yPosition);
//       yPosition += 15;
//       if (receiptData.appointmentDateTime) {
//         doc.text(
//           `Date: ${new Date(
//             receiptData.appointmentDateTime
//           ).toLocaleDateString()}`,
//           50,
//           yPosition
//         );
//         yPosition += 15;
//       }
//     } else if (receiptData.type === "DONATION") {
//       doc
//         .fontSize(12)
//         .text(
//           `Donation - ${receiptData.campaignName || "General Fund"}`,
//           50,
//           yPosition
//         );
//       yPosition += 15;
//       if (receiptData.campaignDescription) {
//         doc.text(
//           `Description: ${receiptData.campaignDescription}`,
//           50,
//           yPosition
//         );
//         yPosition += 15;
//       }
//       if (receiptData.taxDeductible) {
//         doc.text("✓ Tax Deductible Donation", 50, yPosition);
//         yPosition += 15;
//       }
//     }

//     // Amount
//     yPosition += 20;
//     doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
//     yPosition += 20;
//     doc
//       .fontSize(14)
//       .text(
//         `Total Amount: $${(receiptData.amount || 0).toFixed(2)}`,
//         50,
//         yPosition
//       );

//     // Payment information
//     if (receiptData.paymentReference) {
//       yPosition += 30;
//       doc
//         .fontSize(12)
//         .text(
//           `Payment Reference: ${receiptData.paymentReference}`,
//           50,
//           yPosition
//         );
//     }
//     if (receiptData.paymentChannel) {
//       yPosition += 15;
//       doc.text(`Payment Method: ${receiptData.paymentChannel}`, 50, yPosition);
//     }

//     // Footer
//     yPosition += 50;
//     doc.fontSize(10).text("Thank you for your business!", 50, yPosition);
//     if (receiptData.type === "DONATION" && receiptData.taxDeductible) {
//       yPosition += 15;
//       doc.text(
//         "This receipt serves as proof of your tax-deductible donation.",
//         50,
//         yPosition
//       );
//       yPosition += 10;
//       doc.text(
//         `Tax ID: ${receiptData.organizationTaxId || "TAX-123456789"}`,
//         50,
//         yPosition
//       );
//     }

//     doc.end();

//     return new Promise((resolve, reject) => {
//       stream.on("finish", () => {
//         resolve(filePath);
//       });
//       stream.on("error", reject);
//     });
//   }

//   /**
//    * Create or update a receipt
//    */
//   async createReceipt(
//     transactionId: string,
//     forceRegenerate = false
//   ): Promise<any> {
//     // Check if receipt already exists
//     const existingReceipt = await this.prisma.receipt.findUnique({
//       where: { transactionId },
//     });

//     if (existingReceipt && !forceRegenerate) {
//       return existingReceipt;
//     }

//     try {
//       // Generate receipt data
//       const receiptData = await this.generateReceiptData(transactionId);

//       // Generate PDF
//       const pdfPath = await this.generatePDF(receiptData);

//       // Save or update receipt in database
//       const receipt = await this.prisma.receipt.upsert({
//         where: { transactionId },
//         update: {
//           receiptData: receiptData as any,
//           pdfPath,
//         },
//         create: {
//           transactionId,
//           receiptNumber: receiptData.receiptNumber || "",
//           receiptData: receiptData as any,
//           pdfPath,
//         },
//       });

//       return receipt;
//     } catch (error) {
//       console.error("Failed to create receipt:", error);
//       throw error;
//     }
//   }

//   /**
//    * Get receipt by transaction ID
//    */
//   async getReceipt(transactionId: string) {
//     return this.prisma.receipt.findUnique({
//       where: { transactionId },
//     });
//   }

//   /**
//    * Send receipt via email
//    */
//   async sendReceiptEmail(
//     transactionId: string,
//     overrideEmail?: string
//   ): Promise<void> {
//     const receipt = await this.getReceipt(transactionId);
//     if (!receipt || !receipt.pdfPath) {
//       throw new Error("Receipt not found or PDF not generated");
//     }

//     const receiptData = receipt.receiptData as ReceiptData;
//     const emailRecipient =
//       overrideEmail || receiptData.recipientEmail || "unknown@email.com";

//     // Send email with PDF attachment
//     await sendEmail({
//       to: emailRecipient,
//       subject: `Receipt - ${receiptData.receiptNumber}`,
//       html: `
//         <h2>Receipt for Transaction</h2>
//         <p>Dear ${receiptData.recipientName || "Customer"},</p>
//         <p>Thank you for your ${(
//           receiptData.type || "transaction"
//         ).toLowerCase()}. Please find your receipt attached.</p>
//         <p><strong>Receipt Number:</strong> ${receiptData.receiptNumber}</p>
//         <p><strong>Amount:</strong> $${(receiptData.amount || 0).toFixed(2)}</p>
//         <p><strong>Date:</strong> ${new Date(
//           receiptData.date || ""
//         ).toLocaleDateString()}</p>
//         ${
//           receiptData.type === "DONATION" && receiptData.taxDeductible
//             ? "<p><em>This is a tax-deductible donation.</em></p>"
//             : ""
//         }
//         <p>Best regards,<br>Zero Cancer Initiative</p>
//       `,
//     });

//     // Update email sent tracking - only update if the receipt exists
//     await this.prisma.receipt.update({
//       where: { transactionId },
//       data: {
//         emailSentAt: new Date(),
//         emailRecipient: emailRecipient,
//       },
//     });
//   }

//   /**
//    * List receipts with pagination and filters
//    */
//   async listReceipts(params: {
//     page?: number;
//     limit?: number;
//     type?: string;
//     userId?: string;
//     startDate?: string;
//     endDate?: string;
//   }) {
//     const { page = 1, limit = 20, type, userId, startDate, endDate } = params;

//     const where: any = {};

//     if (startDate || endDate) {
//       where.createdAt = {};
//       if (startDate) where.createdAt.gte = new Date(startDate);
//       if (endDate) where.createdAt.lte = new Date(endDate);
//     }

//     const [receipts, total] = await Promise.all([
//       this.prisma.receipt.findMany({
//         where,
//         skip: (page - 1) * limit,
//         take: limit,
//         orderBy: { createdAt: "desc" },
//       }),
//       this.prisma.receipt.count({ where }),
//     ]);

//     // Filter by type if provided (client-side filtering for JSON field)
//     let filteredReceipts = receipts;
//     if (type) {
//       filteredReceipts = receipts.filter((receipt) => {
//         const data = receipt.receiptData as ReceiptData;
//         return data.type === type;
//       });
//     }

//     return {
//       receipts: filteredReceipts,
//       total,
//       page,
//       limit,
//     };
//   }

//   /**
//    * Generate unique receipt number
//    */
//   private generateReceiptNumber(): string {
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, "0");
//     const day = String(now.getDate()).padStart(2, "0");
//     const timestamp = Date.now().toString().slice(-6);

//     return `RCP-${year}${month}${day}-${timestamp}`;
//   }
// }
