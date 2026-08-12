export type Entity = { id: string; name: string; type: string; description: string; tag?: string; facts: string[] }
export type Session = { id: string; title: string; date: string; duration: string; summary: string; status: 'completed' | 'review' }

export const entities: Entity[] = [
  { id:'ireena', name:'Ирина Коляна', type:'NPC', tag:'Союзник', description:'Дочь покойного бургомистра Баровии. Путешествует с отрядом в Валлаки.', facts:['Ищет безопасное место вдали от Страда','Хорошо владеет рапирой'] },
  { id:'rictavio', name:'Риктавио', type:'NPC', tag:'Знакомый', description:'Загадочный рассказчик из таверны «Синяя вода».', facts:['Расспрашивал героев об оборотнях'] },
  { id:'vallaki', name:'Валлаки', type:'LOCATION', tag:'Посещено', description:'Город за высокими стенами, где постоянно проводят праздники.', facts:['Бургомистр запрещает произносить имя Страда'] },
  { id:'bones', name:'Кости святого Андрала', type:'ITEM', tag:'Утеряно', description:'Священная реликвия церкви Валлаки.', facts:['Исчезли из крипты три дня назад'] },
  { id:'andrals', name:'Церковь святого Андрала', type:'LOCATION', description:'Церковь на западной окраине Валлаки.', facts:['Без костей больше не является освящённой'] },
  { id:'feast', name:'Угроза над церковью', type:'QUEST', tag:'Активно', description:'Найти пропавшие кости и вернуть защиту церкви.', facts:['След ведёт к помощнику гробовщика'] },
]

export const sessions: Session[] = [
  {id:'12',title:'Тени над Валлаки',date:'9 августа 2026',duration:'4 мин аудио',status:'completed',summary:'Герои добрались до Валлаки и узнали об исчезновении костей святого Андрала.'},
  {id:'11',title:'Дорога через туман',date:'2 августа 2026',duration:'3 мин аудио',status:'completed',summary:'Отряд покинул деревню Баровия вместе с Ириной.'},
  {id:'10',title:'Дом на холме',date:'26 июля 2026',duration:'5 мин аудио',status:'completed',summary:'Герои выбрались из старого дома и встретили Исмарка.'},
]

export const proposals = [
 {kind:'NEW NPC',name:'Риктавио',detail:'Загадочный рассказчик из таверны «Синяя вода».',source:'В таверне мы познакомились с рассказчиком Риктавио…',block:'B014',confidence:'91%'},
 {kind:'NEW FACT',name:'Кости святого Андрала',detail:'Исчезли из церковной крипты три дня назад.',source:'Отец Люциан сказал, что кости пропали три дня назад…',block:'B021',confidence:'96%'},
 {kind:'NEW QUEST',name:'Вернуть защиту церкви',detail:'Найти кости святого Андрала и вернуть их в церковь.',source:'Мы пообещали найти кости до следующей ночи.',block:'B027',confidence:'94%'},
]
