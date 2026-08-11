# TTRPG Dictaphone — Technical Specification

**Status:** MVP specification
**Primary language:** Russian
**Application type:** Mobile-first PWA
**Primary implementation target:** Codex
**Priority:** zero mandatory AI cost > structuring accuracy > transcription accuracy

---

# 1. Product goal

Создать персональное приложение для ведения журнала TTRPG-кампаний.

Основной сценарий:

1. Пользователь заканчивает игровую сессию.
2. Выбирает кампанию.
3. Создаёт запись сессии.
4. За несколько минут голосом пересказывает произошедшее.
5. Приложение транскрибирует запись.
6. AI структурирует информацию.
7. Пользователь проверяет предложенные изменения.
8. После подтверждения изменения попадают в базу знаний кампании.
9. Перед следующей игрой пользователь может открыть краткий `Previously on...`.

Типичная голосовая запись MVP: **до 5 минут**.

Критерий успеха MVP:

> После обычной TTRPG-сессии пользователь за несколько минут наговаривает отчёт, проверяет AI Review и получает достаточно полную и удобную базу знаний, чтобы практически не вести параллельный основной журнал вручную.

---

# 2. Product principles

При реализации соблюдать следующие правила в указанном порядке.

## P1. Zero mandatory AI cost

Приложение должно иметь возможность работать в пределах бесплатных AI-квот.

Запрещено:

* автоматически переключаться на платный API;
* автоматически активировать billing;
* считать наличие платного OpenAI API обязательным;
* скрывать от пользователя факт исчерпания бесплатной квоты.

При исчерпании free quota:

```text
AI_FREE_QUOTA_EXCEEDED
```

Приложение:

* сохраняет аудио;
* сохраняет уже полученную транскрипцию;
* сохраняет состояние сессии;
* показывает понятную ошибку;
* позволяет повторить операцию позже.

AI-провайдеры обязательно абстрагировать интерфейсами.

---

## P2. No hallucinated campaign lore

AI может использовать **только информацию из пользовательских данных**.

Запрещено автоматически добавлять:

* официальный D&D lore;
* сведения из Forgotten Realms;
* свойства существ из rulebooks;
* известные AI сведения о персонажах/городах/монстрах;
* информацию из интернета.

Если пользователь сказал только:

```text
Мы добрались до Baldur's Gate.
```

допустимо создать:

```text
Location:
  name: Baldur's Gate
```

Недопустимо самостоятельно добавлять описание города.

---

## P3. AI proposes, user commits

В MVP AI никогда напрямую не изменяет canonical knowledge base.

Пайплайн:

```text
AI result
   ↓
change proposals
   ↓
Review
   ↓
Accept / Edit / Reject
   ↓
canonical database
```

Все AI-generated изменения проходят Review.

---

## P4. Provenance first

Любой извлечённый AI факт должен иметь источник.

Минимально:

```text
sessionId
transcriptBlockIds[]
confidence
origin
```

Если факт нельзя связать с конкретным участком транскрипции, AI не должен создавать его как подтверждённый факт.

---

## P5. Preserve history

Новые сведения не должны уничтожать старые.

Пример:

```text
Session 4:
Король мёртв.

Session 7:
Король оказался жив.
```

Хранить обе записи.

Новый факт:

```text
status = CURRENT
supersedesFactId = oldFactId
```

Старый:

```text
status = SUPERSEDED
```

---

# 3. MVP scope

## 3.1 Обязательно реализовать

### Accounts

* регистрация;
* login/logout;
* email + password либо magic link;
* один пользователь MVP;
* архитектура не должна препятствовать multi-user в будущем.

### Campaigns

* создание;
* редактирование;
* удаление;
* несколько независимых кампаний;
* system-agnostic TTRPG;
* роль пользователя задаётся отдельно для каждой кампании:

  * `PLAYER`
  * `GM`.

### Player characters

Для кампании можно заранее создать персонажей игроков.

Минимальные поля:

```text
name
playerName
description
metadata
```

Игровые характеристики не являются отдельной обязательной системой.

Если AC, HP, spell, class и т. п. были явно упомянуты пользователем, их можно сохранить как факты.

### Sessions

* создать session;
* дата;
* название;
* произвольная заметка;
* запись через microphone;
* загрузка существующего audio;
* просмотр транскрипции;
* редактирование транскрипции;
* повторный AI-анализ;
* summary;
* recap;
* найденные сущности;
* Review;
* удаление.

### AI extraction

Обязательные категории:

