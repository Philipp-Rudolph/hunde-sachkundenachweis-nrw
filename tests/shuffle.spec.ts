import { describe, expect, it } from 'vitest'
import { createSeededRandom, shuffle } from '@/lib/shuffle'

const items = Array.from({ length: 20 }, (_, i) => i)

describe('shuffle', () => {
  it('returns a permutation without mutating the input', () => {
    const input = [...items]
    const result = shuffle(input)
    expect(input).toEqual(items)
    expect([...result].sort((a, b) => a - b)).toEqual(items)
  })

  it('is deterministic for the same seed', () => {
    expect(shuffle(items, 42)).toEqual(shuffle(items, 42))
  })

  it('produces different orders for different seeds', () => {
    expect(shuffle(items, 1)).not.toEqual(shuffle(items, 2))
  })

  it('handles empty and single-element arrays', () => {
    expect(shuffle([])).toEqual([])
    expect(shuffle(['x'])).toEqual(['x'])
  })
})

describe('createSeededRandom', () => {
  it('yields values in [0, 1)', () => {
    const random = createSeededRandom(7)
    for (let i = 0; i < 1000; i++) {
      const value = random()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})
