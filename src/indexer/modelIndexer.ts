import * as path from 'path'
import * as fs from 'fs'
import { ModelEntry } from '../types'

const RAW_DIR = path.join(__dirname, '../../data/raw')

function scanDir(dir: string, baseDir: string, results: Record<string, ModelEntry>): void {
  try {
    const entries = fs.readdirSync(dir)
    for (const entry of entries) {
      const fullPath = path.join(dir, entry)
      try {
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) {
          scanDir(fullPath, baseDir, results)
        } else if (entry.endsWith('.step') || entry.endsWith('.wrl')) {
          const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/')
          results[relativePath] = { key: relativePath, absPath: fullPath }
        }
      } catch (e) {
        console.error(`Error processing ${fullPath}:`, e)
      }
    }
  } catch (e) {
    console.error(`Error scanning ${dir}:`, e)
  }
}

export function indexModels(): Record<string, ModelEntry> {
  const models: Record<string, ModelEntry> = {}
  const packages3DDir = path.join(RAW_DIR, 'kicad-packages3D')
  if (!fs.existsSync(packages3DDir)) {
    console.error('kicad-packages3D directory not found!')
    return models
  }
  scanDir(packages3DDir, packages3DDir, models)
  console.log(`Indexed ${Object.keys(models).length} models`)
  return models
}
