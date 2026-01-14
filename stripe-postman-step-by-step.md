# Stripe Connect Postman Step-by-Step Guide

This guide walks you through each Postman request with exact setup instructions.

## Setup: Get Your API Key

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Secret key** (starts with `sk_test_...`)
3. Keep this handy for all requests

---

## Step 3a: Create Connected Account

### Postman Setup:

**1. Create New Request**
- Method: `POST`
- URL: `https://api.stripe.com/v1/accounts`

**2. Headers Tab:**
```
Authorization: Bearer sk_test_YOUR_SECRET_KEY_HERE
Content-Type: application/x-www-form-urlencoded
```
*(Replace `sk_test_YOUR_SECRET_KEY_HERE` with your actual secret key)*

**3. Body Tab:**
- Select: `x-www-form-urlencoded`
- Add these key-value pairs:

| Key | Value |
|-----|-------|
| type | custom |
| country | US |
| email | driver@example.com |
| capabilities[card_payments][requested] | true |
| capabilities[transfers][requested] | true |
| business_type | individual |
| individual[first_name] | John |
| individual[last_name] | Driver |
| individual[email] | driver@example.com |
| individual[dob][day] | 1 |
| individual[dob][month] | 1 |
| individual[dob][year] | 1990 |
| tos_acceptance[date] | 1736899200 |
| tos_acceptance[ip] | 8.8.8.8 |

*(For `tos_acceptance[date]`, you can use any recent Unix timestamp - the value above is fine for testing)*

**4. Click "Send"**

**5. Find Your Account ID:**
In the response, look for:
```json
{
  "id": "acct_1234567890ABCDEF",
  ...
}
```

**📋 COPY THIS ACCOUNT ID - YOU'LL NEED IT FOR THE NEXT STEP!**

Example: `acct_1QcHfV2eZvKYlo2C` (yours will be different)

---

## Step 3b: Create Destination Charge

### Postman Setup:

**1. Create New Request**
- Method: `POST`
- URL: `https://api.stripe.com/v1/charges`

**2. Headers Tab:**
```
Authorization: Bearer sk_test_YOUR_SECRET_KEY_HERE
Content-Type: application/x-www-form-urlencoded
```

**3. Body Tab:**
- Select: `x-www-form-urlencoded`
- Add these key-value pairs:

| Key | Value |
|-----|-------|
| amount | 2000 |
| currency | usd |
| source | tok_visa |
| description | Lyft ride - rider pays $20 |
| destination[account] | acct_YOUR_ACCOUNT_ID_FROM_STEP_3a |
| destination[amount] | 1500 |
| application_fee_amount | 500 |

**IMPORTANT:** Replace `acct_YOUR_ACCOUNT_ID_FROM_STEP_3a` with the actual account ID you got from step 3a!

**What these mean:**
- `amount: 2000` = Charge rider $20.00 (in cents)
- `source: tok_visa` = Test card token (works in test mode)
- `destination[account]` = Driver's connected account ID
- `destination[amount]: 1500` = Send $15.00 to driver
- `application_fee_amount: 500` = Platform keeps $5.00

**4. Click "Send"**

**5. Find Your Charge ID:**
In the response, look for:
```json
{
  "id": "ch_3AbCdEfGhIjKlMnO",
  ...
}
```

**📋 COPY THIS CHARGE ID - YOU'LL NEED IT FOR STEP 3f!**

---

## Step 3c: Lyft's Platform Fee

**Answer: $5.00**

You don't need Postman for this - it's just math:
- Rider pays: $20.00 (`amount: 2000` cents)
- Driver gets: $15.00 (`destination[amount]: 1500` cents)
- Platform fee: $20.00 - $15.00 = **$5.00**

This is the `application_fee_amount: 500` parameter you set.

---

## Step 3d: Stripe Processing Fee

**Answer: $0.88**

