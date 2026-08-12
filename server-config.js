/** Resolve a supported Gemini model while preserving explicit future models. */
export function resolveGeminiModel(value) {
  const configured=(value || '').replace(/^models\//, '')
  return !configured || configured === 'gemini-2.0-flash' ? 'gemini-2.5-flash' : configured
}
