import { readFileSync, existsSync } from 'node:fs'
import { db } from './db.js'

const SITE_URL = (process.env.SITE_URL || 'http://localhost:5173').replace(/\/$/, '')
const NAME = 'I Do Destination'
const DEFAULT_DESC = 'Hand-picked wedding vendors for Australians marrying overseas. Makeup artists, photographers, venues and more, with prices in AUD and trials before you fly.'
const DEFAULT_IMAGE = `${SITE_URL}/images/hero.webp`

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trim()}…` : s)
// JSON-LD lives inside a <script>; escaping "<" stops a vendor-supplied string from closing the tag.
const jsonLd = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c')

const PRIVATE = [/^\/admin/, /^\/booking\//, /^\/vendor\//, /^\/vendor-action\//]

const STATIC = {
  '/': { title: `${NAME} | Wedding vendors for Australians marrying overseas`, desc: DEFAULT_DESC },
  '/vendors': { title: `Find wedding vendors overseas | ${NAME}`, desc: 'Browse approved wedding vendors by destination and category. Every price in AUD, with trials before you travel.' },
  '/apply': { title: `Apply to be listed | ${NAME}`, desc: 'Wedding professionals: apply to be listed and reach Australian couples planning a wedding overseas.' },
  '/cancellation-policy': { title: `Cancellations & refunds | ${NAME}`, desc: 'How cancellations and refunds work when you book a vendor through I Do Destination.' },
  '/terms': { title: `Terms of service | ${NAME}`, desc: 'The terms for using I Do Destination.' },
  '/privacy': { title: `Privacy policy | ${NAME}`, desc: 'How I Do Destination collects, uses and protects your personal information.' },
  '/vendor-terms': { title: `Vendor terms | ${NAME}`, desc: 'The terms for wedding vendors listed on I Do Destination.' },
}

export function metaFor(path) {
  const noindex = PRIVATE.some((r) => r.test(path))
  const m = path.match(/^\/vendors\/([^/]+)$/)
  if (m) {
    const v = db.prepare(`SELECT id, slug, business_name, category, destination, country, bio, website,
      (SELECT id FROM vendor_photos WHERE vendor_id=vendors.id ORDER BY position LIMIT 1) AS photo FROM vendors WHERE status='approved' AND slug=?`).get(m[1])
    if (v) {
      const url = `${SITE_URL}/vendors/${v.slug}`
      const image = v.photo ? `${SITE_URL}/api/photos/${v.photo}` : DEFAULT_IMAGE
      const desc = clip(`${v.category} for weddings in ${v.destination}. ${v.bio}`.replace(/\s+/g, ' '), 158)
      return {
        title: `${v.business_name} | ${v.category} in ${v.destination} | ${NAME}`, desc, image, url, type: 'article',
        ld: { '@context': 'https://schema.org', '@type': 'LocalBusiness', name: v.business_name, description: clip(v.bio, 400), url, image,
          areaServed: v.destination, ...(v.website ? { sameAs: [v.website] } : {}) },
      }
    }
    return { title: `Vendor not found | ${NAME}`, desc: DEFAULT_DESC, noindex: true, status: 404 }
  }
  const s = STATIC[path] || (noindex ? { title: NAME, desc: DEFAULT_DESC } : null)
  if (!s) return { title: `Page not found | ${NAME}`, desc: DEFAULT_DESC, noindex: true, status: 404 }
  return {
    ...s, image: DEFAULT_IMAGE, url: SITE_URL + path, noindex,
    ld: path === '/' ? { '@context': 'https://schema.org', '@type': 'WebSite', name: NAME, url: SITE_URL, description: DEFAULT_DESC } : undefined,
  }
}

export function renderHtml(template, meta) {
  const tags = [
    meta.noindex ? '<meta name="robots" content="noindex, nofollow" />' : '',
    meta.url && !meta.noindex ? `<link rel="canonical" href="${esc(meta.url)}" />` : '',
    `<meta property="og:site_name" content="${NAME}" />`,
    `<meta property="og:type" content="${meta.type || 'website'}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.desc)}" />`,
    meta.url ? `<meta property="og:url" content="${esc(meta.url)}" />` : '',
    `<meta property="og:image" content="${esc(meta.image || DEFAULT_IMAGE)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    meta.ld ? `<script type="application/ld+json">${jsonLd(meta.ld)}</script>` : '',
  ].filter(Boolean).join('\n    ')
  return template
    .replace(/<title>.*?<\/title>/, `<title>${esc(meta.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(meta.desc)}" />`)
    .replace('</head>', `    ${tags}\n  </head>`)
}

export function seoRoutes(app) {
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nDisallow: /booking/\nDisallow: /vendor/\nDisallow: /vendor-action/\nAllow: /api/photos/\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`)
  })
  app.get('/sitemap.xml', (_req, res) => {
    const urls = ['/', '/vendors', '/apply', '/cancellation-policy', '/terms', '/privacy', '/vendor-terms']
    const vendors = db.prepare(`SELECT slug, COALESCE(reviewed_at, created_at) AS updated FROM vendors WHERE status='approved'`).all()
    const body = [...urls.map((u) => `<url><loc>${SITE_URL}${u}</loc></url>`),
      ...vendors.map((v) => `<url><loc>${SITE_URL}/vendors/${esc(v.slug)}</loc><lastmod>${esc(v.updated.slice(0, 10))}</lastmod></url>`)].join('')
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`)
  })
}

export function pageHandler(indexPath) {
  if (!existsSync(indexPath)) return null
  const template = readFileSync(indexPath, 'utf8')
  return (req, res) => {
    const meta = metaFor(req.path.replace(/\/+$/, '') || '/')
    res.status(meta.status || 200).type('html').send(renderHtml(template, meta))
  }
}
