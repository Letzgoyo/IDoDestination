import express from 'express'
import { existsSync } from 'node:fs'
import { db } from './db.js'
import { sendMail } from './mailer.js'
import { checkPassword, issueToken, requireAdmin, rateLimit } from './auth.js'
import { DESTINATIONS, CATEGORIES } from './destinations.js'
import { router as bookings, webhook, issueRefund, getByToken } from './bookings.js'
import { router as connect } from './connect.js'
import { router as photos } from './photos.js'
import { seoRoutes, pageHandler } from './seo.js'
import { stripe } from './stripe.js'
import { randomBytes } from 'node:crypto'

const app = express()
const PORT = process.env.PORT || 3001
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const SITE_URL = process.env.SITE_URL || 'http://localhost:5173'

app.set('trust proxy', 1)
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), webhook)
app.use('/api', photos)
app.use(express.json({ limit: '50kb' }))
app.use('/api', bookings)
app.use('/api', connect)

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const int = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Math.max(0, Math.round(Number(v))))
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const omitTokens = (v) => Object.fromEntries(Object.entries(v).filter(([k]) => !k.endsWith('_token')))
const PUBLIC_COLS = `id, slug, (SELECT id FROM vendor_photos WHERE vendor_id=vendors.id ORDER BY position LIMIT 1) AS cover_photo_id, business_name, category, destination, country, lat, lng, bio,
  price_from_aud, offers_trial, trial_price_aud, based_in_australia, instagram, website`

// Map tiles default to OpenStreetMap (no API key). Set MAP_TILES_URL (e.g. a MapTiler/Stadia URL with your key) for heavier traffic.
const MAP = {
  tiles: process.env.MAP_TILES_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: process.env.MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}
app.get('/api/meta', (_req, res) => res.json({ destinations: DESTINATIONS, categories: CATEGORIES, map: MAP }))

app.get('/api/vendors', (_req, res) => {
  res.json(db.prepare(`SELECT ${PUBLIC_COLS} FROM vendors WHERE status='approved' ORDER BY business_name`).all())
})

app.get('/api/vendors/:slug', (req, res) => {
  const v = db.prepare(`SELECT ${PUBLIC_COLS}, stripe_ready FROM vendors WHERE status='approved' AND slug=?`).get(req.params.slug)
  if (!v) return res.status(404).json({ error: 'Vendor not found' })
  const { stripe_ready, ...pub } = v
  const services = db.prepare('SELECT id, name, description, type, price_aud, instant FROM services WHERE vendor_id=? ORDER BY price_aud').all(v.id)
  // `online` = the couple can actually pay now (vendor opted in AND is connected to Stripe).
  res.json({ ...pub, photos: db.prepare('SELECT id FROM vendor_photos WHERE vendor_id=? ORDER BY position').all(v.id).map((x) => x.id), services: services.map(({ instant, ...x }) => ({ ...x, online: !!(instant && stripe && stripe_ready) })) })
})

