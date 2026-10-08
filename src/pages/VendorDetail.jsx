import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, aud, photoUrl } from '../api.js'
import { usePageMeta } from '../usePageMeta.js'
import VendorMap from '../components/VendorMap.jsx'

const TYPE = { trial: 'Trial', package: 'Package', deposit: 'Deposit' }

function BookingForm({ service, onClose }) {
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', wedding_date: '', guest_count: '', message: '' })
  const [state, setState] = useState({ busy: false, error: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setState({ busy: true, error: '' })
    try {
      const r = await api.book({ ...f, service_id: service.id })
      if (r.checkout_url) window.location.href = r.checkout_url
      else nav(`/booking/${r.token}`)
    } catch (err) {
      setState({ busy: false, error: err.message })
    }
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <div className="row between"><h3>{service.online ? 'Book' : 'Request'}</h3><button type="button" className="link" onClick={onClose}>Change</button></div>
      <p className="selected"><strong>{service.name}</strong><br />{aud(service.price_aud)} AUD</p>
      <label>Your name<input required value={f.name} onChange={set('name')} /></label>
      <label>Email<input required type="email" value={f.email} onChange={set('email')} /></label>
      <div className="two">
        <label>Wedding date<input type="date" value={f.wedding_date} onChange={set('wedding_date')} /></label>
        <label>Guests<input type="number" min="0" value={f.guest_count} onChange={set('guest_count')} /></label>
      </div>
      <label>Message <small>(optional)</small><textarea rows="4" value={f.message} onChange={set('message')} /></label>
      {state.error && <p className="error">{state.error}</p>}
      <button className="btn" disabled={state.busy}>{state.busy ? 'Please wait…' : service.online ? 'Continue to payment' : 'Send request'}</button>
      <small className="muted">{service.online ? 'You pay securely in AUD. ' : 'No payment now. The vendor confirms, then you pay in AUD. '}<Link to="/cancellation-policy">Cancellation policy</Link>. By continuing you agree to our <Link to="/terms">terms</Link> and <Link to="/privacy">privacy policy</Link>.</small>
    </form>
  )
}

function QuestionForm({ vendor }) {
  const [f, setF] = useState({ name: '', email: '', message: '' })
  const [state, setState] = useState({ busy: false, done: false, error: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  async function submit(e) {
    e.preventDefault()
    setState({ busy: true, done: false, error: '' })
    try { await api.enquire(vendor.slug, f); setState({ busy: false, done: true, error: '' }) }
    catch (err) { setState({ busy: false, done: false, error: err.message }) }
  }
  if (state.done) return <div className="panel"><h3>Message sent</h3><p>{vendor.business_name} will reply by email.</p></div>
  return (
    <form className="panel form" onSubmit={submit}>
      <h3>Ask a question</h3>
      <label>Your name<input required value={f.name} onChange={set('name')} /></label>
      <label>Email<input required type="email" value={f.email} onChange={set('email')} /></label>
      <label>Message<textarea required rows="4" value={f.message} onChange={set('message')} /></label>
      {state.error && <p className="error">{state.error}</p>}
      <button className="btn ghost" disabled={state.busy}>{state.busy ? 'Sending…' : 'Send message'}</button>
    </form>
  )
}

export default function VendorDetail() {
  const { slug } = useParams()
  const [v, setV] = useState(null)
  const [error, setError] = useState('')
  const [service, setService] = useState(null)
  const [ask, setAsk] = useState(false)

  useEffect(() => { api.vendor(slug).then(setV).catch((e) => setError(e.message)) }, [slug])

  usePageMeta(v ? `${v.business_name} | ${v.category} in ${v.destination}` : 'Vendor', v?.bio?.slice(0, 155))
  if (error) return <div className="wrap section"><h1>Vendor not found</h1><Link className="btn" to="/vendors">Browse vendors</Link></div>
  if (!v) return <div className="wrap section"><p className="muted">Loading…</p></div>
  return (
    <div className="wrap section detail">
      <div>
        <Link to="/vendors" className="muted">← All vendors</Link>
        <p className="eyebrow">{v.category}</p>
        <h1>{v.business_name}</h1>
        <p className="muted">{v.destination}{v.based_in_australia ? ' · Australian-based' : ''}</p>
        {v.photos?.length > 0 && (
          <div className={`gallery g${Math.min(v.photos.length, 4)}`}>
            {v.photos.slice(0, 5).map((id, i) => <img key={id} src={photoUrl(id)} alt={`${v.business_name} photo ${i + 1}`} loading={i ? 'lazy' : 'eager'} />)}
          </div>
        )}
        <p className="lead pre">{v.bio}</p>
        <p>
          {v.instagram && <a href={`https://instagram.com/${v.instagram.replace(/^@/, '')}`} target="_blank" rel="noreferrer noopener">Instagram</a>}
          {v.instagram && v.website && ' · '}
          {v.website && <a href={v.website} target="_blank" rel="noreferrer noopener">Website</a>}
        </p>
        <h2 className="h-sm">Services <small className="muted">all prices in AUD</small></h2>
        <ul className="services">
          {v.services.map((s) => (
            <li key={s.id} className={service?.id === s.id ? 'on' : ''}>
              <div>
                <span className="tag">{TYPE[s.type]}</span>
                <h3>{s.name}</h3>
                {s.description && <p className="muted">{s.description}</p>}
              </div>
              <div className="svc-right">
                <strong>{aud(s.price_aud)}</strong>
                <button className="btn" onClick={() => { setService(s); setAsk(false) }}>{s.online ? 'Book now' : 'Request'}</button>
              </div>
            </li>
          ))}
        </ul>
        <VendorMap vendors={[v]} height={260} zoom={7} />
      </div>
      <div className="side">
        {service && !ask
          ? <BookingForm service={service} onClose={() => setService(null)} />
          : ask
            ? <QuestionForm vendor={v} />
            : <div className="panel"><h3>Book this vendor</h3><p className="muted">Choose a service to book or request. Prices and payment are in AUD.</p></div>}
        <button className="link" onClick={() => setAsk(!ask)}>{ask ? 'Back to booking' : 'Have a question first?'}</button>
      </div>
    </div>
  )
}
