import express from 'express'
import * as fs from 'fs'
import * as path from 'path'
import { parseLibId } from '../parser/libId'
import { GlobalIndex, ComponentResponse } from '../types'
import { buildIndex } from '../indexer/buildIndex'
import { gitSync } from '../sync/gitSync'

const app = express()
const PORT = 3000

const INDEX_PATH = path.join(__dirname, '../../data/index/index.json')
let index: GlobalIndex | null = null

function loadSymbol(file: string, offset: number, length: number): string {
  const fd = fs.openSync(file, 'r')
  const buffer = Buffer.alloc(length)
  fs.readSync(fd, buffer, 0, length, offset)
  fs.closeSync(fd)
  return buffer.toString('utf-8')
}

app.get('/component', (req, res) => {
  const libIdStr = req.query.lib_id as string
  console.log('Received request for lib_id:', libIdStr)
  if (!libIdStr) {
    return res.status(400).json({ error: 'lib_id is required' })
  }
  const libId = parseLibId(libIdStr)
  console.log('Parsed libId:', libId)
  if (!libId) {
    return res.status(400).json({ error: 'invalid lib_id format' })
  }
  if (!index) {
    return res.status(500).json({ error: 'index not loaded' })
  }
  console.log('Index symbols keys:', Object.keys(index.symbols).slice(0, 10))
  const symbolKey = `${libId.library}:${libId.item}`
  console.log('Looking for symbol key:', symbolKey)
  const symbolEntry = index.symbols[symbolKey]
  console.log('Symbol entry:', symbolEntry)
  if (!symbolEntry) {
    return res.status(404).json({ error: 'symbol not found' })
  }
  const symbol = loadSymbol(symbolEntry.file, symbolEntry.offset, symbolEntry.length)
  let footprint: string | null = null
  let model: string | null = null
  if (symbolEntry.footprint) {
    const fpEntry = index.footprints[symbolEntry.footprint]
    if (fpEntry) {
      footprint = fs.readFileSync(fpEntry.path, 'utf-8')
      if (fpEntry.model) {
        const modelEntry = index.models[fpEntry.model]
        if (modelEntry) {
          model = fs.readFileSync(modelEntry.absPath, 'utf-8')
        }
      }
    }
  }
  const response: ComponentResponse = {
    lib_id: libIdStr,
    symbol,
    footprint,
    model
  }
  console.log('Sending response')
  res.json(response)
})

export async function startServer(): Promise<void> {
  await gitSync()
  // Always rebuild index to make sure it's fresh!
  if (fs.existsSync(INDEX_PATH)) {
    fs.unlinkSync(INDEX_PATH)
  }
  index = await buildIndex()
  console.log('Index built and loaded, symbols count:', Object.keys(index.symbols).length)
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}
