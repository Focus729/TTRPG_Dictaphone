export async function readJsonResponse(response, provider) {
  const text=await response.text()
  try{return text?JSON.parse(text):{}}
  catch{
    const html=/^\s*</.test(text)
    const error=new Error(html
      ?`${provider} вернул HTML вместо JSON (HTTP ${response.status}). Это временная ошибка шлюза провайдера; повторите запрос позже.`
      :`${provider} вернул некорректный ответ (HTTP ${response.status}).`)
    error.code='UPSTREAM_INVALID_RESPONSE'
    error.status=response.status
    throw error
  }
}
