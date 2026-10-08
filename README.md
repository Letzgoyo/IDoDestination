# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Marketplace & payments
- Vendors list **services** (trial / package / deposit) priced in AUD. A service is either *pay online now* or *request* (vendor accepts via an emailed private link, then the couple pays).
- Couples need no account; each booking has a private link (`/booking/:token`) sent by email.
- Payments use Stripe Checkout in AUD. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (webhook endpoint: `/api/stripe/webhook`, event `checkout.session.completed`). Without a key, bookings are vendor-confirmed requests only.
- **Stripe Connect (Express):** on approval each vendor gets a private link (`/vendor/:token`) to connect payouts. Online payments are destination charges: the couple pays in AUD, `PLATFORM_FEE_PERCENT` stays with the platform, the rest transfers to the vendor's connected account and Stripe pays them out in their local currency. Services only show "Book now" once the vendor is connected; otherwise they are requests.
- Enable Connect in the Stripe dashboard. The platform webhook only needs `checkout.session.completed`; vendor payout status refreshes itself when the vendor opens their payouts page. Cross-border payouts depend on Stripe's supported countries for an Australian platform; edit `PAYOUT_COUNTRIES` in `server/stripe.js` after checking with Stripe.

## Docs, SEO and photos
- `docs/` holds the launch checklist and the legal drafts (terms, privacy, vendor terms, cancellations). The site's legal pages render directly from `docs/legal/*.md`. They are drafts until a solicitor reviews them (`src/legal/config.js`).
- `server/seo.js` adds per-page titles, descriptions, social-share tags, structured data, `robots.txt` and `sitemap.xml` (set `SITE_URL` to your live address).
- Vendor photos are uploaded with the application, stored in the database (`vendor_photos`) and shown on listings after approval.
- The map uses OpenStreetMap tiles (no key). Set `MAP_TILES_URL` / `MAP_ATTRIBUTION` for another provider.
