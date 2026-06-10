import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!)
}

const FROM = 'BrickMarket <notifications@brickmarket.app>'

export async function sendTradeDisputeEmail(
  matchId: string,
  filedByUsername: string,
  againstUsername: string,
  reason: string,
  description: string
) {
  await getResend().emails.send({
    from: FROM,
    to: 'cadetarchick21@gmail.com',
    subject: `[DISPUTE] Trade ${matchId.slice(0, 8)} — Filed by @${filedByUsername}`,
    html: `
      <h2>Trade Dispute Filed</h2>
      <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px;">
        <tr><td style="padding:8px;font-weight:bold;background:#f1f5f9">Match ID</td><td style="padding:8px">${matchId}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;background:#f1f5f9">Filed By</td><td style="padding:8px">@${filedByUsername}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;background:#f1f5f9">Against</td><td style="padding:8px">@${againstUsername}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;background:#f1f5f9">Reason</td><td style="padding:8px">${reason}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;background:#f1f5f9">Description</td><td style="padding:8px">${description}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;background:#f1f5f9">Filed At</td><td style="padding:8px">${new Date().toLocaleString()}</td></tr>
      </table>
      <p style="margin-top:16px"><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" style="background:#ef4444;color:white;padding:8px 16px;text-decoration:none;border-radius:6px">View in Admin →</a></p>
    `,
  })
}

export async function sendTradeMatchEmail(
  toEmail: string,
  toName: string,
  matchScore: number,
  matchedUsername: string
) {
  await getResend().emails.send({
    from: FROM,
    to: toEmail,
    subject: `🧱 Trade match found! ${matchScore}% compatibility`,
    html: `
      <h2>You've got a trade match!</h2>
      <p>Hey ${toName},</p>
      <p><strong>${matchedUsername}</strong> has sets you want and wants sets you have.</p>
      <p>Match compatibility: <strong>${matchScore}%</strong></p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/trades">View your matches →</a></p>
      <hr/>
      <small>BrickMarket — LEGO Community Platform</small>
    `,
  })
}

export async function sendPurchaseConfirmation(
  buyerEmail: string,
  buyerName: string,
  listingTitle: string,
  price: number,
  sellerUsername: string
) {
  await getResend().emails.send({
    from: FROM,
    to: buyerEmail,
    subject: `Order confirmed: ${listingTitle}`,
    html: `
      <h2>Your order is confirmed!</h2>
      <p>Hey ${buyerName},</p>
      <p>You purchased <strong>${listingTitle}</strong> for <strong>$${price.toFixed(2)}</strong> from <strong>${sellerUsername}</strong>.</p>
      <p>The seller has been notified and will be in touch to arrange shipping.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/messages">Message the seller →</a></p>
    `,
  })
}

export async function sendSaleNotification(
  sellerEmail: string,
  sellerName: string,
  listingTitle: string,
  price: number,
  buyerUsername: string
) {
  const payout = price * 0.92
  await getResend().emails.send({
    from: FROM,
    to: sellerEmail,
    subject: `Your listing sold: ${listingTitle}`,
    html: `
      <h2>You made a sale! 🎉</h2>
      <p>Hey ${sellerName},</p>
      <p><strong>${listingTitle}</strong> sold for <strong>$${price.toFixed(2)}</strong>. Your payout (after 8% fee): <strong>$${payout.toFixed(2)}</strong>.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/messages">Message the buyer →</a></p>
    `,
  })
}

export async function sendDealAlert(
  toEmail: string,
  dealTitle: string,
  listedPrice: number,
  estimatedValue: number,
  roiPercent: number,
  location: string,
  listingUrl: string
) {
  await getResend().emails.send({
    from: FROM,
    to: toEmail,
    subject: `🧱 Deal Alert: ${dealTitle} — ${Math.round(roiPercent)}% ROI`,
    html: `
      <h2>🧱 BrickMarket Deal Alert!</h2>
      <p><strong>${dealTitle}</strong></p>
      <p>Listed: <strong>$${listedPrice.toFixed(2)}</strong> | Worth: <strong>$${estimatedValue.toFixed(2)}</strong> (~<strong>${Math.round(roiPercent)}%</strong> ROI)</p>
      <p>📍 ${location}</p>
      <p><a href="${listingUrl}">View listing →</a></p>
      <hr/>
      <small><a href="${process.env.NEXT_PUBLIC_APP_URL}/deal-scanner">Manage alerts</a></small>
    `,
  })
}

export async function sendWeeklyChampionEmail(
  toEmail: string,
  toName: string,
  setName: string,
  roi: number,
  profit: number
) {
  await getResend().emails.send({
    from: FROM,
    to: toEmail,
    subject: '🏆 You won this week\'s BrickMarket Flip Leaderboard!',
    html: `
      <h2>🏆 Weekly Champion!</h2>
      <p>Congratulations ${toName}!</p>
      <p>Your flip of <strong>${setName}</strong> for <strong>${roi.toFixed(1)}% ROI ($${profit.toFixed(2)} profit)</strong> topped this week's leaderboard.</p>
      <p>Your champion badge has been added to your profile.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/leaderboard">View leaderboard →</a></p>
    `,
  })
}