```text
PLAYER_CHARACTER
NPC
LOCATION
ITEM
EVENT
QUEST
FACTION
IMPORTANT_NOTE
SPELL
MONSTER
DEITY
HISTORICAL_EVENT
```

### Knowledge base

* список сущностей;
* карточка сущности;
* ручное создание;
* ручное изменение;
* удаление;
* aliases;
* факты;
* связи;
* источники;
* visibility;
* provenance.

### Search

MVP:

* полнотекстовый поиск;
* поиск внутри активной campaign;
* названия;
* aliases;
* descriptions;
* facts;
* transcripts;
* summaries.

Natural-language / semantic search — не MVP.

### Import

MVP:

```text
.md
.txt
```

Импорт не должен автоматически превращать весь текст в canonical entities.

Рекомендуемый pipeline:

```text
import
→ source document
→ AI analysis
→ change proposals
→ Review
→ commit
```

### Export

Обязательно:

```text
Markdown
JSON
```

Пользователь должен иметь возможность экспортировать кампанию целиком.

Приложение никогда не должно быть единственным местом хранения пользовательских заметок.

---

# 4. Non-goals for MVP

Не реализовывать без отдельного изменения scope:

```text
❌ Native Android
❌ Native iOS
❌ запись всей 4–8 часовой игровой сессии
❌ background recording
❌ realtime transcription
❌ speaker diarization
❌ распознавание игроков по голосам
❌ collaborative campaigns
❌ приглашения других пользователей
❌ configurable multiplayer permissions
❌ visual relationship graph
❌ AI chat with campaign
❌ semantic/vector search
❌ VTT
❌ combat tracker
❌ character sheet system
❌ encounter generator
❌ world map
❌ world calendar
❌ AI images
```

Однако модель данных должна позволять позже добавить:

* relationships graph;
* campaign Q&A;
* collaboration;
* granular permissions.

---

# 5. Target platform

Приложение реализуется как:

```text
PWA
```

Обязательная поддержка:

```text
Android browser/PWA
iPhone browser/PWA
Desktop browser
```

Mobile-first.

Desktop должен использовать responsive layout, а не отдельное приложение.

---

# 6. Recommended stack

```text
Frontend / Backend:
Next.js
TypeScript

UI:
React
Tailwind CSS
component library: shadcn/ui or equivalent

Validation:
Zod

Database:
PostgreSQL

Cloud backend:
Supabase

Authentication:
Supabase Auth

Object storage:
Supabase Storage

Local temporary state:
IndexedDB

Testing:
Vitest
Testing Library
Playwright

PWA:
manifest
service worker/offline shell
```

Архитектура должна позволять сначала запускать приложение локально.

Production deployment добавляется позже.

---

# 7. AI architecture

## 7.1 Provider abstraction

Никакой бизнес-код не должен напрямую зависеть от Groq/Gemini.

Использовать:

```ts
interface TranscriptionProvider {
  transcribe(input: TranscriptionInput): Promise<TranscriptionResult>;
}

interface LlmProvider {
  generateStructured<T>(
    input: StructuredGenerationInput,
    schema: Schema<T>
  ): Promise<T>;
}
```

Первоначальные реализации:

```text
TranscriptionProvider
└── GroqWhisperProvider

LlmProvider
└── GeminiProvider
```

В будущем новый provider должен подключаться без изменения domain layer.

---

# 8. Transcription

Основной provider:

```text
Groq
whisper-large-v3
```

Использовать точную модель из config/env.

Не hardcode модель по всему приложению.

Пример:

```env
TRANSCRIPTION_PROVIDER=groq
GROQ_TRANSCRIPTION_MODEL=whisper-large-v3
```

Основной язык первой версии:

```text
ru
```

Архитектура должна поддерживать:

```text
ru
en
```

Смешанная RU/EN речь не является обязательным acceptance requirement первой реализации.

---

# 9. Audio flow

```text
Record / Upload
       ↓
temporary local audio
       ↓
upload
       ↓
transcription
       ↓
raw transcript
       ↓
AI analysis
       ↓
Review
```

Пользователь может:

```text
Record
Pause
Resume
Stop
Discard
Upload file
Play
Seek
```

Поддерживаемые upload formats минимум:

```text
webm
mp3
m4a
wav
ogg
```

Перед отправкой provider допустимо преобразование audio.

---

# 10. Audio lifecycle

Настройка campaign/user:

```text
KEEP_FOREVER
DELETE_AFTER_TRANSCRIPT_CONFIRMATION
```

Default:

```text
DELETE_AFTER_TRANSCRIPT_CONFIRMATION
```

