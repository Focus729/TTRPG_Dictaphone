export const ENTITY_TYPES = ['PLAYER_CHARACTER','NPC','LOCATION','ITEM','EVENT','QUEST','FACTION','IMPORTANT_NOTE','SPELL','MONSTER','DEITY','HISTORICAL_EVENT'] as const
export type EntityType = typeof ENTITY_TYPES[number]
export type Visibility = 'CAMPAIGN' | 'PLAYER_PRIVATE' | 'GM_ONLY'
export type CampaignRole = 'PLAYER' | 'GM'
export type Origin = 'AI' | 'MANUAL' | 'IMPORT'
export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface Provenance { sessionId?: string; transcriptBlockIds: string[]; confidence: number; origin: Origin }
export interface Fact extends Provenance { id: string; campaignId: string; entityId?: string; kind: string; value: string; visibility: Visibility; certainty: 'CONFIRMED'|'UNCONFIRMED'; status: 'CURRENT'|'SUPERSEDED'; supersedesFactId?: string; updatedAt: string }
export interface Entity { id: string; campaignId: string; type: EntityType; name: string; aliases: string[]; description: string; visibility: Visibility; metadata: Record<string, unknown>; deletedAt?: string }
export interface ChangeProposal { id: string; analysisId: string; type: 'NEW_ENTITY'|'UPDATE_ENTITY'|'NEW_FACT'|'SUPERSEDE_FACT'|'NEW_RELATION'|'ENTITY_MATCH'|'AMBIGUOUS_ENTITY'|'VISIBILITY_CHANGE'; status: ProposalStatus; payload: Record<string, unknown>; provenance: Provenance }
export interface ChangeSet { id: string; proposalIds: string[]; before: CampaignState; after: CampaignState; committedAt: string; undoneAt?: string }
export interface CampaignState { entities: Entity[]; facts: Fact[]; changeSets: ChangeSet[] }

export const canRead = (visibility: Visibility, role: CampaignRole) => visibility !== 'GM_ONLY' || role === 'GM'
export const visibleState = (state: CampaignState, role: CampaignRole): CampaignState => ({...state, entities: state.entities.filter(e => canRead(e.visibility, role)), facts: state.facts.filter(f => canRead(f.visibility, role))})
export const validateProvenance = (p: Provenance) => p.confidence >= 0 && p.confidence <= 1 && (p.origin !== 'AI' || Boolean(p.sessionId && p.transcriptBlockIds.length))

const clone = <T,>(value: T): T => structuredClone(value)
export function commitProposals(state: CampaignState, proposals: ChangeProposal[]): CampaignState {
  const selected = proposals.filter(p => p.status === 'ACCEPTED')
  if (selected.some(p => !validateProvenance(p.provenance))) throw new Error('INVALID_AI_RESPONSE')
  const before = clone(state); const next = clone(state)
  for (const proposal of selected) {
    if (proposal.type === 'NEW_ENTITY') next.entities.push(proposal.payload as unknown as Entity)
    if (proposal.type === 'NEW_FACT') next.facts.push(proposal.payload as unknown as Fact)
    if (proposal.type === 'SUPERSEDE_FACT') {
      const oldId = String(proposal.payload.supersedesFactId); const old = next.facts.find(f => f.id === oldId)
      if (!old) throw new Error('ENTITY_CONFLICT'); old.status = 'SUPERSEDED'; next.facts.push(proposal.payload as unknown as Fact)
    }
  }
  const snapshotAfter = clone({...next, changeSets: []})
  next.changeSets.push({id: crypto.randomUUID(), proposalIds: selected.map(p=>p.id), before: {...before,changeSets:[]}, after: snapshotAfter, committedAt: new Date().toISOString()})
  return next
}

export function undoChangeSet(state: CampaignState, id: string): CampaignState {
  const set = state.changeSets.find(c => c.id === id); if (!set || set.undoneAt) throw new Error('ENTITY_CONFLICT')
  const currentComparable = {...state, changeSets: []}
  if (JSON.stringify(currentComparable) !== JSON.stringify(set.after)) throw new Error('ENTITY_CONFLICT')
  return {...clone(set.before), changeSets: state.changeSets.map(c => c.id === id ? {...c,undoneAt:new Date().toISOString()} : c)}
}

export function campaignSearch(state: CampaignState, role: CampaignRole, query: string) {
  const q = query.trim().toLocaleLowerCase('ru'); if (!q) return []
  const visible = visibleState(state, role)
  return visible.entities.filter(e => [e.name,e.description,...e.aliases,...visible.facts.filter(f=>f.entityId===e.id).map(f=>f.value)].join(' ').toLocaleLowerCase('ru').includes(q))
}

export function exportCampaign(campaign: Record<string,unknown>, state: CampaignState) {
  return {format:'ttrpg-dictaphone' as const,version:1,exportedAt:new Date().toISOString(),campaign,sessions:[],entities:state.entities,facts:state.facts,relations:[]}
}
