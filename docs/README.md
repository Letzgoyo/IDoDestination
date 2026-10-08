# Project documents

| Document | What it is | Owner action |
|---|---|---|
| [`LAUNCH-CHECKLIST.md`](LAUNCH-CHECKLIST.md) | Everything to do before and just after going live | Work through it top to bottom |
| [`legal/terms-of-service.md`](legal/terms-of-service.md) | Terms for couples using the site (shown at `/terms`) | Fill the `[[placeholders]]`, lawyer review |
| [`legal/privacy-policy.md`](legal/privacy-policy.md) | How personal information is handled (shown at `/privacy`) | Fill the `[[placeholders]]`, lawyer review |
| [`legal/vendor-terms.md`](legal/vendor-terms.md) | Marketplace agreement for vendors (shown at `/vendor-terms`) | Fill the `[[placeholders]]`, lawyer review |
| [`legal/cancellation-and-refunds.md`](legal/cancellation-and-refunds.md) | Cancellation and refund rules (shown at `/cancellation-policy`) | Confirm the numbers match the site settings |

**These are drafts, not legal advice.** They were written to match how the site actually works (AUD pricing, Stripe payments and
payouts, vendor approval, the refund rules) and Australian law, but a solicitor must review them before launch.

The pages on the site are rendered straight from these Markdown files, so edit the files here and redeploy.
Anything written `[[like this]]` is a placeholder and shows highlighted on the page until you replace it.
While `LEGAL_DRAFT` is `true` in `src/legal/config.js`, each legal page shows a "draft" notice. Set it to `false` once reviewed.
