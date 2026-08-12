import { describe,expect,it } from 'vitest'
import { campaignSearch, canRead, commitProposals, exportCampaign, validateProvenance, type CampaignState, type ChangeProposal } from './domain'
const empty: CampaignState={entities:[],facts:[],changeSets:[]}
describe('domain safety',()=>{
 it('never exposes GM-only records to a player',()=>expect(canRead('GM_ONLY','PLAYER')).toBe(false))
 it('requires block provenance for AI output',()=>expect(validateProvenance({origin:'AI',confidence:.9,transcriptBlockIds:[]})).toBe(false))
 it('commits only accepted proposals',()=>{const p:ChangeProposal={id:'p',analysisId:'a',type:'NEW_ENTITY',status:'ACCEPTED',provenance:{origin:'AI',confidence:.9,sessionId:'s',transcriptBlockIds:['b']},payload:{id:'e',campaignId:'c',type:'NPC',name:'Маркус',aliases:[],description:'',visibility:'CAMPAIGN',metadata:{}}};expect(commitProposals(empty,[p]).entities).toHaveLength(1)})
 it('search respects GM visibility',()=>{const state={...empty,entities:[{id:'e',campaignId:'c',type:'NPC' as const,name:'Тайна',aliases:[],description:'вампир',visibility:'GM_ONLY' as const,metadata:{}}]};expect(campaignSearch(state,'PLAYER','вампир')).toHaveLength(0);expect(campaignSearch(state,'GM','вампир')).toHaveLength(1)})
 it('exports a versioned portable envelope',()=>expect(exportCampaign({id:'c'},empty)).toMatchObject({format:'ttrpg-dictaphone',version:1}))
})
