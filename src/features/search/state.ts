import type { Commune } from './communes'
import type { SectorResponse } from '../sectors/types'
export type SearchState={kind:'idle'|'invalid'|'searching'|'no-match'|'choose-commune'|'loading-sectors'|'unavailable'|'empty'|'ready'|'error';generation:number;candidates?:Commune[];commune?:Commune;sectors?:SectorResponse;message?:string;stage?:'lookup'|'sectors'}
export type Action={type:'reset';generation:number;kind:SearchState['kind']}|{type:'update';generation:number;patch:Partial<Omit<SearchState,'generation'>>}
export function reducer(state:SearchState,action:Action):SearchState {
 if(action.type==='reset') return action.generation>state.generation?{kind:action.kind,generation:action.generation}:state
 return action.generation===state.generation?{...state,...action.patch}:state
}
export type SearchQuery = {kind:'postcode'|'name'; value:string}
export function parseQuery(input:string): SearchQuery|null {
 const value=input.trim()
 if (/^[0-9]{5}$/.test(value)) return {kind:'postcode',value}
 if (value.length<2 || value.length>120 || !/\p{L}/u.test(value) || /[0-9]/.test(value)) return null
 return {kind:'name',value}
}
