import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, aud } from '../api.js'

const MSG = {
  requested: 'Your request has been sent. The vendor will confirm shortly and we will email you.',
  accepted: 'The vendor accepted your request.',
  declined: 'Sorry, the vendor is unable to take this request.',
  paid: 'Payment received. The vendor will be in touch to finalise details.',
}

export default function Booking() {
  const { token } = useParams()
  const [b, setB] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { api.booking(token).then(setB).catch((e) => setError(e.message)) }, [token])

  async function pay() {
    setBusy(true)
    try { window.location.href = (await api.pay(token)).checkout_url } catch (e) { setError(e.message); setBusy(false) }
  }

  if (error && !b) return <div className="wrap section narrow"><h1>Booking not found</h1><Link className="btn" to="/vendors">Browse vendors</Link></div>
  if (!b) return <div className="wrap section"><p className="muted">Loading…</p></div>
  return (
    <div className="wrap section narrow">
      <p className="eyebrow">Your booking</p>
      <h1>{b.business_name}</h1>
      <div className="panel">
        <p><strong>{b.service_name}</strong><br />{aud(b.amount_aud)} AUD{b.wedding_date && <> · Wedding date {b.wedding_date}</>}</p>
        <p><span className="tag">{b.status}</span></p>
        <p>{MSG[b.status]}</p>
        {b.payment_available && <button className="btn" onClick={pay} disabled={busy}>{busy ? 'Redirecting…' : `Pay ${aud(b.amount_aud)} AUD`}</button>}
        {error && <p className="error">{error}</p>}
      </div>
      <p><Link to={`/vendors/${b.vendor_slug}`}>View vendor</Link> · Keep this page's link to return to your booking.</p>
    </div>
  )
}