Но файл нельзя удалять просто после успешного API response.

Последовательность:

```text
transcription received
↓
user may review/edit transcript
↓
user confirms transcript
↓
audio may be deleted
```

Пока audio существует, transcript editor должен позволять воспроизводить запись.

---

# 11. Transcript model

Хранить минимум две версии:

```text
rawText
normalizedText
```

`rawText`:

* исходный результат transcription provider;
* никогда не изменять автоматически.

`normalizedText`:

* версия для пользовательских исправлений;
* используется последующим AI pipeline.

Разбивать transcript на blocks.

Пример:

```text
B001
После этого мы прибыли в Валлаки.

B002
Там познакомились с трактирщиком Маркусом.

B003
Маркус рассказал, что ночью в лесу появляются оборотни.
```

Каждый block:

```ts
{
  id: string
  transcriptId: string
  index: number
  text: string
  startMs?: number
  endMs?: number
}
```

---

# 12. AI analysis pipeline

Не использовать один гигантский prompt.

Логические стадии:

```text
TRANSCRIPTION
      ↓
NORMALIZATION
      ↓
ENTITY EXTRACTION
      ↓
ENTITY RESOLUTION
      ↓
FACT EXTRACTION
      ↓
RELATION EXTRACTION
      ↓
EVENT EXTRACTION
      ↓
SUMMARY
      ↓
RECAP
      ↓
CHANGE PROPOSALS
      ↓
REVIEW
      ↓
COMMIT
```

На MVP стадии могут технически выполняться меньшим количеством API requests, но domain contracts должны оставаться разделёнными.

---

# 13. Context selection

Никогда не отправлять LLM всю campaign без необходимости.

Pipeline:

```text
new transcript
↓
detect names / aliases / candidate entities
↓
retrieve relevant existing entities
↓
retrieve nearby relationships/facts
↓
send compact context
```

Контекст должен быть ограничен campaign.

GM restrictions должны применяться **до формирования LLM input**.

---

# 14. Structured output

Все ответы LLM, используемые машинно, должны проходить schema validation.

Использовать JSON Schema/Zod-compatible contract.

Недопустимо:

```text
"Верни мне JSON примерно такого вида..."
```

и последующий ненадёжный parsing текста.

Пример high-level результата:

```json
{
  "summary": "...",
  "recap": "...",
  "entities": [],
  "facts": [],
  "relations": [],
  "events": [],
  "importantNotes": []
}
```

Семантическую корректность результата дополнительно проверяет application layer.

---

# 15. AI extraction rules

System instructions должны содержать:

```text
1. Extract only information supported by provided user content.
2. Never add external RPG lore.
3. Never invent missing properties.
4. Empty result is valid.
5. Every proposed fact must reference sourceBlockIds.
6. Never silently merge uncertain entities.
7. Preserve visibility.
8. Never expose GM_ONLY information into PLAYER content.
9. Explicitly represent uncertainty.
10. Existing facts must not be overwritten.
```

---

# 16. Confidence

Каждый AI proposal:

```ts
confidence: number // 0..1
```

Используется исключительно как вспомогательная UX-метрика.

Не считать confidence истинной математической вероятностью.

Состояния:

```text
AI
UNCONFIRMED
CONFIRMED
MANUAL
```

Все AI proposals MVP всё равно требуют Review.

---

# 17. Entity resolution

Главная задача:

```text
"Страд"
"Страхд"
"Strahd"
"граф Страд"
```

не должны автоматически становиться четырьмя NPC.

При анализе AI получает:

* canonical name;
* aliases;
* тип;
* несколько relevant facts.

Результат resolution:

```ts
type Resolution =
  | { type: "EXISTING"; entityId: string; confidence: number }
  | { type: "NEW"; proposedEntity: EntityDraft }
  | {
      type: "AMBIGUOUS";
      candidates: EntityCandidate[];
    };
```

`AMBIGUOUS` всегда отправлять пользователю на Review.

Запрещено автоматически объединять сомнительные сущности.

---

# 18. Entity model

Использовать общую таблицу `entities`, а type-specific свойства — структурированное поле либо расширяемые subtype structures.

```ts
EntityType =
  | "PLAYER_CHARACTER"
  | "NPC"
  | "LOCATION"
  | "ITEM"
  | "EVENT"
  | "QUEST"
  | "FACTION"
  | "IMPORTANT_NOTE"
  | "SPELL"
  | "MONSTER"
  | "DEITY"
  | "HISTORICAL_EVENT";
```

