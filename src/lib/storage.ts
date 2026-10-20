/** Stored shape in localStorage: the schema version lives next to the data. */
export interface StoredEnvelope {
  version: number
  data: unknown
}

export interface StorageSpec<T> {
  key: string
  /** Current schema version. Bump it and add a migration when the shape changes. */
  version: number
  defaults: () => T
  /** Validates (and may sanitize) raw data; returns null if unusable. */
  parse: (data: unknown) => T | null
  /** migrations[n] upgrades data from version n to n + 1. */
  migrations?: Record<number, (data: unknown) => unknown>
}

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function isEnvelope(value: unknown): value is StoredEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    Number.isInteger((value as StoredEnvelope).version) &&
    'data' in value
  )
}

/** Loads data for `spec`. Missing, corrupt, unknown or unmigratable entries yield the defaults. */
export function loadState<T>(spec: StorageSpec<T>): T {
  let raw: string | null
  try {
    raw = getStorage()?.getItem(spec.key) ?? null
  } catch {
    return spec.defaults()
  }
  if (raw === null) return spec.defaults()

  let envelope: unknown
  try {
    envelope = JSON.parse(raw)
  } catch {
    return spec.defaults()
  }
  if (!isEnvelope(envelope) || envelope.version > spec.version) return spec.defaults()

  let data = envelope.data
  for (let v = envelope.version; v < spec.version; v++) {
    const migrate = spec.migrations?.[v]
    if (!migrate) return spec.defaults()
    try {
      data = migrate(data)
    } catch {
      return spec.defaults()
    }
  }
  return spec.parse(data) ?? spec.defaults()
}

/** Saves data for `spec`; returns false if storage is unavailable or full. */
export function saveState<T>(spec: StorageSpec<T>, data: T): boolean {
  try {
    const storage = getStorage()
    if (!storage) return false
    const envelope: StoredEnvelope = { version: spec.version, data }
    storage.setItem(spec.key, JSON.stringify(envelope))
    return true
  } catch {
    return false
  }
}
