import terms from '../../docs/legal/terms-of-service.md?raw'
import privacy from '../../docs/legal/privacy-policy.md?raw'
import vendorTerms from '../../docs/legal/vendor-terms.md?raw'
import Markdown from '../components/Markdown.jsx'
import { usePageMeta } from '../usePageMeta.js'
import { LEGAL_DRAFT } from '../legal/config.js'

const DOCS = {
  terms: { source: terms, title: 'Terms of service', description: 'The terms for using I Do Destination.' },
  privacy: { source: privacy, title: 'Privacy policy', description: 'How I Do Destination collects, uses and protects your personal information.' },
  vendorTerms: { source: vendorTerms, title: 'Vendor terms', description: 'The terms for wedding vendors listed on I Do Destination.' },
}

export default function Legal({ doc }) {
  const d = DOCS[doc]
  usePageMeta(d.title, d.description)
  return (
    <div className="wrap section narrow legal">
      {LEGAL_DRAFT && <p className="draft-note">Draft: this document has not yet been reviewed by a lawyer and is not final.</p>}
      <Markdown source={d.source} />
    </div>
  )
}
