import { Router } from 'express'
import { randomBytes } from 'node:crypto'
import { db } from './db.js'
import { sendMail } from './mailer.js'
import { rateLimit } from './auth.js'
import { stripe } from './stripe.js'
import { syncByAccount } from './connect.js'

const SITE_URL = process.env.SITE_URL || 'http://localhost:5173'
const FULL_DAYS = Number(process.env.REFUND_FULL_DAYS ?? 60)
const PARTIAL_DAYS = Number(process.env.REFUND_PARTIAL_DAYS ?? 30)
const COOLING_HOURS = 48
const FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? 10)
export const paymentsEnabled = () => !!stripe

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const newToken = () => randomBytes(18).toString('base64url')

const getByToken = (token) => db.prepare(`
  SELECT b.*, s.name AS service_name, s.type AS service_type, s.instant AS service_instant,
         v.business_name, v.contact_name AS vendor_contact, v.email AS vendor_email, v.slug AS vendor_slug, v.stripe_account_id, v.stripe_ready
  FROM bookings b JOIN services s ON s.id=b.service_id JOIN vendors v ON v.id=b.vendor_id
  WHERE b.token=?`).get(token)

const publicView = (b) => ({
  token: b.token, status: b.status, service_name: b.service_name, service_type: b.service_type,
  business_name: b.business_name, vendor_slug: b.vendor_slug, amount_aud: b.amount_aud,
  wedding_date: b.wedding_date, refund_aud: b.refund_aud, refund_if_cancelled_aud: refundFor(b), payment_available: !!stripe && !!b.stripe_ready && b.status !== 'paid' && b.status !== 'declined' && (b.status === 'accepted' || !!b.service_instant),
})

async function checkoutUrl(b) {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    currency: 'aud',
    customer_email: b.couple_email,
    client_reference_id: b.token,
    payment_intent_data: {
      application_fee_amount: b.fee_aud * 100,
      transfer_data: { destination: b.stripe_account_id },
      metadata: { booking: b.token },
    },
    line_items: [{ quantity: 1, price_data: { currency: 'aud', unit_amount: b.amount_aud * 100,
      product_data: { name: `${b.service_name} - ${b.business_name}` } } }],
    success_url: `${SITE_URL}/booking/${b.token}?paid=1`,
    cancel_url: `${SITE_URL}/booking/${b.token}`,
  })
  db.prepare('UPDATE bookings SET stripe_session_id=? WHERE id=?').run(session.id, b.id)
  return session.url
}

// Refund a couple is entitled to if THEY cancel a paid booking. Vendor cancellations and admin refunds bypass this.
export function refundFor(b, now = Date.now()) {
  if (b.status !== 'paid') return 0
  if (b.service_type === 'trial') return 0
  const hours = (now - new Date(`${b.paid_at.replace(' ', 'T')}Z`).getTime()) / 36e5
  if (hours < COOLING_HOURS) return b.amount_aud
  if (!b.wedding_date) return 0
  const days = (new Date(b.wedding_date).getTime() - now) / 864e5
  if (days >= FULL_DAYS) return b.amount_aud
  if (days >= PARTIAL_DAYS) return Math.round(b.amount_aud / 2)
  return 0
}

async function issueRefund(b, amount, cancelledBy) {
  if (amount > 0) {
    if (!stripe || !b.payment_intent_id) throw new Error('This payment cannot be refunded automatically. Please contact us.')
    await stripe.refunds.create({ payment_intent: b.payment_intent_id, amount: amount * 100, reverse_transfer: true,
      refund_application_fee: true, metadata: { booking: b.token, cancelled_by: cancelledBy } })
  }
  db.prepare(`UPDATE bookings SET status='cancelled', refund_aud=? WHERE id=?`).run(amount, b.id)
  const line = b.status !== 'paid' ? 'No payment had been taken, so nothing is owed.' : amount > 0 ? `A$${amount} AUD will be refunded to your original payment method (allow 5-10 business days).` : 'This booking is not eligible for a refund under the cancellation policy.'
  await sendMail({ to: b.couple_email, subject: `Booking cancelled - ${b.business_name}`,
    text: `Hi ${b.couple_name},\n\nYour booking for ${b.service_name} with ${b.business_name} has been cancelled${cancelledBy === 'vendor' ? ' by the vendor' : ''}.\n${line}` })
  await sendMail({ to: b.vendor_email, subject: `Booking cancelled: ${b.couple_name} - ${b.service_name}`,
    text: `Hi ${b.vendor_contact},\n\nThe booking for ${b.service_name} from ${b.couple_name} was cancelled (${cancelledBy}). Refund: A$${amount} AUD.${amount > 0 ? ' The corresponding transfer and platform fee are reversed automatically.' : ''}` })
}