Calculation (Stripe's standard rate):
- 2.9% + $0.30 per transaction
- On a $20.00 charge: ($20.00 × 0.029) + $0.30 = $0.58 + $0.30 = **$0.88**

The platform (Lyft) pays this fee.

**You can verify this in Stripe Dashboard:**
1. Go to: https://dashboard.stripe.com/test/payments
2. Find your charge from step 3b
3. Click on it to see the fee breakdown

---

## Step 3e: Lyft's Net Earnings

**Answer: $4.12**

Calculation:
- Platform fee collected: $5.00
- Minus Stripe processing fee: -$0.88
- **Net earnings: $4.12**

---

## Step 3f: Charge Driver $2 for Lyft Sign

There are two approaches. I'll show you both:

### Option 1: Transfer from Connected Account Balance (Recommended)

**1. Create New Request**
- Method: `POST`
- URL: `https://api.stripe.com/v1/transfers`

**2. Headers Tab:**
```
Authorization: Bearer sk_test_YOUR_SECRET_KEY_HERE
Content-Type: application/x-www-form-urlencoded
```

**3. Body Tab:**
- Select: `x-www-form-urlencoded`
- Add these key-value pairs:

| Key | Value |
|-----|-------|
| amount | 200 |
| currency | usd |
| destination | acct_YOUR_ACCOUNT_ID_FROM_STEP_3a |
| source_transaction | ch_YOUR_CHARGE_ID_FROM_STEP_3b |
| description | Lyft dashboard sign fee |
| metadata[type] | equipment_fee |

**Note:** Replace the account ID and charge ID with your actual values!

**4. Click "Send"**

**5. Find Your Transfer ID:**
```json
{
  "id": "tr_1234567890ABCDEF",
  ...
}
```

**📋 THIS IS YOUR ANSWER FOR 3f!** The transfer ID like `tr_1234567890ABCDEF`

---

### Option 2: Application Fee Refund (Alternative)

This "refunds" $2 from the application fee back to the connected account:

**1. Create New Request**
- Method: `POST`
- URL: `https://api.stripe.com/v1/application_fees/{fee_id}/refunds`

**First, you need to get the application fee ID from step 3b's charge response:**
- Look in the charge response for: `"application_fee": "fee_xxxxx"`
- Replace `{fee_id}` in the URL with this value

**2. Headers Tab:**
```
Authorization: Bearer sk_test_YOUR_SECRET_KEY_HERE
Content-Type: application/x-www-form-urlencoded
```

**3. Body Tab:**
- Select: `x-www-form-urlencoded`
- Add:

| Key | Value |
|-----|-------|
| amount | 200 |

**Note:** This reduces YOUR platform fee and sends money to the driver (opposite of what you want for charging them!)

---

## Troubleshooting

### Error: "No such token: tok_visa"

If you get this error, create a test card token first:

**1. Create New Request**
- Method: `POST`
- URL: `https://api.stripe.com/v1/tokens`

**2. Headers Tab:**
```
Authorization: Bearer sk_test_YOUR_SECRET_KEY_HERE
Content-Type: application/x-www-form-urlencoded
```

**3. Body Tab:**

| Key | Value |
|-----|-------|
| card[number] | 4242424242424242 |
| card[exp_month] | 12 |
| card[exp_year] | 2027 |
| card[cvc] | 123 |

**4. Use the returned token ID in step 3b instead of `tok_visa`**

---

### Error: "Account capabilities not active"

Wait 2-3 seconds and try again. In test mode, capabilities are auto-activated but may take a moment.

---

### Error: "Invalid destination"

Make sure you copied the full account ID from step 3a, including the `acct_` prefix.

---

## Summary Checklist

After completing all steps, you should have:

- ✅ **3a:** Connected account ID (starts with `acct_`)
- ✅ **3b:** Charge ID (starts with `ch_`)
- ✅ **3c:** Platform fee = **$5.00**
- ✅ **3d:** Stripe fee = **$0.88**
- ✅ **3e:** Net earnings = **$4.12**
- ✅ **3f:** Transfer ID (starts with `tr_`)

---

## Quick Reference: Fee Breakdown

| Item | Amount | Who Gets It |
|------|--------|-------------|
| Rider pays | $20.00 | → Stripe → Platform |
| Driver receives | $15.00 | → Driver (connected account) |
| Platform fee | $5.00 | → Platform |
| Stripe fee | -$0.88 | → Stripe |
| Platform net | $4.12 | → Platform keeps |
| Sign charge | $2.00 | → Deducted from driver |
| Driver final net | $13.00 | → Driver keeps |

---

## View in Stripe Dashboard

1. **See all charges:** https://dashboard.stripe.com/test/payments
2. **See connected accounts:** https://dashboard.stripe.com/test/connect/accounts/overview
3. **See transfers:** https://dashboard.stripe.com/test/connect/transfers
4. **See all events:** https://dashboard.stripe.com/test/events

---

## Pro Tips

1. **Save as Postman Collection:** Save all these requests in a collection called "Stripe Connect Testing"

2. **Use Postman Variables:**
   - Create environment variable: `stripe_secret_key`
   - Use: `{{stripe_secret_key}}` in Authorization header
   - Create variables for `account_id` and `charge_id` to reuse

3. **Tests Tab in Postman:** Add this to automatically save IDs:
   ```javascript
   // In step 3a, Tests tab:
   pm.environment.set("account_id", pm.response.json().id);

   // In step 3b, Tests tab:
   pm.environment.set("charge_id", pm.response.json().id);
   ```

   Then use `{{account_id}}` and `{{charge_id}}` in later requests!

---

Good luck with your testing! 🚀
