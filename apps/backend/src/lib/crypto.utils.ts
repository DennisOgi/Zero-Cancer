import crypto from "crypto";
import { generateHexId } from "./utils";

export class CryptoUtils {
  /**
   * Generate unique transfer reference
   * Format: TRF_YYYYMMDD_HHMMSS_RANDOM
   */
  static generateTransferReference(): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14);
    const random = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `TRF_${timestamp}_${random}`;
  }

  /**
   * Generate unique payout batch reference
   * Format: PAY_YYYYMM_RANDOM
   */
  static generatePayoutBatchReference(): string {
    const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "");
    const random = generateHexId(6).toUpperCase();
    return `PAY_${yearMonth}_${random}`;
  }

  /**
   * Generate recipient reference
   * Format: RCP_CENTERID_RANDOM
   */
  static generateRecipientReference(centerId: string): string {
    const centerShort = centerId.slice(-8).toUpperCase();
    const random = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `RCP_${centerShort}_${random}`;
  }

  /**
   * Generate unique payout number
   * Format: PO-YYYYMMDD-NNNN
   */
  static generatePayoutNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0");
    return `PO-${date}-${random}`;
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const hash = crypto
      .createHmac("sha512", secret)
      .update(payload)
      .digest("hex");

    return hash === signature;
  }

  /**
   * Generate secure reference for any purpose
   */
  static generateSecureReference(prefix: string = "REF"): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString("hex").toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }
}
