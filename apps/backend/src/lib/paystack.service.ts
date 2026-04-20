import { env } from "hono/adapter";
import { CryptoUtils } from "./crypto.utils";

export interface PaystackRecipientData {
  type: "nuban";
  name: string;
  account_number: string;
  bank_code: string;
  currency: "NGN";
}

export interface PaystackTransferData {
  source: "balance";
  amount: number; // in kobo
  recipient: string; // recipient_code
  reason: string;
  reference: string;
}

export interface PaystackTransferResponse {
  transfer_code: string;
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  domain: string;
  reason: string;
  recipient: {
    name: string;
    account_number: string;
    bank_name: string;
  };
}

export interface PaystackRecipientResponse {
  recipient_code: string;
  reference: string;
  type: string;
  name: string;
  account_number: string;
  bank_name: string;
  bank_code: string;
  currency: string;
}

export class PaystackService {
  private secretKey: string;
  private baseUrl = "https://api.paystack.co";

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  /**
   * Create transfer recipient with Paystack
   */
  async createRecipient(
    data: PaystackRecipientData
  ): Promise<PaystackRecipientResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transferrecipient`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.status) {
        throw new Error(
          `Paystack recipient creation failed: ${result.message}`
        );
      }

      return result.data;
    } catch (error) {
      console.error("Paystack createRecipient error:", error);
      throw new Error(
        `Failed to create Paystack recipient: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Initiate transfer to recipient
   */
  async initiateTransfer(
    data: PaystackTransferData
  ): Promise<PaystackTransferResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transfer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.status) {
        throw new Error(`Paystack transfer failed: ${result.message}`);
      }

      return result.data;
    } catch (error) {
      console.error("Paystack initiateTransfer error:", error);
      throw new Error(
        `Failed to initiate Paystack transfer: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Verify transfer status
   */
  async verifyTransfer(reference: string): Promise<{
    status: string;
    transfer_code: string;
    amount: number;
    recipient: {
      name: string;
      account_number: string;
      bank_name: string;
    };
    reason: string;
    currency: string;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/transfer/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      const result = await response.json();

      if (!result.status) {
        throw new Error(`Transfer verification failed: ${result.message}`);
      }

      return result.data;
    } catch (error) {
      console.error("Paystack verifyTransfer error:", error);
      throw new Error(
        `Failed to verify transfer: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get Paystack account balance
   */
  async getBalance(): Promise<{
    currency: string;
    balance: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/balance`, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      });

      const result = await response.json();

      if (!result.status) {
        throw new Error(`Failed to get balance: ${result.message}`);
      }

      return {
        currency: result.data[0].currency,
        balance: result.data[0].balance,
      };
    } catch (error) {
      console.error("Paystack getBalance error:", error);
      throw new Error(
        `Failed to get Paystack balance: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * List Nigerian banks for recipient creation
   */
  async getBanks(): Promise<
    Array<{
      name: string;
      code: string;
      longcode: string;
    }>
  > {
    try {
      const response = await fetch(`${this.baseUrl}/bank?country=nigeria`, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      });

      const result = await response.json();

      if (!result.status) {
        throw new Error(`Failed to get banks: ${result.message}`);
      }

      return result.data;
    } catch (error) {
      console.error("Paystack getBanks error:", error);
      throw new Error(
        `Failed to get Nigerian banks: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Verify bank account details
   */
  async verifyAccountNumber(
    accountNumber: string,
    bankCode: string
  ): Promise<{
    account_number: string;
    account_name: string;
    bank_id: number;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      const result = await response.json();

      if (!result.status) {
        throw new Error(`Account verification failed: ${result.message}`);
      }

      return result.data;
    } catch (error) {
      console.error("Paystack verifyAccountNumber error:", error);
      throw new Error(
        `Failed to verify account number: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