Основные поля:

```text
id
campaign_id
type
name
description
visibility
metadata
created_at
updated_at
deleted_at
```

Все entities принадлежат только одной campaign.

Cross-campaign entity sharing в MVP отсутствует.

---

# 19. NPC fields

Поддерживать:

```text
name
aliases
description
role
attitudeToParty
knownInformation
informationFromNpc
relatedNpcs
relatedLocations
relatedFactions
status
firstAppearance
lastAppearance
```

Факты желательно хранить не как одну постоянно перезаписываемую строку, а через `entity_facts`.

---

# 20. Location fields

Поддерживать:

```text
name
aliases
description
relatedNpcs
relatedItems
relatedQuests
events
firstVisit
lastVisit
```

---

# 21. Facts

Таблица:

```text
entity_facts
```

Минимальная структура:

```ts
{
  id: UUID
  campaignId: UUID
  entityId?: UUID

  kind: string
  value: string

  visibility: Visibility
  certainty: FactCertainty
  origin: Origin

  sourceSessionId?: UUID
  sourceTranscriptBlockIds: UUID[]

  supersedesFactId?: UUID

  createdAt: timestamp
  updatedAt: timestamp
}
```

`FactCertainty`:

```text
CONFIRMED
UNCONFIRMED
```

`Origin`:

```text
AI
MANUAL
IMPORT
```

---

# 22. Relationships

Данные связей хранить уже в MVP.

UI-граф не реализовывать.

Таблица:

```text
entity_relations
```

```ts
{
  id
  campaignId
  fromEntityId
  toEntityId
  relationType
  description?
  visibility
  sourceSessionId?
  sourceTranscriptBlockIds[]
}
```

Примеры:

```text
NPC → MEMBER_OF → FACTION
NPC → LOCATED_AT → LOCATION
NPC → KNOWS → NPC
ITEM → OWNED_BY → PLAYER_CHARACTER
QUEST → GIVEN_BY → NPC
EVENT → OCCURRED_AT → LOCATION
```

---

# 23. Visibility model

Использовать три уровня:

```text
CAMPAIGN
PLAYER_PRIVATE
GM_ONLY
```

Семантика:

### CAMPAIGN

Общие сведения кампании.

### PLAYER_PRIVATE

Личная заметка пользователя.

Архитектура рассчитана на будущий multiplayer.

### GM_ONLY

Секретная информация мастера.

Если роль campaign = PLAYER:

```text
GM_ONLY
```

никогда не должен попадать:

* в API response;
* в search results;
* в recap;
* в summary;
* в LLM context.

Не скрывать GM_ONLY только на frontend.

---

# 24. GM mode

Перед записью GM выбирает:

```text
Player knowledge
GM notes
```

Для GM note AI может самостоятельно предложить разделение отдельных фактов на:

```text
CAMPAIGN
GM_ONLY
```

Например:

```text
Игроки встретили барона.
Они пока не знают, что он вампир.
```

AI:

```text
CAMPAIGN:
Игроки встретили барона.

GM_ONLY:
Барон является вампиром.
```

Пользователь может исправить visibility на Review.

GM при просмотре видит обе категории.

GM-only информация должна иметь явную визуальную маркировку.

---

# 25. Sessions

Таблица `sessions`.

```text
id
campaign_id
title
played_at
note_mode
status
summary
recap
created_at
updated_at
```

`note_mode`:

```text
PLAYER_KNOWLEDGE
GM_NOTES
```

`status`:

```text
DRAFT
AUDIO_READY
TRANSCRIBING
TRANSCRIBED
ANALYZING
REVIEW_REQUIRED
COMPLETED
FAILED
```

Ошибки не должны уничтожать предыдущий успешный этап.

---

# 26. Summary vs recap

Создавать два отдельных результата.

## Summary

Подробная фактологическая сводка сессии.

Default target:

```text
~500–800 words maximum
```

Адаптировать длину к объёму исходной информации.

Не раздувать короткие sessions искусственно.

## Recap

Короткий текст для чтения перед следующей игрой.

Default:

```text
~1 minute reading
```

Настройка длины.

Styles:

```text
FACTUAL
PREVIOUSLY_ON
LITERARY
EPIC
```

Default:

```text
PREVIOUSLY_ON
```

Recap содержит:

* основные события;
* 1–3 непосредственно актуальные unresolved threads.

Не перечислять всю историю campaign.

---

# 27. Review

Review — центральный экран MVP.

Вначале показать summary изменений:

