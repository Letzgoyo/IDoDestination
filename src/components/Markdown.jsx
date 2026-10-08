import { Fragment } from 'react'
import { Link } from 'react-router-dom'

// Tiny Markdown renderer for our own legal documents. Builds React elements (no innerHTML),
// supports: # ## ### headings, paragraphs, - lists, tables, **bold**, *italic*, [links](url) and [[placeholders]].
const INLINE = /(\[\[[^\]]+\]\]|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g

function inline(text) {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith('[[')) return <mark key={i} className="placeholder">{part.slice(2, -2)}</mark>
    if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) {
      const [, label, href] = link
      if (href.startsWith('/')) return <Link key={i} to={href}>{label}</Link>
      if (/^(https?:|mailto:)/.test(href)) return <a key={i} href={href} target="_blank" rel="noreferrer noopener">{label}</a>
      return label
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

export default function Markdown({ source }) {
  const lines = source.replace(/\r/g, '').split('\n')
  const out = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim() || line.trim() === '---') { i++; continue }
    const h = line.match(/^(#{1,3}) (.*)$/)
    if (h) { const Tag = `h${h[1].length}`; out.push(<Tag key={i}>{inline(h[2])}</Tag>); i++; continue }
    if (line.startsWith('- ')) {
      const items = []
      while (i < lines.length && lines[i].startsWith('- ')) items.push(lines[i++].slice(2))
      out.push(<ul key={i}>{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ul>)
      continue
    }
    if (line.startsWith('|')) {
      const rows = []
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++])
      const cells = (r) => r.split('|').slice(1, -1).map((c) => c.trim())
      const [head, , ...body] = rows
      out.push(
        <table key={i} className="table"><thead><tr>{cells(head).map((c, j) => <th key={j}>{inline(c)}</th>)}</tr></thead>
          <tbody>{body.map((r, j) => <tr key={j}>{cells(r).map((c, k) => <td key={k}>{inline(c)}</td>)}</tr>)}</tbody></table>,
      )
      continue
    }
    const para = []
    while (i < lines.length && lines[i].trim() && !/^(#{1,3} |- |\||---)/.test(lines[i])) para.push(lines[i++])
    out.push(<p key={i}>{inline(para.join(' '))}</p>)
  }
  return <>{out}</>
}
