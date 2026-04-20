import { env } from "hono/adapter";
import { TEnvs } from "./types";

/**
 * WhatsApp Service for sending notifications.
 * 
 * Supports a "MOCK" mode for development until a provider is configured.
 */
export class WhatsAppService {
  private c: any;
  private mode: "MOCK" | "PRODUCTION";
  private provider: "TWILIO" | "VONAGE" | "GENERIC";

  constructor(c: any) {
    this.c = c;
    const { ENV_MODE } = env<TEnvs>(c);
    this.mode = ENV_MODE === "production" ? "PRODUCTION" : "MOCK";
    
    // Default to generic for now, can be configured via env
    this.provider = "GENERIC";
  }

  /**
   * Send a WhatsApp message to a phone number.
   * 
   * @param to Phone number in international format (e.g., +234...)
   * @param message The message content
   */
  async sendMessage(to: string, message: string): Promise<boolean> {
    console.log(`[WhatsAppService] Sending to ${to}: ${message}`);

    if (this.mode === "MOCK") {
      console.log(`[WhatsAppService][MOCK] Message "sent" successfully.`);
      return true;
    }

    try {
      // In production, you would call your provider's API here.
      // Example for Twilio:
      // const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      // await client.messages.create({ body: message, from: 'whatsapp:+14155238886', to: `whatsapp:${to}` });
      
      console.log(`[WhatsAppService][PRODUCTION] Provider ${this.provider} not yet fully implemented.`);
      return true;
    } catch (error) {
      console.error(`[WhatsAppService] Failed to send message:`, error);
      return false;
    }
  }

  /**
   * Send a notification to a specific beneficiary about a targeted donation.
   */
  async sendDonationNotification(to: string, donorName: string, amount: number, screeningType: string) {
    const message = `Hello! A kind donation of ₦${amount.toLocaleString()} has been made on your behalf by ${donorName} for a ${screeningType} screening. Log in to ZeroCancer to see more details!`;
    return this.sendMessage(to, message);
  }

  /**
   * Notification for Associations/Groups.
   */
  async sendGroupDonationNotification(to: string, groupName: string, donorName: string, screeningType: string) {
    const message = `Hello! ${donorName} has made a donation to the ${groupName} group for ${screeningType} screenings. Members can now apply for these kits on ZeroCancer!`;
    return this.sendMessage(to, message);
  }
}

/**
 * Helper to send WhatsApp notification.
 */
export async function sendWhatsAppNotification(c: any, to: string, message: string) {
  const service = new WhatsAppService(c);
  return service.sendMessage(to, message);
}
