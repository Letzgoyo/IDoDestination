import { createHmac, timingSafeEqual } from 'node:crypto'

const SECRET = process.env.SESSION_SECRET || 'dev-only-secret-change-me'
const TTL_MS = 1000 * 60 * 60 * 12

const sign = (payload) => createHmac('sha256', SECRET).update(payload).digest('base64url')

function safeEqual(a, b) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export function checkPassword(input) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  return safeEqual(createHmac('sha256', SECRET).update(String(input)).digest('hex'),
    createHmac('sha256', SECRET).update(expected).digest('hex'))
}

export const issueToken = () => {
  const payload = String(Date.now() + TTL_MS)
  return `${payload}.${sign(payload)}`
}

export function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '')
  const [payload, sig] = token.split('.')
  if (payload && sig && safeEqual(sig, sign(payload)) && Number(payload) > Date.now()) return next()
  res.status(401).json({ error: 'Unauthorised' })
}

const hits = new Map()
export function rateLimit(max, windowMs) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`
    const now = Date.now()
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs)
    if (recent.length >= max) return res.status(429).json({ error: 'Too many requests, please try again shortly.' })
    recent.push(now)
    hits.set(key, recent)
    next()
  }
}