async function markPaid(token, paymentIntent) {
  const b = getByToken(token)
  if (!b || b.status === 'paid') return
  db.prepare(`UPDATE bookings SET status='paid', paid_at=datetime('now'), payment_intent_id=COALESCE(?, payment_intent_id) WHERE id=?`).run(paymentIntent || null, b.id)
  const summary = `${b.service_name} (A$${b.amount_aud} AUD)`
  await sendMail({ to: b.couple_email, subject: `Payment confirmed - ${b.business_name}`,
    text: `Hi ${b.couple_name},\n\nWe've received your payment for ${summary} with ${b.business_name}. They'll be in touch to finalise details.\n\nView your booking: ${SITE_URL}/booking/${b.token}` })
  await sendMail({ to: b.vendor_email, replyTo: b.couple_email, subject: `Paid booking: ${b.couple_name} - ${b.service_name}`,
    text: `Hi ${b.vendor_contact},\n\n${b.couple_name} <${b.couple_email}> has paid for ${summary}.\nWedding date: ${b.wedding_date || 'not set'}\n\nReply to this email to coordinate. Platform fee (${FEE_PERCENT}%): A$${b.fee_aud}. Your payout (price minus fee) is sent to your connected Stripe account.` })
}

export const webhook = async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).end()
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return res.status(400).send('Bad signature')
  }
  if (event.type === 'account.updated') await syncByAccount(event.data.object.id)
  if (event.type === 'checkout.session.completed' && event.data.object.payment_status === 'paid')
    await markPaid(event.data.object.client_reference_id, event.data.object.payment_intent)
  res.json({ received: true })
}

export const router = Router()
export { issueRefund, getByToken }

