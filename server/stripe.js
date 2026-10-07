import Stripe from 'stripe'

const host = process.env.STRIPE_API_HOST // test hook: point at a local fake Stripe
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, host ? { host, port: process.env.STRIPE_API_PORT, protocol: 'http' } : {})
  : null

if (!stripe) console.warn('[pay] STRIPE_SECRET_KEY not set - online payment disabled, bookings fall back to vendor-confirmed requests')

// Countries offered at payout onboarding. Cross-border payouts from an Australian platform are
// limited by Stripe to certain countries; confirm the final list with Stripe.
export const PAYOUT_COUNTRIES = {
  AU: 'Australia', NZ: 'New Zealand', GB: 'United Kingdom', US: 'United States', IT: 'Italy', FR: 'France',
  ES: 'Spain', PT: 'Portugal', GR: 'Greece', TH: 'Thailand', JP: 'Japan', AE: 'United Arab Emirates', MX: 'Mexico',
}
