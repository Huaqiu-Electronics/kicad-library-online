import * as path from 'path'
import * as fs from 'fs'
import { splitSymbols } from '../parser/symbolSplitter'
import { SymbolEntry } from '../types'

const RAW_DIR = path.join(__dirname, '../../data/raw')

export function indexSymbols(): Record<string, SymbolEntry> {
  const symbols: Record<string, SymbolEntry> = {}
  const symbolsDir = path.join(RAW_DIR, 'kicad-symbols')
  if (!fs.existsSync(symbolsDir)) {
    console.error('kicad-symbols directory not found!')
    return symbols
  }
  const symdirs = fs.readdirSync(symbolsDir).filter((f) => f.endsWith('.kicad_symdir'))
  for (const symdir of symdirs) {
    const libName = path.basename(symdir, '.kicad_symdir')
    const symdirPath = path.join(symbolsDir, symdir)
    const stat = fs.statSync(symdirPath)
    if (!stat.isDirectory()) continue
    const symFiles = fs.readdirSync(symdirPath).filter((f) => f.endsWith('.kicad_sym'))
    for (const symFile of symFiles) {
      const filePath = path.join(symdirPath, symFile)
      const content = fs.readFileSync(filePath, 'utf-8')
      const splitResults = splitSymbols(content)
      for (const res of splitResults) {
        const key = `${libName}:${res.name}`
        symbols[key] = {
          lib: libName,
          name: res.name,
          file: filePath,
          offset: res.offset,
          length: res.length,
          footprint: res.footprint
        }
      }
    }
  }
  console.log(`Indexed ${Object.keys(symbols).length} symbols`)
  return symbols
}