router.post('/bookings', rateLimit(10, 60 * 60 * 1000), async (req, res) => {
  const b = req.body || {}
  const service = db.prepare(`SELECT s.*, v.business_name, v.contact_name, v.email AS vendor_email, v.slug FROM services s
    JOIN vendors v ON v.id=s.vendor_id WHERE s.id=? AND v.status='approved'`).get(Number(b.service_id))
  if (!service) return res.status(404).json({ error: 'Service not found' })
  const d = { name: str(b.name, 120), email: str(b.email, 200).toLowerCase(), date: str(b.wedding_date, 20), msg: str(b.message, 3000),
    guests: Number.isFinite(Number(b.guest_count)) && b.guest_count !== '' ? Math.max(0, Math.round(Number(b.guest_count))) : null }
  if (!d.name || !isEmail(d.email)) return res.status(400).json({ error: 'Please add your name and a valid email.' })

  const token = newToken(), vendorToken = newToken()
  const fee = Math.round((service.price_aud * FEE_PERCENT) / 100)
  db.prepare(`INSERT INTO bookings (token, vendor_token, vendor_id, service_id, couple_name, couple_email, wedding_date, guest_count, message, amount_aud, fee_aud)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(token, vendorToken, service.vendor_id, service.id, d.name, d.email, d.date, d.guests, d.msg, service.price_aud, fee)

  const booking = getByToken(token)
  const payNow = service.instant && stripe && booking.stripe_ready
  let url = null
  if (payNow) url = await checkoutUrl(booking).catch((e) => { console.error('[pay] checkout failed', e.message); return null })
  res.status(201).json({ token, checkout_url: url })

  await sendMail({ to: d.email, subject: `Your ${payNow ? 'booking' : 'request'} with ${service.business_name}`,
    text: `Hi ${d.name},\n\nWe've ${payNow ? 'started your booking' : 'sent your request'} for ${service.name} (A$${service.price_aud} AUD) with ${service.business_name}.${payNow ? '' : ' They will confirm shortly and you will be able to pay in AUD from your booking page.'}\n\nYour booking page: ${SITE_URL}/booking/${token}` })
  await sendMail({ to: service.vendor_email, replyTo: d.email, subject: `New ${payNow ? 'booking' : 'booking request'}: ${d.name} - ${service.name}`,
    text: `Hi ${service.contact_name},\n\n${d.name} <${d.email}> would like ${service.name} (A$${service.price_aud} AUD).\nWedding date: ${d.date || 'not set'}\nGuests: ${d.guests ?? 'not set'}\n\n${d.msg || ''}\n\nAccept or decline: ${SITE_URL}/vendor-action/${vendorToken}` })
})

router.get('/bookings/:token', async (req, res) => {
  let b = getByToken(req.params.token)
  if (!b) return res.status(404).json({ error: 'Booking not found' })
  // Reconcile with Stripe so payment shows even if the webhook is delayed or not configured.
  if (stripe && b.status !== 'paid' && b.stripe_session_id) {
    const s = await stripe.checkout.sessions.retrieve(b.stripe_session_id).catch(() => null)
    if (s?.payment_status === 'paid') { await markPaid(b.token, s.payment_intent); b = getByToken(b.token) }
  }
  res.json(publicView(b))
})

router.get('/policy', (_req, res) => res.json({ full_days: FULL_DAYS, partial_days: PARTIAL_DAYS, cooling_hours: COOLING_HOURS }))

router.post('/bookings/:token/cancel', rateLimit(10, 60 * 60 * 1000), async (req, res) => {
  const b = getByToken(req.params.token)
  if (!b) return res.status(404).json({ error: 'Booking not found' })
  if (!['requested', 'accepted', 'paid'].includes(b.status)) return res.status(409).json({ error: `This booking is already ${b.status}.` })
  try {
    await issueRefund(b, refundFor(b), 'couple')
    res.json({ ok: true })
  } catch (e) { res.status(502).json({ error: e.message }) }
})

router.post('/bookings/:token/pay', rateLimit(20, 60 * 60 * 1000), async (req, res) => {
  const b = getByToken(req.params.token)
  if (!b) return res.status(404).json({ error: 'Booking not found' })
  if (!stripe || !b.stripe_ready) return res.status(503).json({ error: 'Online payment is not available for this vendor yet.' })
  if (b.status === 'paid' || b.status === 'declined' || (b.status === 'requested' && !b.service_instant))
    return res.status(409).json({ error: 'This booking cannot be paid right now.' })
  res.json({ checkout_url: await checkoutUrl(b) })
})

// Vendor responds via the private link in their email.
router.get('/vendor-actions/:vtoken', (req, res) => {
  const b = db.prepare('SELECT token FROM bookings WHERE vendor_token=?').get(req.params.vtoken)
  if (!b) return res.status(404).json({ error: 'Link not found' })
  const x = getByToken(b.token)
  res.json({ status: x.status, service_name: x.service_name, amount_aud: x.amount_aud, fee_aud: x.fee_aud, couple_name: x.couple_name,
    couple_email: x.couple_email, wedding_date: x.wedding_date, guest_count: x.guest_count, message: x.message, business_name: x.business_name })
})

router.post('/vendor-actions/:vtoken', async (req, res) => {
  const row = db.prepare('SELECT token FROM bookings WHERE vendor_token=?').get(req.params.vtoken)
  if (!row) return res.status(404).json({ error: 'Link not found' })
  const b = getByToken(row.token)
  const action = req.body?.action
  if (action === 'cancel') {
    if (!['accepted', 'paid'].includes(b.status)) return res.status(409).json({ error: `This booking is ${b.status}, so it can't be cancelled.` })
    try { await issueRefund(b, b.status === 'paid' ? b.amount_aud : 0, 'vendor'); return res.json({ ok: true, status: 'cancelled' }) }
    catch (e) { return res.status(502).json({ error: e.message }) }
  }
  if (!['accept', 'decline'].includes(action)) return res.status(400).json({ error: 'Invalid action' })
  if (b.status !== 'requested') return res.status(409).json({ error: `This booking is already ${b.status}.` })
  const status = action === 'accept' ? 'accepted' : 'declined'
  db.prepare('UPDATE bookings SET status=? WHERE id=?').run(status, b.id)
  res.json({ ok: true, status })
  const link = `${SITE_URL}/booking/${b.token}`
  await sendMail({ to: b.couple_email, subject: `${b.business_name} ${status === 'accepted' ? 'accepted' : 'declined'} your request`,
    text: status === 'accepted'
      ? `Hi ${b.couple_name},\n\nGood news - ${b.business_name} accepted your request for ${b.service_name}.\n${stripe && b.stripe_ready ? `Pay securely in AUD here: ${link}` : 'They will contact you to arrange payment.'}`
      : `Hi ${b.couple_name},\n\nUnfortunately ${b.business_name} can't take your request for ${b.service_name}. You're welcome to browse other vendors: ${SITE_URL}/vendors` })
})

router.get('/payments-enabled', (_req, res) => res.json({ enabled: !!stripe }))
