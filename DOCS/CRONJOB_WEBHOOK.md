# Cron Job Webhook Documentation

This document covers the two webhooks designed to be triggered by automated cron jobs:

1. **Monthly Center Payout Webhook** - Processes monthly payments to cancer centers (NOTE: this feature hasn't been implemented)
2. **Waitlist Matching Webhook** - Runs the patient matching algorithm every 18 hours

## 1. Monthly Center Payout Webhook

**Endpoint:** `POST /api/v1/payouts/monthly-batch`

**Purpose:** Automatically processes monthly payouts to all cancer centers based on their completed screenings.

**Schedule:** Run once per month (recommended: 1st day of each month)

**Authentication:** API Key (x-api-key header)

### Request Format:

**Headers:**

```
x-api-key: your_cron_api_key_here
Content-Type: application/json
```

**Body:** Empty (no body required)

### Response:

```json
{
  "ok": true,
  "message": "Monthly payouts processed successfully",
  "data": {
    "centersProcessed": 15,
    "totalAmount": 50000,
    "payoutsCreated": 12,
    "executionTime": 2345,
    "timestamp": "2025-06-29T12:00:00.000Z"
  }
}
```

### Cron Job Example:

```bash
#!/bin/bash
# Monthly payout script - Run on 1st of each month at 2 AM
# Crontab: 0 2 1 * * /path/to/monthly-payout.sh

curl -X POST https://your-domain.com/api/v1/payouts/monthly-batch \
  -H "Content-Type: application/json" \
  -H "x-api-key: $CRON_API_KEY"
```

## 2. Waitlist Matching Webhook

**Endpoint:** `POST /api/v1/waitlist/trigger-matching`

**Purpose:** Triggers the waitlist matching algorithm to connect patients with available funding.

**Schedule:** Run every 18 hours

**Authentication:** API Key (x-api-key header)

### Request Format:

**Headers:**

```
x-api-key: your_cron_api_key_here
Content-Type: application/json
```

**Body:** Empty (no body required)

### Response:

```json
{
  "ok": true,
  "message": "Waitlist matching algorithm executed successfully",
  "data": {
    "executionTime": 1234,
    "timestamp": "2025-06-29T12:00:00.000Z"
  }
}
```

### Cron Job Example:

```bash
#!/bin/bash
# Waitlist matching script - Run every 18 hours
# Crontab: 0 */18 * * * /path/to/waitlist-matching.sh

curl -X POST https://your-domain.com/api/v1/waitlist/trigger-matching \
  -H "Content-Type: application/json" \
  -H "x-api-key: $CRON_API_KEY"
```

## Environment Variables

Both webhooks use the same environment variables:

```env
# For both webhook authentication (API key)
CRON_API_KEY=your_cron_api_key_here

# Database and other required vars
DATABASE_URL=your_database_connection_string
PAYSTACK_SECRET_KEY=your_paystack_secret_key
```

## Security

Both webhooks now use the same simple authentication method:

### API Key Authentication:

- Uses simple API key authentication via `x-api-key` header
- Optional security (if `CRON_API_KEY` environment variable is not set, no authentication required)
- Same key works for both endpoints

## Monitoring

### Health Checks

- **Waitlist Status**: `GET /api/v1/waitlist/matching-status` (public)
- **Payout Status**: Check application logs and database records

### What to Monitor

1. **HTTP Status Codes**: Ensure webhooks return 200 OK
2. **Response Times**: Monitor execution times in response data
3. **Error Logs**: Check application logs for failures
4. **Database Changes**: Verify payouts and matches are created
5. **Notification Delivery**: Ensure patients and centers receive notifications

## Error Handling

### Common Error Responses:

- `400` - Invalid request body or missing required fields
- `401` - Invalid signature or timestamp too old (>5 minutes)
- `500` - Internal server error during processing

### Retry Logic:

```bash
# Simple retry logic in bash
for i in {1..3}; do
  if curl -X POST [webhook_url] [options]; then
    echo "Success on attempt $i"
    break
  else
    echo "Failed attempt $i, retrying..."
    sleep 60  # Wait 1 minute before retry
  fi
done
```

## Quick Setup Checklist

1. **Set environment variables** in your server
2. **Test webhooks manually** first to ensure they work
3. **Set up cron jobs** with proper timing:
   - Monthly payouts: `0 2 1 * *` (1st of month at 2 AM)
   - Waitlist matching: `0 */18 * * *` (every 18 hours)
4. **Monitor logs** after first runs to ensure success
5. **Set up alerting** for webhook failures

That's it! These two webhooks will automate the core financial and matching operations of your platform.
