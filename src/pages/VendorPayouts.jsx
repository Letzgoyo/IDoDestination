import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api.js'
import { usePageMeta } from '../usePageMeta.js'

export default function VendorPayouts() {
  usePageMeta('Vendor payouts', '', { noindex: true })
  const { mtoken } = useParams()
  const [d, setD] = useState(null)
  const [country, setCountry] = useState('AU')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { api.manage(mtoken).then(setD).catch((e) => setError(e.message)) }, [mtoken])

  async function start() {
    setBusy(true)
    try { window.location.href = (await api.onboard(mtoken, country)).url } catch (e) { setError(e.message); setBusy(false) }
  }

  if (error && !d) return <div className="wrap section narrow"><h1>Link not found</h1></div>
  if (!d) return <div className="wrap section"><p className="muted">Loading…</p></div>
  return (
    <div className="wrap section narrow">
      <p className="eyebrow">Vendor payouts</p>
      <h1>{d.business_name}</h1>
      <div className="panel">
        {!d.payments_available && <p>Online payments aren't switched on yet. We'll email you when they are.</p>}
        {d.payments_available && d.ready && <><span className="tag">Connected</span><p>Your payouts are set up. Couples can now book your online services and pay in AUD, and your share (price minus our platform fee) is paid out to your bank account by Stripe.</p></>}
        {d.payments_available && !d.ready && (
          <>
            <p>Connect your bank account with Stripe to take online bookings. Couples pay in AUD and Stripe pays you out in your local currency.</p>
            {d.has_account && <p className="muted">Onboarding isn't finished yet. Continue where you left off.</p>}
            {!d.has_account && (
              <label className="form">Country of your bank account
                <select value={country} onChange={(e) => setCountry(e.target.value)}>
                  {Object.entries(d.countries).map(([c, n]) => <option key={c} value={c}>{n}</option>)}
                </select>
              </label>
            )}
            <p><button className="btn" onClick={start} disabled={busy}>{busy ? 'Redirecting…' : d.has_account ? 'Continue setup' : 'Set up payouts'}</button></p>
          </>
        )}
        {error && <p className="error">{error}</p>}
      </div>
      <p className="muted">Keep this link private. It is how you manage your payouts.</p>
    </div>
  )
}
