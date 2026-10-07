import { Router } from 'express'
import { db } from './db.js'
import { stripe, PAYOUT_COUNTRIES } from './stripe.js'
import { rateLimit } from './auth.js'

const SITE_URL = process.env.SITE_URL || 'http://localhost:5173'
const byToken = (t) => db.prepare(`SELECT * FROM vendors WHERE manage_token=? AND status='approved'`).get(t)

// Pull the latest capability state from Stripe and cache whether this vendor can receive transfers.
export async function syncVendor(v) {
  if (!stripe || !v.stripe_account_id) return v
  const acct = await stripe.accounts.retrieve(v.stripe_account_id)
  const ready = acct.capabilities?.transfers === 'active' ? 1 : 0
  if (ready !== v.stripe_ready) db.prepare('UPDATE vendors SET stripe_ready=? WHERE id=?').run(ready, v.id)
  return { ...v, stripe_ready: ready, details_submitted: acct.details_submitted }
}

export const syncByAccount = async (accountId) => {
  const v = db.prepare('SELECT * FROM vendors WHERE stripe_account_id=?').get(accountId)
  if (v) await syncVendor(v)
}

export const router = Router()

router.get('/manage/:mtoken', async (req, res) => {
  let v = byToken(req.params.mtoken)
  if (!v) return res.status(404).json({ error: 'Link not found' })
  v = await syncVendor(v).catch(() => v)
  res.json({ business_name: v.business_name, payments_available: !!stripe, has_account: !!v.stripe_account_id,
    ready: !!v.stripe_ready, details_submitted: !!v.details_submitted, countries: PAYOUT_COUNTRIES })
})

router.post('/manage/:mtoken/onboard', rateLimit(20, 60 * 60 * 1000), async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Online payments are not enabled yet.' })
  const v = byToken(req.params.mtoken)
  if (!v) return res.status(404).json({ error: 'Link not found' })
  let accountId = v.stripe_account_id
  if (!accountId) {
    const country = PAYOUT_COUNTRIES[req.body?.country] ? req.body.country : 'AU'
    const domestic = country === 'AU'
    const acct = await stripe.accounts.create({
      type: 'express', country, email: v.email,
      business_profile: { name: v.business_name, url: v.website || undefined },
      capabilities: domestic ? { card_payments: { requested: true }, transfers: { requested: true } } : { transfers: { requested: true } },
      // Accounts outside Australia must use the recipient agreement for cross-border transfers.
      ...(domestic ? {} : { tos_acceptance: { service_agreement: 'recipient' } }),
      metadata: { vendor_id: String(v.id) },
    })
    accountId = acct.id
    db.prepare('UPDATE vendors SET stripe_account_id=? WHERE id=?').run(accountId, v.id)
  }
  const link = await stripe.accountLinks.create({
    account: accountId, type: 'account_onboarding',
    refresh_url: `${SITE_URL}/vendor/${req.params.mtoken}`, return_url: `${SITE_URL}/vendor/${req.params.mtoken}`,
  })
  res.json({ url: link.url })
})
