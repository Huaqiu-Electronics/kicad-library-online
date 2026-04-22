import { startServer } from './api/server'

async function main() {
  await startServer()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
