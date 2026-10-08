import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import { usePageMeta } from '../usePageMeta.js'
import VendorCard from '../components/VendorCard.jsx'

// Loaded on demand: the country shapes are a large file the rest of the site doesn't need.
const RegionMap = lazy(() => import('../components/RegionMap.jsx'))

export default function Vendors() {
  usePageMeta('Find wedding vendors overseas', 'Browse approved wedding vendors by destination and category, with every price in AUD.')
  const [vendors, setVendors] = useState(null)
  const [meta, setMeta] = useState(null)
  const [error, setError] = useState('')
  const [params] = useSearchParams()
  const [category, setCategory] = useState(params.get('category') || '')
  const [destination, setDestination] = useState(params.get('destination') || '')
  const [trialOnly, setTrialOnly] = useState(false)
  const [q, setQ] = useState('')

  useEffect(() => {
    Promise.all([api.vendors(), api.meta()]).then(([v, m]) => { setVendors(v); setMeta(m) }).catch((e) => setError(e.message))
  }, [])

  const matching = useMemo(() => (vendors || []).filter((v) =>
    (!category || v.category === category) &&
    (!trialOnly || v.offers_trial) &&
    (!q || `${v.business_name} ${v.bio}`.toLowerCase().includes(q.toLowerCase()))), [vendors, category, trialOnly, q])
  const counts = useMemo(() => matching.reduce((acc, v) => ({ ...acc, [v.destination]: (acc[v.destination] || 0) + 1 }), {}), [matching])
  const filtered = useMemo(() => matching.filter((v) => !destination || v.destination === destination), [matching, destination])
  const withVendors = (meta?.destinations || []).filter((d) => counts[d.name])

  return (
    <div className="wrap section">
      <p className="eyebrow">Directory</p>
      <h1>Find your wedding vendors</h1>
      <p className="lead">Every vendor is checked by our team, and every price is in Australian dollars.</p>
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
          <p className="muted map-hint">{withVendors.length ? 'Select a shaded country on the map to see its vendors.' : 'No vendors match these filters yet.'}</p>
          <Suspense fallback={<div className="map" style={{ height: 520 }} />}>
            <RegionMap destinations={meta?.destinations || []} counts={counts} selected={destination} onSelect={setDestination} />
          </Suspense>
          <div className="chips country-chips" role="group" aria-label="Browse by country">
            {withVendors.map((d) => (
              <button key={d.name} className={`chip${destination === d.name ? ' on' : ''}`} aria-pressed={destination === d.name} onClick={() => setDestination(destination === d.name ? '' : d.name)}>
                {d.name} <span className="chip-n">{counts[d.name]}</span>
              </button>
            ))}
            {destination && <button className="chip clear" onClick={() => setDestination('')}>Clear ×</button>}
          </div>
          <p className="muted count">{filtered.length} vendor{filtered.length === 1 ? '' : 's'}</p>
          {filtered.length === 0
            ? <p>No vendors match yet. Try widening your filters.</p>
            : <div className="grid3">{filtered.map((v) => <VendorCard key={v.id} v={v} />)}</div>}
        </>
      )}
    </div>
  )
}
