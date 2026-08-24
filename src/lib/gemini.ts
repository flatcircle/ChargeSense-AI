import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKeys = [
  import.meta.env.VITE_GEMINI_API_KEY,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3,
].filter(Boolean)

let currentKeyIndex = 0

function getGenAIInstance() {
  if (apiKeys.length === 0) return null
  const key = apiKeys[currentKeyIndex]
  return { genAI: new GoogleGenerativeAI(key), key }
}

function rotateKey() {
  if (apiKeys.length <= 1) return false
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length
  console.warn(`[ChargeSense AI] Quota or call error occurred. Switched Gemini API Key to slot ${currentKeyIndex + 1}/${apiKeys.length}.`)
  return true
}

export async function askGemini(prompt: string, context?: string): Promise<string> {
  let attempts = 0
  const maxAttempts = apiKeys.length || 1

  while (attempts < maxAttempts) {
    const instance = getGenAIInstance()
    if (!instance) {
      return 'Error: VITE_GEMINI_API_KEY is not set. Please add it to your .env file.'
    }
    try {
      const model = instance.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      const systemInstruction = context ? `You are ChargeSense AI, a smart assistant for MPPKVVCL (Indore) EV infrastructure planning. Use this context info:\n${context}\n\n` : ''
      const result = await model.generateContent(systemInstruction + prompt)
      return result.response.text()
    } catch (error) {
      console.error(`[ChargeSense AI] Error with key slot ${currentKeyIndex + 1}:`, error)
      attempts++
      if (attempts < maxAttempts && rotateKey()) {
        console.log(`Retrying API call with backup key (Attempt ${attempts + 1}/${maxAttempts})...`)
        continue
      }
      return `Error: ${error instanceof Error ? error.message : 'Unknown error calling Gemini API'}`
    }
  }
  return 'Error: All configured Gemini API keys failed.'
}

export async function* askGeminiStream(prompt: string, context?: string): AsyncGenerator<string, void, unknown> {
  let attempts = 0
  const maxAttempts = apiKeys.length || 1

  while (attempts < maxAttempts) {
    const instance = getGenAIInstance()
    if (!instance) {
      yield 'Error: VITE_GEMINI_API_KEY is not set. Please add it to your .env file.'
      return
    }
    try {
      const model = instance.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      const systemInstruction = context ? `You are ChargeSense AI, a smart assistant for MPPKVVCL (Indore) EV infrastructure planning. Use this context info:\n${context}\n\n` : ''
      const result = await model.generateContentStream(systemInstruction + prompt)
      for await (const chunk of result.stream) {
        yield chunk.text()
      }
      return
    } catch (error) {
      console.error(`[ChargeSense AI] Streaming error with key slot ${currentKeyIndex + 1}:`, error)
      attempts++
      if (attempts < maxAttempts && rotateKey()) {
        console.log(`Retrying streaming call with backup key (Attempt ${attempts + 1}/${maxAttempts})...`)
        continue
      }
      yield `Error: ${error instanceof Error ? error.message : 'Unknown error calling Gemini API'}`
      return
    }
  }
}
