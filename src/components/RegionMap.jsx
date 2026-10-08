import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { feature } from 'topojson-client'
import atlas from 'world-atlas/countries-50m.json'
import { api } from '../api.js'

// Our destination names -> the country names used in the world-atlas data.
const ATLAS_NAME = { 'United States': 'United States of America', 'Cook Islands': 'Cook Is.' }
const GOLD = '#b8923f'
const INK = '#1c1917'

const countries = feature(atlas, atlas.objects.countries).features
const shapeFor = (name) => countries.find((f) => f.properties.name === (ATLAS_NAME[name] || name))

// A map of clickable country regions. Countries with vendors are shaded and clickable; the rest stay plain.
export default function RegionMap({ destinations, counts, selected, onSelect, height = 520 }) {
  const el = useRef(null)
  const map = useRef(null)
  const layer = useRef(null)
  const onSelectRef = useRef(onSelect)
  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])

  useEffect(() => {
    map.current = L.map(el.current, { scrollWheelZoom: false, worldCopyJump: true, minZoom: 2 }).setView([22, 60], 2)
    layer.current = L.layerGroup().addTo(map.current)
    let cancelled = false
    api.meta().then(({ map: m }) => {
      if (!cancelled) L.tileLayer(m.tiles, { attribution: m.attribution, maxZoom: 18 }).addTo(map.current)
    })
    return () => { cancelled = true; map.current.remove() }
  }, [])

  useEffect(() => {
    layer.current.clearLayers()
    for (const d of destinations) {
      const n = counts[d.name] || 0
      const shape = shapeFor(d.name)
      const label = `${d.name} · ${n} vendor${n === 1 ? '' : 's'}`
      const isSel = selected === d.name
      // Island nations use the pin below: Fiji's outline crosses the date line (which draws a stray line) and the rest are specks.
      if (shape && !d.island) {
        const style = n
          ? { color: isSel ? INK : GOLD, weight: isSel ? 2.5 : 1.5, fillColor: GOLD, fillOpacity: isSel ? 0.62 : 0.34 }
          : { color: '#8a8178', weight: 0.8, fillColor: '#8a8178', fillOpacity: 0.04 }
        const geo = L.geoJSON(shape, { style, interactive: n > 0 }).addTo(layer.current)
        if (n) {
          geo.bindTooltip(label, { sticky: true })
          geo.on({
            click: () => onSelectRef.current(isSel ? '' : d.name),
            mouseover: (e) => !isSel && e.target.setStyle({ fillOpacity: 0.55 }),
            mouseout: (e) => !isSel && e.target.setStyle({ fillOpacity: 0.34 }),
          })
        }
      }
      // Tiny island nations are hard to click as shapes, so they also get a count pin.
      if (n && d.island) {
        const icon = L.divIcon({ className: '', html: `<span class="pin${isSel ? ' sel' : ''}">${n}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] })
        L.marker([d.lat, d.lng], { icon, title: label, keyboard: false })
          .on('click', () => onSelectRef.current(isSel ? '' : d.name))
          .bindTooltip(label)
          .addTo(layer.current)
      }
    }
  }, [destinations, counts, selected])

  useEffect(() => {
    const d = destinations.find((x) => x.name === selected)
    if (d) map.current.flyTo([d.lat, d.lng], d.zoom || 5, { duration: 0.8 })
    else map.current.flyTo([22, 60], 2, { duration: 0.8 })
  }, [selected, destinations])

  return <div ref={el} className="map" style={{ height }} role="region" aria-label="Map of wedding destinations. Select a shaded country to see its vendors." />
}
