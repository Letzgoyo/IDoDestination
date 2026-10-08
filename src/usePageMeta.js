import { useEffect } from 'react'

const NAME = 'I Do Destination'

// Keeps the browser tab title and description in step with the page while navigating.
// (Search engines and link previews get the same values from the server, see server/seo.js.)
export function usePageMeta(title, description, { noindex = false } = {}) {
  useEffect(() => {
    document.title = title ? `${title} | ${NAME}` : NAME
    const set = (selector, create, value) => {
      let el = document.head.querySelector(selector)
      if (!value) { el?.remove(); return }
      if (!el) { el = document.createElement(create.tag); Object.entries(create.attrs).forEach(([k, v]) => el.setAttribute(k, v)); document.head.appendChild(el) }
      el.setAttribute('content', value)
    }
    if (description) set('meta[name="description"]', { tag: 'meta', attrs: { name: 'description' } }, description)
    set('meta[name="robots"]', { tag: 'meta', attrs: { name: 'robots' } }, noindex ? 'noindex, nofollow' : '')
  }, [title, description, noindex])
}
