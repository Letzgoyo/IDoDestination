import { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import VendorMap from '../components/VendorMap.jsx'
import VendorCard from '../components/VendorCard.jsx'

export default function Vendors() {
  const [vendors, setVendors] = useState(null)
  const [meta, setMeta] = useState(null)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('')
  const [destination, setDestination] = useState('')
  const [trialOnly, setTrialOnly] = useState(false)
  const [q, setQ] = useState('')

  useEffect(() => {
    Promise.all([api.vendors(), api.meta()]).then(([v, m]) => { setVendors(v); setMeta(m) }).catch((e) => setError(e.message))
  }, [])

  const filtered = useMemo(() => (vendors || []).filter((v) =>
    (!category || v.category === category) &&
    (!destination || v.destination === destination) &&
    (!trialOnly || v.offers_trial) &&
    (!q || `${v.business_name} ${v.bio}`.toLowerCase().includes(q.toLowerCase()))), [vendors, category, destination, trialOnly, q])

  return (
    <div className="wrap section">
      <p className="eyebrow">Directory</p>
      <h1>Find your vendors</h1>
      <div className="filters">
        <input placeholder="Search vendors" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {meta?.categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={destination} onChange={(e) => setDestination(e.target.value)} aria-label="Destination">
          <option value="">All destinations</option>
          {meta?.destinations.map((d) => <option key={d.name}>{d.name}</option>)}
        </select>
        <label className="check"><input type="checkbox" checked={trialOnly} onChange={(e) => setTrialOnly(e.target.checked)} /> Trials available</label>
      </div>
      {error && <p className="error">{error}</p>}
      {!vendors && !error && <p className="muted">Loading…</p>}
      {vendors && (
        <>
          <VendorMap vendors={filtered} onSelect={setDestination} />
          <p className="muted count">{filtered.length} vendor{filtered.length === 1 ? '' : 's'}</p>
          {filtered.length === 0
            ? <p>No vendors match yet. Try widening your filters.</p>
            : <div className="grid3">{filtered.map((v) => <VendorCard key={v.id} v={v} />)}</div>}
        </>
      )}
    </div>
  )
}
