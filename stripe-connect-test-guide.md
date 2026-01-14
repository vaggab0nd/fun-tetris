# Stripe Connect Test Guide

This guide walks through testing Stripe Connect with a Custom connected account, simulating a Lyft-like platform scenario.

## Prerequisites
- Stripe test account (using test API keys)
- Postman for API testing
- Your Stripe Secret Key (starts with `sk_test_`)

## 3a. Create a Custom Connect Connected Account

**Endpoint:** `POST https://api.stripe.com/v1/accounts`

**Headers:**
```
Authorization: Bearer sk_test_YOUR_SECRET_KEY
Content-Type: application/x-www-form-urlencoded
```

**Body (x-www-form-urlencoded):**
```
type=custom
country=US
email=driver@example.com
capabilities[card_payments][requested]=true
capabilities[transfers][requested]=true
business_type=individual
individual[first_name]=John
individual[last_name]=Driver
individual[email]=driver@example.com
individual[dob][day]=1
individual[dob][month]=1
individual[dob][year]=1990
tos_acceptance[date]={{current_timestamp}}
tos_acceptance[ip]=8.8.8.8
```

**Expected Response:**
You'll get an account object with an `id` field like `acct_xxxxxxxxxxxxx`. This is your connected account ID (the driver's account).

**Save this account ID for the next steps!**

---

## 3b. Create a Destination Charge

This charges the rider $20 and transfers $15 to the driver's connected account.

**Endpoint:** `POST https://api.stripe.com/v1/charges`

**Headers:**
```
Authorization: Bearer sk_test_YOUR_SECRET_KEY
Content-Type: application/x-www-form-urlencoded
```

**Body (x-www-form-urlencoded):**
```
amount=2000
currency=usd
source=tok_visa
description=Lyft ride
destination[account]=acct_xxxxxxxxxxxxx
destination[amount]=1500
application_fee_amount=500
```

**Parameters Explained:**
- `amount=2000` - Total charge to the rider ($20.00 in cents)
- `source=tok_visa` - Test card token (Stripe test mode accepts this)
- `destination[account]` - The connected account ID from step 3a (driver)
- `destination[amount]=1500` - Amount transferred to driver ($15.00 in cents)
- `application_fee_amount=500` - Platform fee kept by Lyft ($5.00 in cents)

**Expected Response:**
You'll get a charge object with an `id` field like `ch_xxxxxxxxxxxxx`.

---

## 3c. Lyft's Platform Fee

**Answer: $5.00**

**Calculation:**
- Total charge: $20.00
- Amount to driver: $15.00
- Platform fee: $20.00 - $15.00 = $5.00

This is the `application_fee_amount` parameter ($5.00).

---

## 3d. Stripe Processing Fee

**Answer: Approximately $0.88**

**Calculation:**
For Stripe Connect with destination charges, the platform (Lyft) pays the Stripe processing fees.

Stripe's standard processing fee:
- 2.9% + $0.30 per transaction
- Fee = ($20.00 × 0.029) + $0.30
- Fee = $0.58 + $0.30 = **$0.88**

---

## 3e. Lyft's Net Earnings

**Answer: $4.12**

**Calculation:**
- Platform fee collected: $5.00
- Stripe processing fee: -$0.88
- **Net earnings: $4.12**

---

## 3f. Charge the Driver $2 (Reverse Transfer)

To charge the driver after the fact, you need to create a **transfer reversal** or use **separate charges**. However, for charging a driver for equipment, you'd typically create a separate charge ON their connected account or use a transfer from their account to your platform.

The most appropriate method is a **transfer** from the connected account to the platform:

**Endpoint:** `POST https://api.stripe.com/v1/transfers`

**Headers:**
```
Authorization: Bearer sk_test_YOUR_SECRET_KEY
Content-Type: application/x-www-form-urlencoded
```

**Body (x-www-form-urlencoded):**
```
amount=200
currency=usd
destination=self
source_transaction={{charge_id_from_3b}}
description=Lyft dashboard sign fee
```

**Alternative Method - Account Debit:**

If you want to debit the connected account's balance directly:

**Endpoint:** `POST https://api.stripe.com/v1/transfers`

**Headers:**
```
Authorization: Bearer sk_test_YOUR_SECRET_KEY
Content-Type: application/x-www-form-urlencoded
Stripe-Account: acct_xxxxxxxxxxxxx
```

**Body (x-www-form-urlencoded):**
```
amount=-200
currency=usd
destination=acct_xxxxxxxxxxxxx
transfer_group=lyft_sign_fee
description=Lyft dashboard sign fee
```

**Note:** For this to work, the connected account needs to have a balance. In practice, you'd either:
1. Deduct from future transfers to the driver
2. Create a charge on a payment method attached to the driver's account
3. Reduce the `destination[amount]` in future charges

**Expected Response:**
Transfer object with an `id` like `tr_xxxxxxxxxxxxx` or `py_xxxxxxxxxxxxx`.

---

## Summary of Fees and Amounts

| Item | Amount |
|------|--------|
| Rider pays | $20.00 |
| Driver receives | $15.00 |
| Platform fee (gross) | $5.00 |
| Stripe processing fee | -$0.88 |
| Platform fee (net) | $4.12 |
| Sign deduction | -$2.00 |
| Driver net (after sign fee) | $13.00 |
| Platform final net | $6.12 |

---

## Testing Tips

1. **Use Stripe's test card tokens:**
   - `tok_visa` - Successful payment
   - `tok_chargeDeclined` - Card declined
   - `tok_visa_debit` - Visa debit card

2. **Check the Stripe Dashboard:**
   - Go to Developers → Events to see all API calls
   - Go to Connect → Accounts to see your connected account
   - Go to Payments to see charges

3. **Timestamps:**
   - For `tos_acceptance[date]`, use current Unix timestamp
   - In Postman, you can use: `{{$timestamp}}`

4. **Account Capabilities:**
   - Custom accounts need capabilities enabled
   - In production, you'd need to verify the account (identity, bank info, etc.)
   - In test mode, capabilities are auto-approved

---

## Common Issues

**"No such token: tok_visa"**
- Solution: The token might have expired. Use Stripe's Checkout or create a test PaymentMethod instead.

**Alternative for creating charges:**
```
amount=2000
currency=usd
source=tok_visa
customer={{customer_id}}
```

Or create a PaymentMethod first:
```
POST https://api.stripe.com/v1/payment_methods
type=card
card[number]=4242424242424242
card[exp_month]=12
card[exp_year]=2026
card[cvc]=123
```

Then use the PaymentMethod ID in the charge.

---

## Next Steps

After completing these steps, you should have:
- ✓ A connected account ID (acct_xxxxxxxxxxxxx)
- ✓ A charge ID (ch_xxxxxxxxxxxxx)
- ✓ Understanding of fee calculations
- ✓ A transfer/debit ID (tr_xxxxxxxxxxxxx or py_xxxxxxxxxxxxx)

Check your Stripe Dashboard to verify all transactions!
