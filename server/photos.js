import { Router, raw } from 'express'
import { db } from './db.js'
import { requireAdmin, rateLimit } from './auth.js'

const MAX_PHOTOS = 8
const MAX_BYTES = 3 * 1024 * 1024

// Identify the real image type from the file's first bytes rather than trusting the client's header.
function sniff(buf) {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'image/webp'
  return null
}

export const router = Router()

router.post('/uploads/:token', rateLimit(40, 60 * 60 * 1000), raw({ type: () => true, limit: MAX_BYTES }), (req, res) => {
  const v = db.prepare(`SELECT id FROM vendors WHERE apply_token=? AND status != 'rejected'`).get(req.params.token)
  if (!v) return res.status(404).json({ error: 'Upload link not found' })
  const buf = req.body
  if (!Buffer.isBuffer(buf) || !buf.length) return res.status(400).json({ error: 'No image received.' })
  const mime = sniff(buf)
  if (!mime) return res.status(415).json({ error: 'Please upload a JPEG, PNG or WebP image.' })
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM vendor_photos WHERE vendor_id=?').get(v.id)
  if (n >= MAX_PHOTOS) return res.status(409).json({ error: `You can upload up to ${MAX_PHOTOS} photos.` })
  const { lastInsertRowid } = db.prepare('INSERT INTO vendor_photos (vendor_id, position, mime, data) VALUES (?,?,?,?)').run(v.id, n, mime, buf)
  res.status(201).json({ id: Number(lastInsertRowid) })
})

function send(res, row) {
  if (!row) return res.status(404).end()
  res.set({ 'Content-Type': row.mime, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=86400' })
  res.send(Buffer.from(row.data))
}

// Public: only photos of approved vendors.
router.get('/photos/:id', (req, res) => send(res, db.prepare(`SELECT p.mime, p.data FROM vendor_photos p JOIN vendors v ON v.id=p.vendor_id WHERE p.id=? AND v.status='approved'`).get(req.params.id)))

// Admin: any photo, so pending applications can be reviewed.
router.get('/admin/photos/:id', requireAdmin, (req, res) => {
  const row = db.prepare('SELECT mime, data FROM vendor_photos WHERE id=?').get(req.params.id)
  if (row) res.set('Cache-Control', 'private, no-store')
  send(res, row) 
})
