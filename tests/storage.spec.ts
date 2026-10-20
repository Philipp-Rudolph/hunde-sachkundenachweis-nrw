import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadState, saveState, type StorageSpec } from '@/lib/storage'

interface Data {
  value: number
}

const parse = (data: unknown): Data | null =>
  typeof data === 'object' && data !== null && typeof (data as Data).value === 'number'
    ? { value: (data as Data).value }
    : null

const spec: StorageSpec<Data> = {
  key: 'test:storage',
  version: 2,
  defaults: () => ({ value: 0 }),
  parse,
  migrations: { 1: (data) => ({ value: (data as { count: number }).count }) },
}

const write = (value: unknown) => localStorage.setItem(spec.key, JSON.stringify(value))

describe('storage wrapper', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('returns defaults for a missing entry', () => {
    expect(loadState(spec)).toEqual({ value: 0 })
  })

  it('returns defaults for corrupt JSON', () => {
    localStorage.setItem(spec.key, '{not json')
    expect(loadState(spec)).toEqual({ value: 0 })
  })

  it('returns defaults for data without a version envelope', () => {
    write({ value: 5 })
    expect(loadState(spec)).toEqual({ value: 0 })
  })

  it('returns defaults when parse rejects the data', () => {
    write({ version: 2, data: { value: 'five' } })
    expect(loadState(spec)).toEqual({ value: 0 })
  })

  it('returns defaults for a newer, unknown version', () => {
    write({ version: 3, data: { value: 5 } })
    expect(loadState(spec)).toEqual({ value: 0 })
  })

  it('migrates older versions', () => {
    write({ version: 1, data: { count: 7 } })
    expect(loadState(spec)).toEqual({ value: 7 })
  })

  it('returns defaults when a migration is missing or throws', () => {
    write({ version: 0, data: {} })
    expect(loadState(spec)).toEqual({ value: 0 })
    write({ version: 1, data: null })
    expect(loadState(spec)).toEqual({ value: 0 })
  })

  it('round-trips saved data with the schema version in the stored object', () => {
    expect(saveState(spec, { value: 42 })).toBe(true)
    expect(JSON.parse(localStorage.getItem(spec.key)!)).toEqual({ version: 2, data: { value: 42 } })
    expect(loadState(spec)).toEqual({ value: 42 })
  })

  it('falls back gracefully when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(loadState(spec)).toEqual({ value: 0 })
    expect(saveState(spec, { value: 1 })).toBe(false)
  })
})
