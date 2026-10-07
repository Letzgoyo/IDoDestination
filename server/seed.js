// Demo data for local development only. All vendors are fictional.
import { db } from './db.js'
import { DESTINATIONS } from './destinations.js'

const demo = [
  ['Demo Glow Makeup', 'Hair & Makeup', 'Bali', 'Australian-based bridal makeup artist travelling to Bali. Trials in Australia before you fly, all priced in AUD.', 900, 1, 180, 1],
  ['Demo Villa Weddings', 'Venue', 'Santorini', 'Cliff-top ceremony spaces with caldera views, quoted in AUD with no currency surprises.', 6500, 0, null, 0],
  ['Demo Tuscan Lens', 'Photography', 'Tuscany', 'Documentary-style wedding photography across Tuscany. Aussie-friendly payment plans.', 3800, 0, null, 1],
  ['Demo Fiji Florals', 'Florist', 'Fiji', 'Tropical, locally grown florals for beach and resort weddings.', 1200, 0, null, 0],
  ['Demo Island Celebrant', 'Celebrant', 'Phuket', 'Legally recognised and symbolic ceremonies with Australian-standard paperwork support.', 700, 0, null, 0],
]
const ins = db.prepare(`INSERT OR IGNORE INTO vendors (slug,status,business_name,contact_name,email,category,destination,country,lat,lng,bio,price_from_aud,offers_trial,trial_price_aud,based_in_australia)
  VALUES (?,'approved',?,?,?,?,?,?,?,?,?,?,?,?,?)`)
for (const [name, cat, dest, bio, price, trial, trialPrice, au] of demo) {
  const d = DESTINATIONS.find((x) => x.name === dest)
  ins.run(name.toLowerCase().replace(/\W+/g, '-'), name, 'Demo Owner', 'demo@example.com', cat, d.name, d.country, d.lat, d.lng, bio, price, trial, trialPrice, au)
}
console.log('Seeded demo vendors')
