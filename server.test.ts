import { describe, expect, it } from 'vitest'
import { resolveGeminiModel } from './server-config.js'

describe('resolveGeminiModel', () => {
  it.each([undefined, '', 'gemini-2.0-flash', 'models/gemini-2.0-flash'])(
    'migrates retired model %s to Gemini 2.5 Flash',
    value => expect(resolveGeminiModel(value)).toBe('gemini-2.5-flash'),
  )

  it('preserves an explicitly configured newer model', () => {
    expect(resolveGeminiModel('models/gemini-2.5-pro')).toBe('gemini-2.5-pro')
  })
})
