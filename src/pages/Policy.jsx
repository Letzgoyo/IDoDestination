import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { usePageMeta } from '../usePageMeta.js'

export default function Policy() {
  usePageMeta('Cancellations & refunds', 'How cancellations and refunds work when you book a vendor through I Do Destination.')
  const [p, setP] = useState(null)
  useEffect(() => { api.policy().then(setP) }, [])
  if (!p) return <div className="wrap section"><p className="muted">Loading…</p></div>
  return (
    <div className="wrap section narrow">
      <p className="eyebrow">Policy</p>
      <h1>Cancellations &amp; refunds</h1>
      <ul className="policy">
        <li><strong>{p.cooling_hours}-hour cooling-off.</strong> Cancel within {p.cooling_hours} hours of paying for a full refund (trials excluded).</li>
        <li><strong>{p.full_days}+ days before your wedding:</strong> full refund.</li>
        <li><strong>{p.partial_days}–{p.full_days - 1} days before:</strong> 50% refund.</li>
        <li><strong>Under {p.partial_days} days before:</strong> no refund.</li>
        <li><strong>Trials</strong> are non-refundable once paid, unless the vendor cancels.</li>
        <li><strong>If a vendor cancels,</strong> you always receive a full refund.</li>
      </ul>
      <p className="muted">Unpaid requests can be cancelled at any time at no cost. Refunds go back to your original payment method in AUD and take 5–10 business days.</p>
    </div>
  )
}