```text
5 новых NPC
2 обновления NPC
3 новые локации
1 конфликт
2 возможных дубля
4 новых события
```

Затем карточки proposals.

Типы:

```text
NEW_ENTITY
UPDATE_ENTITY
NEW_FACT
SUPERSEDE_FACT
NEW_RELATION
ENTITY_MATCH
AMBIGUOUS_ENTITY
VISIBILITY_CHANGE
```

Карточка:

```text
NEW NPC

Alaric

Role:
Кузнец

Description:
Местный кузнец.

Source:
[B014] "...познакомились с кузнецом Алариком..."

Confidence:
0.91

Visibility:
CAMPAIGN

[Accept]
[Edit]
[Reject]
```

---

# 28. Commit

До commit proposals находятся отдельно от canonical data.

После Review:

```text
POST /review/:id/commit
```

Commit выполняется transactionally.

Либо все выбранные изменения применились, либо ни одно.

После commit пользователь должен иметь возможность выполнить:

```text
Undo AI changes
```

Undo реализовать через change-set/revision, а не попыткой вычислять обратную операцию из текущего состояния.

---

# 29. Undo model

Создать:

```text
change_sets
change_set_operations
```

Каждый Review commit создаёт change set.

Хранить previous/new state достаточно для rollback.

Undo не должен удалять пользовательские изменения, сделанные после AI commit.

При конфликте показывать предупреждение.

---

# 30. Search

PostgreSQL full-text search.

Индексировать:

```text
entity.name
entity.description
aliases
facts
session.title
session.summary
transcript normalized text
```

Scope:

```text
campaign_id = active campaign
```

Фильтры:

```text
All
NPC
Locations
Items
Quests
Sessions
Notes
```

Search должен учитывать visibility.

---

# 31. Navigation

Основная навигация — sidebar/menu.

Mobile:

```text
☰ Campaign name

Sessions
Encyclopedia
Search
Import / Export
Settings
```

Главный CTA:

```text
+ New session
```

Desktop:

persistent/collapsible sidebar.

---

# 32. UI style

Стиль:

```text
modern application UI
+
subtle tabletop RPG elements
```

Не использовать heavy parchment/fantasy UI.

Приоритет:

1. читаемость;
2. скорость;
3. понятность;
4. responsive layout;
5. стилистика.

Dark mode обязателен.

Поддержать:

```text
system
light
dark
```

---

# 33. Campaign screen

Пример:

```text
Curse of Strahd
PLAYER

[+ New Session]

Previously on...
────────────────────
...

Sessions
────────────────────
Session 12
Session 11
Session 10

Knowledge
────────────────────
18 NPC
12 Locations
7 Quests
...
```

---

# 34. Entity screen

Пример NPC:

```text
Ireena Kolyana

NPC

Status:
Alive

Aliases:
Ireena

Role:
...

Attitude:
...

Known information:
• ...
• ...

Information from NPC:
• ...

Related:
Ismark
Strahd
Village of Barovia

Facts:
✓ ...
◇ ...
? ...

First appearance:
Session 2

Last appearance:
Session 8

Sources:
Session 2
Session 4
Session 8
```

Каждый fact можно:

```text
Edit
Delete
Change visibility
Open source
```

---

# 35. Database high-level schema

```text
profiles

campaigns
campaign_members

sessions

audio_assets

transcripts
transcript_blocks

entities
entity_aliases

entity_mentions
entity_facts
entity_relations

events

recaps

analysis_runs
change_proposals
change_sets
change_set_operations

import_documents
```

---

# 36. Suggested SQL relations

```text
campaigns
  1 ─── N sessions

campaigns
  1 ─── N entities

sessions
  1 ─── N transcripts

transcripts
  1 ─── N transcript_blocks

entities
  1 ─── N entity_aliases

entities
  1 ─── N entity_facts

entities
  N ─── N entities
       through entity_relations

sessions
  1 ─── N analysis_runs

analysis_runs
  1 ─── N change_proposals
```

UUID primary keys everywhere.

Use:

```text
created_at
updated_at
```

where applicable.

Prefer soft deletion for canonical knowledge entities.

---

# 37. API routes

Exact REST semantics may adapt to Next.js conventions.

Required logical endpoints:

```text
/auth/*

/api/campaigns
/api/campaigns/:id

/api/campaigns/:id/sessions
/api/sessions/:id

/api/sessions/:id/audio
/api/sessions/:id/transcribe
/api/sessions/:id/analyze

/api/sessions/:id/transcript

/api/campaigns/:id/entities
/api/entities/:id

/api/entities/:id/facts
/api/entities/:id/relations

/api/analysis/:id/proposals
/api/analysis/:id/commit

/api/change-sets/:id/undo

/api/campaigns/:id/search

/api/campaigns/:id/export
/api/campaigns/:id/import
```

