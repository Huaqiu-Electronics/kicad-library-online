import { gitSync } from '../src/sync/gitSync'
import { buildIndex } from '../src/indexer/buildIndex'

async function main() {
  console.log('Syncing libraries...')
  await gitSync()
  console.log('Building index...')
  await buildIndex()
  console.log('Index built successfully!')
}

main().catch(console.error)
