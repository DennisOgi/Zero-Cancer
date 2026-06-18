/**
 * Webhook Idempotency System
 * 
 * Ensures webhooks are processed only once, even if Paystack sends duplicates
 */

import type { Context } from 'hono';
import { getDB } from './db';

export interface WebhookLog {
  id: string;
  paystackEventId: string;
  event: string;
  reference: string;
  status: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
  processedAt: Date;
  metadata?: any;
}

/**
 * Check if webhook has already been processed
 */
export async function isWebhookProcessed(
  c: Context,
  paystackEventId: string
): Promise<boolean> {
  const db = getDB(c);
  
  // Check if we have a webhook log for this event
  const existingLog = await db.transaction.findFirst({
    where: {
      paymentReference: paystackEventId,
      // Use a special prefix to identify webhook logs
      type: 'WEBHOOK_LOG' as any,
    },
  });
  
  return !!existingLog;
}

/**
 * Log webhook processing
 */
export async function logWebhookProcessing(
  c: Context,
  data: {
    paystackEventId: string;
    event: string;
    reference: string;
    status: 'SUCCESS' | 'FAILED';
    errorMessage?: string;
    metadata?: any;
  }
): Promise<void> {
  const db = getDB(c);
  
  try {
    // Store webhook log in transaction table with special type
    // In production, you might want a dedicated webhook_logs table
    await db.transaction.create({
      data: {
        type: 'WEBHOOK_LOG' as any,
        status: data.status === 'SUCCESS' ? 'COMPLETED' : 'FAILED',
        amount: 0, // Not applicable for webhook logs
        paymentReference: data.paystackEventId,
        paymentChannel: 'PAYSTACK_WEBHOOK',
        // Store metadata in a JSON-compatible way
        relatedDonationId: data.reference, // Store the actual payment reference here
      },
    });
    
    console.log('Webhook processing logged:', {
      eventId: data.paystackEventId,
      event: data.event,
      reference: data.reference,
      status: data.status,
    });
  } catch (error) {
    console.error('Failed to log webhook processing:', error);
    // Don't throw - logging failure shouldn't break webhook processing
  }
}

/**
 * Validate webhook signature
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  
  const hash = crypto
    .createHmac('sha512', secret)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}

/**
 * Extract event ID from Paystack webhook payload
 */
export function extractEventId(payload: any): string | null {
  // Paystack includes an 'id' field in the webhook payload
  // This is unique per event and can be used for idempotency
  return payload?.id || payload?.data?.id || null;
}

/**
 * Wrapper for webhook processing with idempotency
 */
export async function processWebhookIdempotent(
  c: Context,
  payload: any,
  processor: () => Promise<void>
): Promise<{ processed: boolean; duplicate: boolean; error?: string }> {
  const eventId = extractEventId(payload);
  
  if (!eventId) {
    return {
      processed: false,
      duplicate: false,
      error: 'No event ID found in payload',
    };
  }
  
  // Check if already processed
  const alreadyProcessed = await isWebhookProcessed(c, eventId);
  
  if (alreadyProcessed) {
    console.log('Webhook already processed:', eventId);
    return {
      processed: true,
      duplicate: true,
    };
  }
  
  // Process the webhook
  try {
    await processor();
    
    // Log successful processing
    await logWebhookProcessing(c, {
      paystackEventId: eventId,
      event: payload.event,
      reference: payload.data?.reference || 'unknown',
      status: 'SUCCESS',
      metadata: {
        amount: payload.data?.amount,
        channel: payload.data?.channel,
      },
    });
    
    return {
      processed: true,
      duplicate: false,
    };
  } catch (error) {
    // Log failed processing
    await logWebhookProcessing(c, {
      paystackEventId: eventId,
      event: payload.event,
      reference: payload.data?.reference || 'unknown',
      status: 'FAILED',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return {
      processed: false,
      duplicate: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
