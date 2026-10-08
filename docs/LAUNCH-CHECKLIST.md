# Launch checklist

Work from top to bottom. Items marked **(you)** need your accounts or decisions.

## 1. Accounts and secrets (you)
- [ ] Replit Secrets set: `ADMIN_PASSWORD`, `SESSION_SECRET` (random), `ADMIN_EMAIL`, `SITE_URL` (the live address, no trailing slash)
- [ ] Email provider chosen, domain verified, `SMTP_URL` and `MAIL_FROM` set. Send yourself a test booking to confirm emails arrive
- [ ] Stripe: Connect enabled, live keys in `STRIPE_SECRET_KEY`, webhook `https://YOURSITE/api/stripe/webhook` for `checkout.session.completed`, secret in `STRIPE_WEBHOOK_SECRET`
- [ ] Ask Stripe which vendor countries your Australian account can pay out to (Bali / Indonesia in particular) and edit `PAYOUT_COUNTRIES` in `server/stripe.js`

## 2. Database
- [ ] Move from the SQLite file to Postgres so data survives redeploys (see the database recommendation in the project notes)
- [ ] Confirm backups are on

## 3. Legal (you)
- [ ] Fill every `[[placeholder]]` in `docs/legal/`
- [ ] Have a solicitor review the terms, privacy policy, vendor terms and cancellation policy
- [ ] Set `LEGAL_DRAFT = false` in `src/legal/config.js`
- [ ] Check the business has an ABN, and consider insurance and GST registration

## 4. Content
- [ ] Real vendors added (apply, then approve in `/admin`) so the map is not empty
- [ ] Vendor photos approved and credited where required
- [ ] Destination photos: permission confirmed for each
- [ ] Larger originals swapped in for the destination photos (`public/images/`, originals in `assets/originals/`)

## 5. Search (SEO)
- [ ] Domain connected and `SITE_URL` matches it exactly
- [ ] Google Search Console: add the site, verify, submit `https://YOURSITE/sitemap.xml`
- [ ] Bing Webmaster Tools: same (it can import from Search Console)
- [ ] Share a vendor page in WhatsApp or iMessage to check the preview image and title
- [ ] Add analytics if wanted (Google Analytics or a privacy-friendly option), then update the privacy policy

## 6. Final checks
- [ ] Do a real test booking end to end in Stripe test mode, including a cancellation and refund
- [ ] Test on a phone
- [ ] Try the admin page, approve and reject an application
- [ ] Switch Stripe to live mode and make one small real payment, then refund it