Все mutation endpoints валидировать через schema.

---

# 38. Job idempotency

Операции:

```text
transcribe
analyze
commit
```

должны быть idempotent либо иметь idempotency key.

Повторное нажатие не должно создавать:

* два transcript;
* два analysis run;
* дублированные facts.

---

# 39. Error handling

Использовать domain error codes.

Например:

```text
AUDIO_UPLOAD_FAILED
AUDIO_FORMAT_UNSUPPORTED
TRANSCRIPTION_FAILED
TRANSCRIPTION_RATE_LIMITED
AI_ANALYSIS_FAILED
AI_RATE_LIMITED
AI_FREE_QUOTA_EXCEEDED
INVALID_AI_RESPONSE
REVIEW_ALREADY_COMMITTED
ENTITY_CONFLICT
NETWORK_OFFLINE
AUTH_REQUIRED
ACCESS_DENIED
```

UI должен показывать:

```text
что произошло
что сохранено
что пользователь может сделать дальше
```

Пример:

```text
Бесплатный лимит AI временно исчерпан.

Аудиозапись сохранена.
Повторите транскрипцию позже.

[Повторить]
```

---

# 40. AI provider failure

Никогда автоматически не переключаться с бесплатного provider на платного.

Допустимо иметь fallback только если он:

```text
explicitly configured
AND free
AND user-approved
```

---

# 41. Security

Все AI/API secrets исключительно server-side.

Никогда:

```text
NEXT_PUBLIC_GROQ_API_KEY
NEXT_PUBLIC_GEMINI_API_KEY
```

Правильно:

```text
GROQ_API_KEY
GEMINI_API_KEY
```

Frontend не вызывает providers напрямую.

---

# 42. Database authorization

Для Supabase включить RLS на пользовательских таблицах.

Минимальный MVP:

```text
authenticated user
can access only own campaign rows
```

Все дочерние ресурсы должны проверяться через campaign ownership/membership.

Нельзя считать скрытие UI авторизацией.

---

# 43. Storage security

Audio bucket:

```text
private
```

Object path рекомендуется:

```text
{userId}/{campaignId}/{sessionId}/{uuid}.{extension}
```

Signed URLs использовать только с ограниченным lifetime.

---

# 44. Privacy

В настройках объяснить:

* куда отправляется audio;
* куда отправляется transcript;
* какой AI provider используется;
* что free-tier условия могут зависеть от provider;
* когда удаляется original audio.

Не обещать offline AI, если используется внешний API.

---

# 45. Offline behavior

Полный offline AI не требуется.

PWA должна:

* открываться после предыдущей загрузки;
* показывать уже кэшированные основные экраны;
* сохранять незавершённую локальную запись;
* не терять audio при кратковременной потере сети;
* явно показывать offline состояние.

AI operations требуют network.

---

# 46. Localization

Весь UI text не hardcode внутри компонентов.

Подготовить i18n abstraction:

```text
ru
en
```

MVP UI реализовать на русском.

Database content не переводить автоматически.

---

# 47. Export JSON

Экспорт должен использовать versioned schema:

```json
{
  "format": "ttrpg-dictaphone",
  "version": 1,
  "exportedAt": "...",
  "campaign": {},
  "sessions": [],
  "entities": [],
  "facts": [],
  "relations": []
}
```

Не экспортировать:

* API keys;
* auth tokens;
* внутренние secrets.

---

# 48. Markdown export

Рекомендуемая структура:

```text
campaign.md

sessions/
  001-session.md
  002-session.md

entities/
  npcs/
  locations/
  items/
  quests/
  factions/
  ...

README.md
```

Markdown должен быть пригоден для чтения без приложения.

---

# 49. Testing requirements

Минимально:

## Unit

* entity resolution helper;
* visibility filtering;
* superseding facts;
* schema validation;
* recap settings;
* export serialization.

## Integration

* campaign isolation;
* analysis → proposals;
* proposals → commit;
* undo;
* import;
* search;
* RLS.

## E2E

Playwright:

```text
sign in
create campaign
create session
upload fixture audio/mock transcription
run mocked AI analysis
review proposals
commit
open NPC
search NPC
export campaign
```

Для automated tests реальные Groq/Gemini requests не использовать.

Создать:

```text
MockTranscriptionProvider
MockLlmProvider
```

