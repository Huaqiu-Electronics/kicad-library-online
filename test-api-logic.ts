import { buildIndex } from './src/indexer/buildIndex'
import { setIndex, getIndex } from './src/store/indexStore'
import { parseLibId } from './src/parser/libId'
import * as fs from 'fs'

async function test() {
  const index = await buildIndex()
  setIndex(index)
  const loadedIndex = getIndex()
  console.log('Index loaded:', !!loadedIndex)
  if (!loadedIndex) {
    console.error('No index loaded!')
    return
  }
  const libIdStr = 'Device:R'
  const libId = parseLibId(libIdStr)
  console.log('Parsed libId:', libId)
  if (!libId) {
    console.error('Invalid libId')
    return
  }
  const symbolKey = `${libId.library}:${libId.item}`
  console.log('Symbol key:', symbolKey)
  console.log('Symbol exists:', !!loadedIndex.symbols[symbolKey])
  console.log('Symbol entry:', loadedIndex.symbols[symbolKey])
  
  // Test loadSymbol
  const symbolEntry = loadedIndex.symbols[symbolKey]
  const fd = fs.openSync(symbolEntry.file, 'r')
  const buffer = Buffer.alloc(symbolEntry.length)
  fs.readSync(fd, buffer, 0, symbolEntry.length, symbolEntry.offset)
  fs.closeSync(fd)
  const symbolContent = buffer.toString('utf-8')
  console.log('Symbol content length:', symbolContent.length)
  console.log('First 200 chars of symbol content:', symbolContent.slice(0, 200))
}

test().catch(console.error)
