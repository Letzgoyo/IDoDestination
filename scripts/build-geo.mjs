// Regenerates src/data/destinations.geo.json: country outlines for the destinations in server/destinations.js.
// One-off tool, not part of the app build. Run:  npm i --no-save world-atlas topojson-client && node scripts/build-geo.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { feature } from 'topojson-client'
import { DESTINATIONS } from '../server/destinations.js'

const atlas = JSON.parse(readFileSync('node_modules/world-atlas/countries-50m.json', 'utf8'))
const ATLAS_NAME = { 'United States': 'United States of America', 'Cook Islands': 'Cook Is.' }
// Keep only the parts of a country near where couples marry (drops overseas territories like French Guiana).
// Windows are [minLng, minLat, maxLng, maxLat]. Default: around the destination's map point.
const WINDOWS = {
  France: [[-6, 41, 10, 52]],
  Spain: [[-10, 35, 5, 44.5]],
  Portugal: [[-10, 36, -6, 43]],
  'United States': [[-125, 24, -66, 50], [-161, 18, -154, 23]], // mainland + Hawaii
  Italy: [[6, 36, 19, 47.5]],
  Greece: [[19, 34, 30, 42]],
  'United Kingdom': [[-9, 49, 2, 61]],
  Mexico: [[-118, 14, -86, 33]],
  Japan: [[122, 24, 146, 46]],
  Indonesia: [[94, -11.5, 142, 6]],
  Thailand: [[97, 5, 106, 21]],
}
const all = feature(atlas, atlas.objects.countries).features
const round = (n) => Math.round(n * 1000) / 1000
// A ring that crosses the date line is shifted east so Leaflet draws it as one piece (no stray line across the map).
const fixRing = (ring) => {
  const lngs = ring.map((p) => p[0])
  const wraps = Math.max(...lngs) - Math.min(...lngs) > 180
  return ring.map(([x, y]) => [round(wraps && x < 0 ? x + 360 : x), round(y)])
}
const inWindow = (poly, wins) => {
  const ring = poly[0]
  const cx = ring.reduce((a, p) => a + p[0], 0) / ring.length
  const cy = ring.reduce((a, p) => a + p[1], 0) / ring.length
  return wins.some(([x0, y0, x1, y1]) => cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1)
}

const features = DESTINATIONS.map((d) => {
  const f = all.find((x) => x.properties.name === (ATLAS_NAME[d.name] || d.name))
  if (!f) throw new Error(`No outline for ${d.name}`)
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  const wins = WINDOWS[d.name] || [[d.lng - 45, d.lat - 30, d.lng + 45, d.lat + 30]]
  const kept = polys.filter((p) => inWindow(p, wins) || polys.length === 1).map((p) => p.map(fixRing))
  return { type: 'Feature', properties: { name: d.name }, geometry: { type: 'MultiPolygon', coordinates: kept } }
})
writeFileSync('src/data/destinations.geo.json', JSON.stringify({ type: 'FeatureCollection', features }))
console.log('wrote', features.length, 'countries')
