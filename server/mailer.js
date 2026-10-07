import nodemailer from 'nodemailer'

const from = process.env.MAIL_FROM || 'I Do Destination <hello@idodestination.com.au>'
const transport = process.env.SMTP_URL ? nodemailer.createTransport(process.env.SMTP_URL) : null

if (!transport) console.warn('[mail] SMTP_URL not set - emails will be logged to the console only')

export async function sendMail({ to, subject, text, replyTo }) {
  if (!transport) {
    console.log(`[mail] to=${to}${replyTo ? ` reply-to=${replyTo}` : ''}\n  subject: ${subject}\n  ${text.replaceAll('\n', '\n  ')}`)
    return
  }
  try {
    await transport.sendMail({ from, to, subject, text, replyTo })
  } catch (err) {
    // Never fail a request because email failed; the record is already saved.
    console.error('[mail] send failed:', err.message)
  }
}