app.post('/api/apply', rateLimit(5, 60 * 60 * 1000), async (req, res) => {
  const b = req.body || {}
  const dest = DESTINATIONS.find((d) => d.name === b.destination)
  const data = {
    business_name: str(b.business_name, 120),
    contact_name: str(b.contact_name, 120),
    email: str(b.email, 200).toLowerCase(),
    phone: str(b.phone, 40),
    category: str(b.category, 60),
    bio: str(b.bio, 2000),
    instagram: str(b.instagram, 100),
    website: str(b.website, 200),
    based_in_australia: b.based_in_australia ? 1 : 0,
  }
  if (!data.business_name || !data.contact_name || !isEmail(data.email) || data.bio.length < 40)
    return res.status(400).json({ error: 'Please complete all required fields (bio needs at least 40 characters).' })
  const services = (Array.isArray(b.services) ? b.services : []).slice(0, 8).map((x) => ({
    name: str(x?.name, 120), description: str(x?.description, 500),
    type: ['trial', 'package', 'deposit'].includes(x?.type) ? x.type : 'package',
    price_aud: int(x?.price_aud), instant: x?.instant ? 1 : 0,
  }))
  if (!services.length || services.some((x) => !x.name || !x.price_aud))
    return res.status(400).json({ error: 'Add at least one service with a name and a price in AUD.' })
  const trial = services.find((x) => x.type === 'trial')
  data.offers_trial = trial ? 1 : 0
  data.trial_price_aud = trial ? trial.price_aud : null
  data.price_from_aud = Math.min(...services.map((x) => x.price_aud))
  if (!CATEGORIES.includes(data.category) || !dest)
    return res.status(400).json({ error: 'Please choose a valid category and destination.' })
  if (data.website && !/^https?:\/\//.test(data.website))
    return res.status(400).json({ error: 'Website must start with http:// or https://' })

  const base = slugify(`${data.business_name}-${dest.name}`) || 'vendor'
  let slug = base
  for (let i = 2; db.prepare('SELECT 1 FROM vendors WHERE slug=?').get(slug); i++) slug = `${base}-${i}`

  const applyToken = randomBytes(18).toString('base64url')
  db.prepare(`INSERT INTO vendors (slug, apply_token, business_name, contact_name, email, phone, category, destination, country,
      lat, lng, bio, price_from_aud, offers_trial, trial_price_aud, based_in_australia, instagram, website)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    slug, applyToken, data.business_name, data.contact_name, data.email, data.phone, data.category, dest.name, dest.country,
    dest.lat, dest.lng, data.bio, data.price_from_aud, data.offers_trial, data.trial_price_aud,
    data.based_in_australia, data.instagram, data.website)

  const { id: vendorId } = db.prepare('SELECT id FROM vendors WHERE slug=?').get(slug)
  const addService = db.prepare('INSERT INTO services (vendor_id, name, description, type, price_aud, instant) VALUES (?,?,?,?,?,?)')
  for (const x of services) addService.run(vendorId, x.name, x.description, x.type, x.price_aud, x.instant)

  res.status(201).json({ ok: true, upload_token: applyToken })
  await sendMail({
    to: data.email,
    subject: 'We received your I Do Destination application',
    text: `Hi ${data.contact_name},\n\nThanks for applying to list ${data.business_name} on I Do Destination. Every vendor is reviewed by our team and we'll be in touch soon.\n\nI Do Destination`,
  })
  if (ADMIN_EMAIL)
    await sendMail({
      to: ADMIN_EMAIL,
      subject: `New vendor application: ${data.business_name}`,
      text: `${data.business_name} (${data.category}, ${dest.name}) has applied.\nReview: ${SITE_URL}/admin`,
    })
})

app.post('/api/vendors/:slug/enquire', rateLimit(10, 60 * 60 * 1000), async (req, res) => {
  const v = db.prepare(`SELECT id, business_name, contact_name, email, offers_trial FROM vendors WHERE status='approved' AND slug=?`).get(req.params.slug)
  if (!v) return res.status(404).json({ error: 'Vendor not found' })
  const b = req.body || {}
  const e = {
    name: str(b.name, 120),
    email: str(b.email, 200).toLowerCase(),
    wedding_date: str(b.wedding_date, 20),
    guest_count: int(b.guest_count),
    wants_trial: b.wants_trial && v.offers_trial ? 1 : 0,
    message: str(b.message, 3000),
  }
  if (!e.name || !isEmail(e.email) || e.message.length < 10)
    return res.status(400).json({ error: 'Please add your name, a valid email and a message.' })

  db.prepare(`INSERT INTO enquiries (vendor_id, name, email, wedding_date, guest_count, wants_trial, message)
    VALUES (?,?,?,?,?,?,?)`).run(v.id, e.name, e.email, e.wedding_date, e.guest_count, e.wants_trial, e.message)

  res.status(201).json({ ok: true })
  await sendMail({
    to: v.email,
    replyTo: e.email,
    subject: `New enquiry from ${e.name} via I Do Destination`,
    text: `Hi ${v.contact_name},\n\n${e.name} <${e.email}> sent an enquiry.\nWedding date: ${e.wedding_date || 'not set'}\nGuests: ${e.guest_count ?? 'not set'}\nWould like a trial: ${e.wants_trial ? 'Yes' : 'No'}\n\n${e.message}\n\nReply to this email to respond directly. Please quote in AUD.`,
  })
})

