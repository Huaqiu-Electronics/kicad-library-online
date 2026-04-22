export type LibId = {
  library: string
  item: string
}

export type SymbolEntry = {
  lib: string
  name: string
  file: string
  offset: number
  length: number
  footprint?: string
}

export type FootprintEntry = {
  key: string
  path: string
  model?: string
}

export type ModelEntry = {
  key: string
  absPath: string
}

export type GlobalIndex = {
  symbols: Record<string, SymbolEntry>
  footprints: Record<string, FootprintEntry>
  models: Record<string, ModelEntry>
}

export type ComponentResponse = {
  lib_id: string
  symbol: string
  footprint: string | null
  model: string | null
}
