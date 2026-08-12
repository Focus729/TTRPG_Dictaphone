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
    const body=new FormData(); body.append('audio',input.audio); body.append('language',input.language)
    const response=await fetch(this.endpoint,{method:'POST',headers:{'Idempotency-Key':input.idempotencyKey},body})
    if(response.status===429) throw new ProviderError('AI_FREE_QUOTA_EXCEEDED','Бесплатный лимит исчерпан')
    if(!response.ok) throw new ProviderError('TRANSCRIPTION_FAILED','Не удалось выполнить транскрипцию')
    return response.json() as Promise<TranscriptionResult>
  }
}
