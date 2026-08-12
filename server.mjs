import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const port = Number(process.env.PORT || 3000)
const root = join(process.cwd(), 'dist')
const json = (response, status, data) => {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(data))
}
const readBody = request => new Promise((resolve, reject) => {
  const chunks = []
  let size = 0
  request.on('data', chunk => {
    size += chunk.length
    if (size > 30_000_000) reject(new Error('Request is too large'))
    else chunks.push(chunk)
  })
  request.on('end', () => resolve(Buffer.concat(chunks)))
  request.on('error', reject)
})

async function api(request, response) {
  if (request.url === '/api/health') {
    return json(response, 200, {
      ok: true,
      transcriptionConfigured: Boolean(process.env.GROQ_API_KEY),
      analysisConfigured: Boolean(process.env.GEMINI_API_KEY),
    })
  }
  if (request.url === '/api/transcribe' && request.method === 'POST') {
    if (!process.env.GROQ_API_KEY) return json(response, 503, { code: 'TRANSCRIPTION_NOT_CONFIGURED' })
    const upstream = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'content-type': request.headers['content-type'] },
      body: await readBody(request),
    })
    const data = await upstream.json()
    if (upstream.status === 429) return json(response, 429, { code: 'AI_FREE_QUOTA_EXCEEDED' })
    if (!upstream.ok) return json(response, 502, { code: 'TRANSCRIPTION_FAILED', message: data.error?.message })
    return json(response, 200, data)
  }
  if (request.url === '/api/analyze' && request.method === 'POST') {
    if (!process.env.GEMINI_API_KEY) return json(response, 503, { code: 'AI_ANALYSIS_NOT_CONFIGURED' })
    const input = JSON.parse((await readBody(request)).toString())
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    const prompt = `Ты извлекаешь сведения только из пользовательской транскрипции. Не используй внешние знания и RPG lore. Пустой результат допустим. Не объединяй сомнительные сущности. Верни JSON строго по схеме. Каждый объект должен ссылаться на существующие sourceBlockIds и содержать дословный sourceText. Блоки: ${JSON.stringify(input.blocks || [])}. Текст: ${input.text}`
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{ responseMimeType:'application/json', responseSchema:{type:'OBJECT',required:['summary','recap','entities'],properties:{summary:{type:'STRING'},recap:{type:'STRING'},entities:{type:'ARRAY',items:{type:'OBJECT',required:['name','type','description','sourceText','sourceBlockIds','confidence'],properties:{name:{type:'STRING'},type:{type:'STRING',enum:['PLAYER_CHARACTER','NPC','LOCATION','ITEM','EVENT','QUEST','FACTION','IMPORTANT_NOTE','SPELL','MONSTER','DEITY','HISTORICAL_EVENT']},description:{type:'STRING'},sourceText:{type:'STRING'},sourceBlockIds:{type:'ARRAY',items:{type:'STRING'}},confidence:{type:'NUMBER'},visibility:{type:'STRING',enum:['CAMPAIGN','PLAYER_PRIVATE','GM_ONLY']}}}}}} } })
    })
    const data = await upstream.json()
    if (upstream.status === 429) return json(response, 429, { code:'AI_FREE_QUOTA_EXCEEDED' })
    if (!upstream.ok) return json(response, 502, { code:'AI_ANALYSIS_FAILED', message:data.error?.message })
    try { return json(response, 200, JSON.parse(data.candidates[0].content.parts[0].text)) }
    catch { return json(response, 502, { code:'INVALID_AI_RESPONSE' }) }
  }
  return json(response, 404, { code: 'NOT_FOUND' })
}

createServer(async (request, response) => {
  try {
    if (request.url?.startsWith('/api/')) return await api(request, response)
    let path = normalize(decodeURI(request.url?.split('?')[0] || '/')).replace(/^(\.\.[/\\])+/, '')
    if (path === '/') path = '/index.html'
    let file = join(root, path)
    try { if (!(await stat(file)).isFile()) throw new Error('Not a file') } catch { file = join(root, 'index.html') }
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' }[extname(file)] || 'application/octet-stream'
    response.writeHead(200, { 'content-type': mime })
    response.end(await readFile(file))
  } catch (error) {
    json(response, 500, { code: 'SERVER_ERROR', message: String(error) })
  }
}).listen(port, () => console.log(`TTRPG Dictaphone: http://localhost:${port}`))
