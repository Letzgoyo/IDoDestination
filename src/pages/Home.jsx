import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

// Decorative wedding-arch illustration (no photos needed).
const LEAVES = [0, 1, 2, 3, 4, 5, 6]
function Sprig({ x, y, rot = 0, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`} className="sprig">
      <path d="M0 0 C 12 -60 -12 -130 6 -190" fill="none" />
      {LEAVES.map((i) => (
        <ellipse key={i} cx={i % 2 ? 15 : -15} cy={-22 - i * 26} rx="15" ry="6" transform={`rotate(${i % 2 ? -50 : 50} ${i % 2 ? 15 : -15} ${-22 - i * 26})`} />
      ))}
    </g>
  )
}

function ArchArt() {
  return (
    <svg className="arch-art" viewBox="0 0 440 540" aria-hidden="true">
      <defs>
        <linearGradient id="archfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff4ea" /><stop offset="1" stopColor="#f7dcd0" /></linearGradient>
        <clipPath id="archclip"><path d="M20 520 V220 C20 100 110 20 220 20 C330 20 420 100 420 220 V520 Z" /></clipPath>
      </defs>
      <path d="M44 520 V230 C44 120 126 46 232 46 C338 46 416 120 416 230 V520" className="arch-outline" />
      <g clipPath="url(#archclip)">
        <rect width="440" height="540" fill="url(#archfill)" />
        <circle cx="300" cy="160" r="70" className="sun" />
        <Sprig x="70" y="540" rot="-8" scale="1.25" />
        <Sprig x="360" y="540" rot="10" scale="1.1" />
        <Sprig x="215" y="540" rot="2" scale=".7" />
      </g>
      <path d="M20 520 V220 C20 100 110 20 220 20 C330 20 420 100 420 220 V520" className="arch-edge" />
      <path d="M20 520 H420" className="arch-edge" />
      <g className="rings" transform="translate(220 360)">
        <circle cx="-30" cy="0" r="44" /><circle cx="30" cy="0" r="44" />
        <path d="M30 -44 l-10 -16 l10 -14 l10 14 z" className="gem" />
      </g>
    </svg>
  )
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
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">For Australians marrying overseas</p>
            <h1>Find the vendors for your <em>destination wedding</em>.</h1>
            <p className="lead">Hand-picked makeup artists, photographers, venues and more across the world's favourite wedding destinations, with prices in AUD and trials before you fly.</p>
            <div className="row">
              <Link className="btn" to="/vendors">Find vendors</Link>
              <a className="btn ghost" href="#destinations">Browse destinations</a>
            </div>
            <div className="quick">
              {['Hair & Makeup', 'Photography', 'Venue'].map((c) => (
                <Link key={c} to={`/vendors?category=${encodeURIComponent(c)}`} className="chip">{c}</Link>
              ))}
            </div>
            <ul className="proof">
              <li><strong>Every vendor</strong> checked by us</li>
              <li><strong>Every price</strong> in AUD</li>
              <li><strong>Trials</strong> before you travel</li>
            </ul>
          </div>
          <div className="hero-art"><ArchArt /></div>
        </div>
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