---

# 50. Critical acceptance tests

## AT-001 — Multiple campaigns

GIVEN две campaigns

WHEN пользователь открывает Campaign A

THEN данные Campaign B нигде не появляются.

---

## AT-002 — Existing entity

GIVEN существует NPC:

```text
Strahd
aliases:
Страд
Страхд
```

WHEN transcript содержит:

```text
Мы снова встретили Страда.
```

THEN AI предлагает изменение существующего `Strahd`

AND не создаёт автоматически нового NPC.

---

## AT-003 — Ambiguous entity

GIVEN существуют похожие NPC

WHEN AI не может надёжно определить entity

THEN создаётся `AMBIGUOUS_ENTITY` proposal

AND canonical DB не изменяется.

---

## AT-004 — Source provenance

WHEN AI предлагает факт

THEN proposal содержит минимум один `sourceTranscriptBlockId`.

Если source отсутствует:

```text
proposal validation fails
```

---

## AT-005 — No hallucinated lore

GIVEN transcript:

```text
Мы прибыли в Baldur's Gate.
```

WHEN analysis completes

THEN AI может предложить Location `Baldur's Gate`

BUT MUST NOT добавить внешний lore города.

---

## AT-006 — Superseding fact

GIVEN:

```text
Fact A:
Король мёртв.
```

WHEN новая session сообщает:

```text
Король оказался жив.
```

THEN система сохраняет оба факта

AND новый proposal может ссылаться:

```text
supersedesFactId = Fact A
```

---

## AT-007 — Review required

WHEN AI analysis завершается

THEN canonical campaign data не изменяется

UNTIL пользователь выполняет Commit.

---

## AT-008 — Undo

GIVEN пользователь committed AI Review

WHEN нажимает Undo

THEN изменения данного change set отменяются

WITHOUT удаления независимых пользовательских изменений.

---

## AT-009 — GM isolation

GIVEN:

```text
GM_ONLY:
Alaric secretly is a vampire.
```

WHEN строится PLAYER recap

THEN GM_ONLY fact:

```text
MUST NOT
```

попасть даже в LLM input.

---

## AT-010 — Audio safety

GIVEN транскрипция завершилась

BUT пользователь ещё не подтвердил её

THEN original audio нельзя удалять автоматически.

---

## AT-011 — Free quota

GIVEN provider возвращает rate/quota error

WHEN бесплатный лимит исчерпан

THEN приложение:

```text
does not use paid fallback
does not lose audio
does not lose transcript
shows retry option
```

---

## AT-012 — Transcript correction

GIVEN пользователь изменил normalized transcript

WHEN запускает `Повторить AI-анализ`

THEN создаётся новый analysis run

AND предыдущий committed canonical state не изменяется до нового Review.

---

## AT-013 — Search

GIVEN NPC имеет alias `Страд`

WHEN пользователь ищет `Страд`

THEN `Strahd` находится.

---

## AT-014 — Export

WHEN пользователь экспортирует campaign

THEN получает самостоятельный читаемый Markdown export

AND machine-readable JSON export.

---

# 51. AI evaluation fixtures

Создать:

```text
tests/fixtures/ai/
```

Минимум 15–20 русскоязычных synthetic session transcripts.

Покрыть:

```text
new NPC
existing NPC
misspelled NPC
new location
new quest
quest completion
NPC tells information
conflicting fact
GM secret
uncertain information
item discovery
faction relationship
historical event
spell mention
monster mention
multiple entities with similar names
```

Для каждого fixture хранить expected structural facts.

Это важнее visual polish AI-функций.

---

# 52. Repository structure

```text
/
├── AGENTS.md
├── README.md
│
├── docs/
│   ├── SPEC.md
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── AI_PIPELINE.md
│   ├── SECURITY.md
│   ├── UI_UX.md
│   ├── API.md
│   └── ACCEPTANCE_TESTS.md
│
├── plans/
│   ├── MVP.md
│   └── BACKLOG.md
│
├── src/
│   ├── app/
│   ├── components/
│   ├── domain/
│   ├── db/
│   ├── ai/
│   │   ├── providers/
│   │   ├── schemas/
│   │   ├── prompts/
│   │   └── pipeline/
│   ├── audio/
│   ├── auth/
│   ├── search/
│   └── export/
│
├── supabase/
│   └── migrations/
│
└── tests/
    ├── unit/
    ├── integration/
    ├── e2e/
    └── fixtures/
```

---

# 53. AGENTS.md instructions for Codex

