import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

// Equirectangular projection onto a 1000x500 canvas, with the seam moved to the Atlantic so
// Europe, Asia and the Pacific sit side by side with Australia in the middle.
const project = (lat, lng) => [(((lng + 30 + 360) % 360) / 360) * 1000, ((90 - lat) / 180) * 500]
const HOME = project(-33.87, 151.21) // Sydney

const SPOTS = [
  ['Bali', -8.41, 115.19, 1], ['Fiji', -17.71, 178.07, 1], ['Phuket', 7.88, 98.39, 1], ['Tuscany', 43.77, 11.25, 1],
  ['Santorini', 36.39, 25.46, 1], ['Provence', 43.95, 5.05], ['Mallorca', 39.7, 3.02], ['Maldives', 3.2, 73.22, 1],
  ['Hawaii', 20.8, -156.33, 1], ['Cotswolds', 51.83, -1.84], ['Kyoto', 35.01, 135.77],
].map(([name, lat, lng, label]) => ({ name, label, xy: project(lat, lng) }))

// Curved flight path from Sydney, bowed upward.
function arc([x, y]) {
  const [hx, hy] = HOME
  const mx = (hx + x) / 2
  const lift = Math.min(90, Math.abs(x - hx) * 0.25 + 15)
  return `M${hx} ${hy} Q${mx} ${Math.min(hy, y) - lift} ${x} ${y}`
}

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) { el?.classList.add('in'); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect() } }, { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>
}

const DESTS = [
  ['Bali', 'Indonesia', 'g-bali'], ['Santorini', 'Greece', 'g-santorini'], ['Tuscany', 'Italy', 'g-tuscany'],
  ['Fiji', 'Fiji', 'g-fiji'], ['Phuket', 'Thailand', 'g-phuket'], ['Provence', 'France', 'g-provence'],
  ['Maldives', 'Maldives', 'g-maldives'], ['Lake Como', 'Italy', 'g-como'],
]
const CATS = ['Hair & Makeup', 'Photography', 'Videography', 'Venue', 'Planner & Coordinator', 'Florist', 'Celebrant', 'Catering', 'Music & DJ']

export default function Home() {
  return (
    <>
      <section className="hero2">
        <div className="wrap hero-copy">
          <p className="eyebrow">Wedding vendors for Australians marrying overseas</p>
          <h1>Find your wedding team.<br /><em>Pay in Australian dollars.</em></h1>
          <p className="lead">Hand-picked makeup artists, photographers, venues and more for your wedding abroad. Every price is in AUD, and you can try before you fly.</p>
          <div className="row">
            <Link className="btn" to="/vendors">Find vendors</Link>
            <a className="btn ghost" href="#destinations">Browse destinations</a>
          </div>
          <ul className="proof">
            <li><strong>Every price</strong> in AUD</li>
            <li><strong>Every vendor</strong> checked by us</li>
            <li><strong>Trials</strong> before you travel</li>
          </ul>
        </div>
        <svg className="routes" viewBox="-10 95 740 270" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="currentColor" /></pattern>
            <linearGradient id="trail" x1="0" x2="1"><stop offset="0" stopColor="#b8923f" stopOpacity=".15" /><stop offset="1" stopColor="#b8923f" /></linearGradient>
          </defs>
          <rect x="-10" y="95" width="740" height="270" fill="url(#dots)" className="dotgrid" />
          {SPOTS.map((s, i) => <path key={s.name} d={arc(s.xy)} className="route" style={{ animationDelay: `${i * 0.25}s` }} />)}
          {SPOTS.map((s, i) => (
            <g key={s.name} transform={`translate(${s.xy[0]} ${s.xy[1]})`} className="spot" style={{ animationDelay: `${0.8 + i * 0.25}s` }}>
              <circle r="9" className="halo" /><circle r="3.2" />
              {s.label && <text x="8" y="-8">{s.name}</text>}
            </g>
          ))}
          <g transform={`translate(${HOME[0]} ${HOME[1]})`}><circle r="12" className="halo home" /><circle r="4.5" className="homedot" /><text x="10" y="18" className="homelabel">Australia</text></g>
        </svg>
      </section>

      <section className="section wrap">
        <Reveal>
          <p className="eyebrow">Why couples love it</p>
          <h2 className="display">No more <em>exchange-rate</em> surprises.</h2>
        </Reveal>
        <div className="compare">
          <Reveal className="cmp cmp-bad">
            <h3>Booking overseas on your own</h3>
            <ul>
              <li>Quotes in euros, baht, pounds or US dollars</li>
              <li>Exchange rate moves between deposit and final payment</li>
              <li>Card and conversion fees you don't see coming</li>
              <li>No trial, so you meet your makeup artist on the day itself</li>
            </ul>
          </Reveal>
          <Reveal className="cmp cmp-good" delay={120}>
            <h3>Booking with I Do Destination</h3>
            <ul>
              <li>Every price shown and charged in AUD</li>
              <li>The price you book is the price you pay</li>
              <li>Pay securely online, with refunds in AUD too</li>
              <li>Hair and makeup trials with Australian-based artists before you fly</li>
            </ul>
          </Reveal>
        </div>
      </section>

      <section id="destinations" className="section wrap">
        <Reveal><p className="eyebrow">Destinations</p><h2 className="display">Where are you saying <em>I do</em>?</h2></Reveal>
        <div className="dest-grid">
          {DESTS.map(([name, country, g], i) => (
            <Reveal key={name} delay={i * 60} className="dest-wrap">
              <Link to={`/vendors?destination=${encodeURIComponent(name)}`} className={`dest ${g}`}>
                <span className="dest-country">{country}</span>
                <span className="dest-name">{name}</span>
                <span className="dest-go">View vendors →</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="how" className="how">
        <div className="wrap">
          <Reveal><p className="eyebrow">How it works</p><h2 className="display">From first look to <em>booked</em>, simply.</h2></Reveal>
          <ol className="steps">
            {[
              ['Find', 'Browse approved vendors on the map by destination and category.'],
              ['Book or request', 'Book and pay in AUD straight away, or send a request and the vendor confirms.'],
              ['Try before you fly', 'Do your hair and makeup trial at home with an Australian-based artist.'],
              ['Say I do', 'Your team is locked in and paid in dollars, with a clear cancellation policy.'],
            ].map(([t, d], i) => (
              <Reveal key={t} delay={i * 90}><li><span className="num">{String(i + 1).padStart(2, '0')}</span><h3>{t}</h3><p>{d}</p></li></Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section wrap">
        <Reveal><p className="eyebrow">Browse by service</p><h2 className="display">Everyone you need for <em>the big day</em>.</h2></Reveal>
        <Reveal className="chips" delay={100}>
          {CATS.map((c) => <Link key={c} to={`/vendors?category=${encodeURIComponent(c)}`} className="chip">{c}</Link>)}
        </Reveal>
      </section>

      <section className="band2">
        <div className="wrap band2-in">
          <Reveal>
            <p className="eyebrow">Ready when you are</p>
            <h2 className="display">Start finding your <em>wedding team</em>.</h2>
            <p className="lead">Explore approved vendors on the map, compare prices in AUD, and book with confidence.</p>
            <Link className="btn" to="/vendors">Find vendors</Link>
          </Reveal>
        </div>
      </section>
    </>
  )
}
