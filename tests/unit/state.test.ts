import { expect, it } from 'vitest'
import * as state from '../../src/features/search/state'
it('ignores obsolete success and errors after edit or a newer request', () => {
 expect('reducer' in state).toBe(true)
 const idle={kind:'idle',generation:0} as state.SearchState
 const a=state.reducer(idle,{type:'reset',generation:1,kind:'searching'})
 const b=state.reducer(a,{type:'reset',generation:2,kind:'idle'})
 expect(state.reducer(b,{type:'update',generation:1,patch:{kind:'ready'}})).toBe(b)
 expect(state.reducer(b,{type:'update',generation:1,patch:{kind:'error',message:'late error'}})).toBe(b)
 expect(state.reducer(b,{type:'update',generation:2,patch:{kind:'unavailable'}}).kind).toBe('unavailable')
})
