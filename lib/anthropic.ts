import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  }
  return _client
}

export const MODEL = 'claude-sonnet-4-6'

export async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  try {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })
    const block = response.content[0]
    if (block.type === 'text') return block.text
    return ''
  } catch (err) {
    console.error('Claude API error:', err)
    throw err
  }
}

export async function callClaudeWithImage(
  systemPrompt: string,
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
): Promise<string> {
  try {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: imageBase64 },
            },
            { type: 'text', text: 'Identify this LEGO set and provide your analysis.' },
          ],
        },
      ],
    })
    const block = response.content[0]
    if (block.type === 'text') return block.text
    return ''
  } catch (err) {
    console.error('Claude vision API error:', err)
    throw err
  }
}

export function parseJson<T>(text: string): T | null {
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    return JSON.parse(match[0]) as T
  } catch {
    return null
  }
}