// ---- Admin ----
app.post('/api/admin/login', rateLimit(10, 15 * 60 * 1000), (req, res) => {
  if (!checkPassword(req.body?.password ?? '')) return res.status(401).json({ error: 'Incorrect password' })
  res.json({ token: issueToken() })
})

app.get('/api/admin/vendors', requireAdmin, (_req, res) => {
  const services = db.prepare('SELECT * FROM services').all()
  const photoRows = db.prepare('SELECT id, vendor_id FROM vendor_photos ORDER BY position').all()
  res.json(db.prepare('SELECT * FROM vendors ORDER BY created_at DESC').all().map((row) => ({ ...omitTokens(row), services: services.filter((x) => x.vendor_id === row.id), photos: photoRows.filter((x) => x.vendor_id === row.id).map((x) => x.id) })))
})

app.get('/api/admin/bookings', requireAdmin, (_req, res) => {
  res.json(db.prepare(`SELECT b.id, b.status, b.couple_name, b.couple_email, b.wedding_date, b.amount_aud, b.fee_aud, b.paid_at, b.refund_aud, b.created_at,
    s.name AS service_name, v.business_name FROM bookings b JOIN services s ON s.id=b.service_id JOIN vendors v ON v.id=b.vendor_id ORDER BY b.created_at DESC`).all())
})

app.post('/api/admin/bookings/:id/refund', requireAdmin, async (req, res) => {
  const row = db.prepare('SELECT token FROM bookings WHERE id=?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  const b = getByToken(row.token)
  if (b.status !== 'paid') return res.status(409).json({ error: 'Only paid bookings can be refunded.' })
  const amount = req.body?.amount_aud == null ? b.amount_aud : int(req.body.amount_aud)
  if (amount == null || amount > b.amount_aud) return res.status(400).json({ error: 'Invalid refund amount.' })
  try { await issueRefund(b, amount, 'admin'); res.json({ ok: true }) } catch (e) { res.status(502).json({ error: e.message }) }
})

app.post('/api/admin/vendors/:id/status', requireAdmin, async (req, res) => {
  const status = req.body?.status
  if (!['approved', 'rejected', 'pending'].includes(status)) return res.status(400).json({ error: 'Invalid status' })
  const notes = str(req.body?.notes, 1000)
  const v = db.prepare('SELECT * FROM vendors WHERE id=?').get(req.params.id)
  if (!v) return res.status(404).json({ error: 'Not found' })
  db.prepare(`UPDATE vendors SET status=?, admin_notes=?, reviewed_at=datetime('now') WHERE id=?`).run(status, notes, v.id)
  let manageToken = v.manage_token
  if (status === 'approved' && !manageToken) {
    manageToken = randomBytes(18).toString('base64url')
    db.prepare('UPDATE vendors SET manage_token=? WHERE id=?').run(manageToken, v.id)
  }
  res.json({ ok: true })
  if (status === 'approved')
    await sendMail({ to: v.email, subject: 'You\'re approved on I Do Destination', text: `Hi ${v.contact_name},\n\nGreat news - ${v.business_name} is now live: ${SITE_URL}/vendors/${v.slug}\n\nTo receive payouts for online bookings in your own currency, connect your bank account with Stripe (private link, keep it safe): ${SITE_URL}/vendor/${manageToken}\n\nI Do Destination` })
  if (status === 'rejected')
    await sendMail({ to: v.email, subject: 'Your I Do Destination application', text: `Hi ${v.contact_name},\n\nThanks for applying. Unfortunately we're unable to list ${v.business_name} at this time.${notes ? `\n\n${notes}` : ''}\n\nI Do Destination` })
})

seoRoutes(app)
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }))

if (existsSync('dist')) {
  // index: false so every page (including "/") goes through the SEO handler below.
  app.use(express.static('dist', { index: false }))
  const page = pageHandler('dist/index.html')
  app.get(/.*/, page)
}

app.listen(PORT, () => console.log(`API listening on :${PORT}`))
