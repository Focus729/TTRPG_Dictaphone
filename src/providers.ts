export interface TranscriptionInput { audio: Blob; language: 'ru'|'en'; idempotencyKey: string }
export interface TranscriptionResult { rawText: string; language: string; blocks: {id:string;index:number;text:string;startMs?:number;endMs?:number}[] }
export interface TranscriptionProvider { transcribe(input: TranscriptionInput): Promise<TranscriptionResult> }
export interface StructuredGenerationInput { system: string; content: string; context?: unknown }
export interface Schema<T> { parse(value: unknown): T }
export interface LlmProvider { generateStructured<T>(input: StructuredGenerationInput, schema: Schema<T>): Promise<T> }

export class ProviderError extends Error { constructor(public code: 'AI_FREE_QUOTA_EXCEEDED'|'TRANSCRIPTION_FAILED'|'AI_ANALYSIS_FAILED'|'INVALID_AI_RESPONSE', message: string){super(message)} }

/** Server-side adapter contract. API keys must never be passed to this browser client. */
export class ServerTranscriptionProvider implements TranscriptionProvider {
  constructor(private endpoint='/api/transcribe'){}
  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    // Groq's OpenAI-compatible endpoint requires the multipart field to be
    // named `file` (not `audio`) and needs a filename with a supported suffix.
    const extension=input.audio.type.includes('ogg')?'ogg':input.audio.type.includes('wav')?'wav':input.audio.type.includes('mpeg')?'mp3':input.audio.type.includes('mp4')?'m4a':'webm'
    const body=new FormData(); body.append('file',input.audio,`recording.${extension}`); body.append('language',input.language)
    const response=await fetch(this.endpoint,{method:'POST',headers:{'Idempotency-Key':input.idempotencyKey},body})
    if(response.status===429) throw new ProviderError('AI_FREE_QUOTA_EXCEEDED','Бесплатный лимит исчерпан')
    if(!response.ok) throw new ProviderError('TRANSCRIPTION_FAILED','Не удалось выполнить транскрипцию')
    return response.json() as Promise<TranscriptionResult>
  }
}
