import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, aud } from '../api.js'
import { usePageMeta } from '../usePageMeta.js'

export default function VendorAction() {
  usePageMeta('Booking request', '', { noindex: true })
  const { vtoken } = useParams()
  const [b, setB] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { api.vendorAction(vtoken).then(setB).catch((e) => setError(e.message)) }, [vtoken])

  async function respond(action) {
    try { const r = await api.respond(vtoken, action); setB({ ...b, status: r.status }) } catch (e) { setError(e.message) }
  }

  if (error && !b) return <div className="wrap section narrow"><h1>Link not found</h1></div>
  if (!b) return <div className="wrap section"><p className="muted">Loading…</p></div>
  return (
    <div className="wrap section narrow">
      <p className="eyebrow">Booking request for {b.business_name}</p>
      <h1>{b.service_name}</h1>
      <div className="panel">
        <p><strong>{b.couple_name}</strong> · <a href={`mailto:${b.couple_email}`}>{b.couple_email}</a></p>
        <p>{aud(b.amount_aud)} AUD · Platform fee {aud(b.fee_aud)} · Wedding date {b.wedding_date || 'not set'} · Guests {b.guest_count ?? 'not set'}</p>
        {b.message && <p className="pre">{b.message}</p>}
        <p><span className="tag">{b.status}</span></p>
        {b.status === 'requested' && <div className="row"><button className="btn" onClick={() => respond('accept')}>Accept</button><button className="btn ghost" onClick={() => respond('decline')}>Decline</button></div>}
        {['accepted', 'paid'].includes(b.status) && <p><button className="btn ghost" onClick={() => window.confirm('Cancel this booking? The couple will be refunded in full.') && respond('cancel')}>Cancel booking (full refund)</button></p>}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  )
}
