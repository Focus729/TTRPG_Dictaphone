import{describe,expect,it}from'vitest'
import{readApiResponse}from'./api'

describe('readApiResponse',()=>{
  it('parses JSON',async()=>expect(await readApiResponse<{ok:boolean}>(new Response('{"ok":true}'))).toEqual({ok:true}))
  it('reports an unavailable API instead of a JSON.parse exception',async()=>{
    await expect(readApiResponse(new Response('<!doctype html><title>Vite</title>'))).rejects.toThrow('Сервер API недоступен')
  })
  it('uses a structured API error',async()=>{
    await expect(readApiResponse(new Response('{"code":"AI_FREE_QUOTA_EXCEEDED"}',{status:429}))).rejects.toThrow('AI_FREE_QUOTA_EXCEEDED')
  })
})