Создать корневой `AGENTS.md`.

Содержимое по смыслу:

```text
SPEC.md is the product source of truth.

Do not expand product scope without updating SPEC.md.

Before implementing a milestone:
1. Read SPEC.md.
2. Read relevant architecture docs.
3. Read plans/MVP.md.
4. Implement only the current milestone.

After implementation:
1. Run typecheck.
2. Run lint.
3. Run unit tests.
4. Run relevant integration tests.
5. Update documentation when architecture changed.

Never:
- bypass TypeScript with unnecessary any;
- put AI API keys in client code;
- write AI data directly into canonical tables;
- expose GM_ONLY data to player flows;
- invent campaign facts;
- silently merge uncertain entities;
- automatically use paid AI APIs.

Prefer:
- small modules;
- explicit domain types;
- Zod validation at system boundaries;
- provider interfaces;
- transactional writes;
- migrations committed to repository;
- deterministic tests.
```

---

# 54. Implementation milestones

## M0 — Foundation

Implement:

```text
Next.js
TypeScript
Tailwind
UI primitives
PWA manifest
Supabase local development
database migrations
testing setup
lint/typecheck
```

Done when:

```text
app starts locally
tests run
PWA manifest valid
DB migrations run from zero
```

---

## M1 — Campaign knowledge base

Implement:

```text
auth
campaign CRUD
campaign role
player characters
entities
aliases
facts
relations
manual editing
visibility
sidebar
dark mode
```

No AI yet.

---

## M2 — Sessions + audio

Implement:

```text
session CRUD
MediaRecorder
audio upload
audio playback
Storage
transcript model
MockTranscriptionProvider
GroqTranscriptionProvider
transcript editor
```

Done when user can create a session and obtain/edit a transcript.

---

## M3 — AI analysis

Implement:

```text
LlmProvider
GeminiProvider
structured schemas
entity extraction
entity resolution
facts
relations
events
summary
recap
source block references
```

Output only proposals.

---

## M4 — Review

Implement:

```text
proposal overview
proposal cards
accept
edit
reject
ambiguity resolution
visibility correction
transactional commit
change sets
undo
```

This milestone is required before calling AI pipeline complete.

---

## M5 — Knowledge UX

Implement:

```text
session pages
entity pages
full-text search
sources navigation
recap settings
summary UI
```

---

## M6 — Import/export

Implement:

```text
Markdown import
TXT import
Markdown export
JSON export
campaign backup
```

---

## M7 — Hardening

Implement:

```text
RLS verification
quota errors
retry flows
offline state
responsive UI
PWA installability
E2E
AI fixtures
cross-campaign isolation tests
GM leak tests
```

Only after M7 MVP считается завершённым.

---

# 55. Future backlog

После MVP:

```text
Natural-language campaign Q&A
Semantic search
Graph visualization
Timeline UI
Multiplayer campaigns
Invitations
Configurable permissions
Shared player notes
Native application if PWA limitations become material
Long-session recording
Speaker diarization
Automatic backups
Additional AI providers
Full EN UI
```

Graph UI отсутствует в MVP, но `entity_relations` уже хранится.

---

# 56. Definition of Done

MVP считается завершённым только если пользователь может выполнить весь сценарий:

```text
Create campaign
↓
Create session
↓
Record <5 minute voice note
↓
Transcribe
↓
Edit transcript if required
↓
AI analyze
↓
See summary + recap
↓
Review every proposed change
↓
Resolve duplicate/ambiguous entity
↓
Commit
↓
Open updated campaign encyclopedia
↓
Search information
↓
Open original source
↓
Undo erroneous AI changes
↓
Export full campaign
```

и при этом выполняются invariants:

```text
No mandatory paid AI.
No silent AI writes.
No fact without provenance.
No silent uncertain merge.
No destructive fact overwrite.
No cross-campaign leakage.
No GM secret leakage.
No API secret in browser.
No loss of audio/transcript after AI failure.
```

---

# 57. Architectural priority order

Если при реализации возникает конфликт требований, использовать следующий порядок:

```text
0. AI monetary cost must remain zero within configured free tier.
1. Campaign data integrity.
2. Accuracy of information structuring.
3. Transcription accuracy.
4. User control / reversibility.
5. Privacy and GM isolation.
6. Ease of use.
7. Performance.
8. Visual polish.
```

Главный принцип проекта:

> AI здесь не является владельцем базы знаний. AI — это инструмент, который превращает неструктурированный голосовой рассказ пользователя в проверяемые предложения по обновлению долговременной памяти кампании.
