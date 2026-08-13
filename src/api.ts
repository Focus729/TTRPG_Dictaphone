export type ApiErrorPayload={code?:string;message?:string;model?:string}

/** Parse API responses without leaking a raw JSON.parse exception into the UI. */
export async function readApiResponse<T>(response:Response):Promise<T>{
  const text=await response.text()
  let data:ApiErrorPayload&T
  try{data=text?JSON.parse(text):{} as ApiErrorPayload&T}
  catch{
    const looksLikeHtml=/^\s*</.test(text)
    throw new Error(looksLikeHtml
      ?'Сервер API недоступен: получена HTML-страница. Запустите backend через npm start и обновите страницу.'
      :'Сервер вернул некорректный ответ. Повторите операцию или проверьте журнал сервера.')
  }
  if(!response.ok)throw new Error(data.message||data.code||`Ошибка API (${response.status})`)
  return data
}
