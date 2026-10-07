import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, aud } from '../api.js'
import VendorMap from '../components/VendorMap.jsx'

function EnquiryForm({ vendor }) {
  const [f, setF] = useState({ name: '', email: '', wedding_date: '', guest_count: '', wants_trial: false, message: '' })
  const [state, setState] = useState({ busy: false, done: false, error: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  async function submit(e) {
    e.preventDefault()
    setState({ busy: true, done: false, error: '' })
    try {
      await api.enquire(vendor.slug, f)
      setState({ busy: false, done: true, error: '' })
    } catch (err) {
      setState({ busy: false, done: false, error: err.message })
    }
  }

  if (state.done) return <div className="panel"><h3>Enquiry sent</h3><p>{vendor.business_name} will reply to you by email, quoting in AUD.</p></div>
  return (
    <form className="panel form" onSubmit={submit}>
      <h3>Enquire</h3>
      <label>Your name<input required value={f.name} onChange={set('name')} /></label>
      <label>Email<input required type="email" value={f.email} onChange={set('email')} /></label>
      <div className="two">
        <label>Wedding date<input type="date" value={f.wedding_date} onChange={set('wedding_date')} /></label>
        <label>Guests<input type="number" min="0" value={f.guest_count} onChange={set('guest_count')} /></label>
      </div>
      {vendor.offers_trial ? <label className="check"><input type="checkbox" checked={f.wants_trial} onChange={set('wants_trial')} /> I'd like a trial</label> : null}
      <label>Message<textarea required rows="5" value={f.message} onChange={set('message')} /></label>
      {state.error && <p className="error">{state.error}</p>}
      <button className="btn" disabled={state.busy}>{state.busy ? 'Sending…' : 'Send enquiry'}</button>
    </form>
  )
}

export default function VendorDetail() {
  const { slug } = useParams()
  const [v, setV] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { api.vendor(slug).then(setV).catch((e) => setError(e.message)) }, [slug])

  if (error) return <div className="wrap section"><h1>Vendor not found</h1><Link className="btn" to="/vendors">Browse vendors</Link></div>
  if (!v) return <div className="wrap section"><p className="muted">Loading…</p></div>
  return (
    <div className="wrap section detail">
      <div>
        <Link to="/vendors" className="muted">← All vendors</Link>
        <p className="eyebrow">{v.category}</p>
        <h1>{v.business_name}</h1>
        <p className="muted">{v.destination}, {v.country}{v.based_in_australia ? ' · Australian-based' : ''}</p>
        <p className="lead pre">{v.bio}</p>
        <dl className="facts">
          <div><dt>Starting from</dt><dd>{v.price_from_aud ? `${aud(v.price_from_aud)} AUD` : 'On request'}</dd></div>
          <div><dt>Trial</dt><dd>{v.offers_trial ? (v.trial_price_aud ? `${aud(v.trial_price_aud)} AUD` : 'Available') : 'Not offered'}</dd></div>
          <div><dt>Currency</dt><dd>AUD</dd></div>
        </dl>
        <p>
          {v.instagram && <a href={`https://instagram.com/${v.instagram.replace(/^@/, '')}`} target="_blank" rel="noreferrer noopener">Instagram</a>}
          {v.instagram && v.website && ' · '}
          {v.website && <a href={v.website} target="_blank" rel="noreferrer noopener">Website</a>}
        </p>
        <VendorMap vendors={[v]} height={260} zoom={7} />
      </div>
      <EnquiryForm vendor={v} />
    </div>
  )
}
