import { useEffect, useRef } from 'react'
import L from 'leaflet'

export default function VendorMap({ vendors, onSelect, height = 520, zoom }) {
  const el = useRef(null)
  const map = useRef(null)
  const layer = useRef(null)

  useEffect(() => {
    map.current = L.map(el.current, { scrollWheelZoom: false, worldCopyJump: true }).setView([15, 100], 2)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 18,
    }).addTo(map.current)
    layer.current = L.layerGroup().addTo(map.current)
    return () => map.current.remove()
  }, [])

  useEffect(() => {
    layer.current.clearLayers()
    // Group vendors sharing a destination so pins don't stack invisibly.
    const groups = Map.groupBy(vendors, (v) => v.destination)
    const points = []
    for (const [dest, list] of groups) {
      const { lat, lng } = list[0]
      points.push([lat, lng])
      const icon = L.divIcon({
        className: '',
        html: `<span class="pin">${list.length}</span>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      })
      const m = L.marker([lat, lng], { icon, title: dest }).addTo(layer.current)
      m.on('click', () => onSelect?.(dest))
      m.bindTooltip(`${dest} · ${list.length} vendor${list.length > 1 ? 's' : ''}`)
    }
    if (zoom && points.length === 1) map.current.setView(points[0], zoom)
    else if (points.length) map.current.fitBounds(points, { padding: [60, 60], maxZoom: 6 })
  }, [vendors, onSelect, zoom])

  return <div ref={el} className="map" style={{ height }} role="region" aria-label="Vendor map" />
}
