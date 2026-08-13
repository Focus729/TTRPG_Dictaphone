import{describe,expect,it}from'vitest'
import{readJsonResponse}from'./server-http.js'

describe('readJsonResponse',()=>{
  it('parses provider JSON',async()=>expect(await readJsonResponse(new Response('{"text":"ok"}'),'Groq')).toEqual({text:'ok'}))
  it('turns a provider HTML page into an actionable error',async()=>{
    await expect(readJsonResponse(new Response('<html><head></head></html>',{status:502}),'Groq')).rejects.toThrow('Groq вернул HTML вместо JSON (HTTP 502)')
  })
})
