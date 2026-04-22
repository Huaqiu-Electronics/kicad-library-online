import * as path from 'path'
import * as fs from 'fs'
import { GlobalIndex } from '../types'
import { indexSymbols } from './symbolIndexer'
import { indexFootprints } from './footprintIndexer'
import { indexModels } from './modelIndexer'

const INDEX_DIR = path.join(__dirname, '../../data/index')
const INDEX_FILE = path.join(INDEX_DIR, 'index.json')

export async function buildIndex(): Promise<GlobalIndex> {
  if (!fs.existsSync(INDEX_DIR)) {
    fs.mkdirSync(INDEX_DIR, { recursive: true })
  }

  if (fs.existsSync(INDEX_FILE)) {
    console.log('Index already exists, loading...')
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8')) as GlobalIndex
  }

  console.log('Building index...')
  const symbols = indexSymbols()
  const footprints = indexFootprints()
  const models = indexModels()

  const index: GlobalIndex = { symbols, footprints, models }

  fs.writeFileSync(INDEX_FILE, JSON.stringify(index), 'utf-8')
  console.log('Index built and saved!')
  return index
}
