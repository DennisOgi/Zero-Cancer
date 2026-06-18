import { env } from "hono/adapter";
import { normalizeWhatsappNumber } from "./phone";
import { TEnvs } from "./types";

type SendCenterReportParams = {
  to: string;
  message: string;
  centerName: string;
  centerWhatsappNumber?: string;
  mediaUrl?: string;
};

export type WhatsAppSendResult = {
  success: boolean;
  mock?: boolean;
  error?: string;
};

/**
 * WhatsApp delivery for screening reports.
 * Production requires Twilio credentials; dev mode can mock delivery.
 */
export class WhatsAppService {
  private c: any;
  private mode: "MOCK" | "PRODUCTION";

  constructor(c: any) {
    this.c = c;
    const { ENV_MODE } = env<TEnvs>(c);
    this.mode = ENV_MODE === "production" ? "PRODUCTION" : "MOCK";
  }

  async sendMessage(
    to: string,
    message: string,
    mediaUrl?: string
  ): Promise<WhatsAppSendResult> {
    console.log(`[WhatsAppService] Sending to ${to}${mediaUrl ? " (with media)" : ""}`);

    const accountSid = (this.c.env as TEnvs & { TWILIO_ACCOUNT_SID?: string })
      ?.TWILIO_ACCOUNT_SID;
    const authToken = (this.c.env as TEnvs & { TWILIO_AUTH_TOKEN?: string })
      ?.TWILIO_AUTH_TOKEN;
    const fromNumber = (this.c.env as TEnvs & { TWILIO_WHATSAPP_FROM?: string })
      ?.TWILIO_WHATSAPP_FROM;

    if (!accountSid || !authToken || !fromNumber) {
      if (this.mode === "MOCK") {
        console.log(`[WhatsAppService][MOCK] ${message}`);
        return { success: true, mock: true };
      }

      const error =
        "WhatsApp is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM.";
      console.error(`[WhatsAppService] ${error}`);
      return { success: false, error };
    }

    try {
      const e164 = normalizeWhatsappNumber(to);
      const normalizedTo = e164.startsWith("whatsapp:") ? e164 : `whatsapp:${e164}`;
      const normalizedFrom = fromNumber.startsWith("whatsapp:")
        ? fromNumber
        : `whatsapp:${fromNumber}`;

      const body = new URLSearchParams({
        From: normalizedFrom,
        To: normalizedTo,
        Body: message,
      });
      if (mediaUrl) body.set("MediaUrl", mediaUrl);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[WhatsAppService] Twilio error:", errorText);
        return { success: false, error: "Twilio rejected the WhatsApp message" };
      }

      return { success: true };
    } catch (error) {
      console.error("[WhatsAppService] Failed to send message:", error);
      return { success: false, error: "Failed to send WhatsApp message" };
    }
  }

  async sendCenterReport(params: SendCenterReportParams): Promise<WhatsAppSendResult> {
    const header = params.centerWhatsappNumber
      ? `[${params.centerName}]`
      : `[${params.centerName} via ZeroCancer]`;

    const message = `${header}\n\n${params.message}`;
    return this.sendMessage(params.to, message, params.mediaUrl);
  }

  async sendDonationNotification(
    to: string,
    donorName: string,
    amount: number,
    screeningType: string
  ) {
    const message = `Hello! A kind donation of ₦${amount.toLocaleString()} has been made on your behalf by ${donorName} for a ${screeningType} screening. Log in to ZeroCancer to see more details!`;
    const result = await this.sendMessage(to, message);
    return result.success;
  }

  async sendGroupDonationNotification(
    to: string,
    groupName: string,
    donorName: string,
    screeningType: string
  ) {
    const message = `Hello! ${donorName} has made a donation to the ${groupName} group for ${screeningType} screenings. Members can now apply for these kits on ZeroCancer!`;
    const result = await this.sendMessage(to, message);
    return result.success;
  }
}

export async function sendWhatsAppNotification(
  c: any,
  to: string,
  message: string
) {
  const service = new WhatsAppService(c);
  const result = await service.sendMessage(to, message);
  return result.success;
}
