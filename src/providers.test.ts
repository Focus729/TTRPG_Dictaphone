import { afterEach, describe, expect, it, vi } from 'vitest'
import { ServerTranscriptionProvider } from './providers'

describe('ServerTranscriptionProvider', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sends the recording as Groq-compatible `file` multipart field', async () => {
    const fetchMock=vi.fn(async (_url:unknown, init?:RequestInit) => {
      const form=init?.body as FormData
      const file=form.get('file') as File
      expect(file).toBeInstanceOf(File)
      expect(file.name).toBe('recording.webm')
      expect(form.get('audio')).toBeNull()
      expect(form.get('language')).toBe('ru')
      return new Response(JSON.stringify({rawText:'Тест',language:'ru',blocks:[]}),{status:200,headers:{'content-type':'application/json'}})
    })
    vi.stubGlobal('fetch',fetchMock)
    const result=await new ServerTranscriptionProvider().transcribe({audio:new Blob(['audio'],{type:'audio/webm'}),language:'ru',idempotencyKey:'test-key'})
    expect(result.rawText).toBe('Тест')
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
