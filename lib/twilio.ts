import twilio from 'twilio'

function getClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  )
}

export async function sendDealSMS(
  toPhone: string,
  setName: string,
  listedPrice: number,
  estimatedValue: number,
  roiPercent: number,
  location: string,
  listingUrl: string
) {
  const message = `🧱 BrickMarket Deal Alert!\n${setName} spotted on Facebook Marketplace\nListed: $${listedPrice.toFixed(0)} | Worth: $${estimatedValue.toFixed(0)} (~${Math.round(roiPercent)}% ROI)\n📍 ${location}\n🔗 ${listingUrl}\n\nReply STOP to unsubscribe`

  await getClient().messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: toPhone,
  })
}

export async function sendTradeMatchSMS(
  toPhone: string,
  matchScore: number,
  matchedUsername: string,
  appUrl: string
) {
  const message = `🧱 BrickMarket: Trade match found! ${matchedUsername} (${matchScore}% compatibility). View at ${appUrl}/trades`
  await getClient().messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER!, to: toPhone })
}
