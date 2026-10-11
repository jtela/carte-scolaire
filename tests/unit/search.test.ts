import { describe, it, expect } from 'vitest'
import * as state from '../../src/features/search/state'
describe('query', () => {
 it('preserves leading zeros in five-digit postcodes', () => {
  expect('parseQuery' in state).toBe(true)
  expect(state.parseQuery(' 01000 ')).toEqual({kind:'postcode', value:'01000'})
 })
 it.each(['', ' ', '123', '123456', '1', '---', 'A', '123ab'])('rejects invalid input %s', input => expect(state.parseQuery(input)).toBeNull())
 it.each(['Saint-Étienne', "Castelnau-d’Estrétefonds", 'Évry-Courcouronnes'])('preserves commune name %s', input => expect(state.parseQuery(input)).toEqual({kind:'name',value:input}))
})
