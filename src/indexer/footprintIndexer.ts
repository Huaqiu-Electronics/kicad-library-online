import * as path from 'path'
import * as fs from 'fs'
import { FootprintEntry } from '../types'

const RAW_DIR = path.join(__dirname, '../../data/raw')

export function indexFootprints(): Record<string, FootprintEntry> {
  const footprints: Record<string, FootprintEntry> = {}
  const footprintsDir = path.join(RAW_DIR, 'kicad-footprints')
  if (!fs.existsSync(footprintsDir)) {
    console.error('kicad-footprints directory not found!')
    return footprints
  }
  const prettyDirs = fs.readdirSync(footprintsDir).filter((d) => d.endsWith('.pretty'))
  for (const prettyDir of prettyDirs) {
    const libName = path.basename(prettyDir, '.pretty')
    const prettyPath = path.join(footprintsDir, prettyDir)
    const stat = fs.statSync(prettyPath)
    if (!stat.isDirectory()) continue
    const modFiles = fs.readdirSync(prettyPath).filter((f) => f.endsWith('.kicad_mod'))
    for (const modFile of modFiles) {
      const itemName = path.basename(modFile, '.kicad_mod')
      const key = `${libName}:${itemName}`
      const filePath = path.join(prettyPath, modFile)
      let model: string | undefined
      const content = fs.readFileSync(filePath, 'utf-8')
      const modelMatch = content.match(/\(model\s+"([^"]+)"\)/)
      if (modelMatch) {
        model = modelMatch[1]
      }
      footprints[key] = { key, path: filePath, model }
    }
  }
  console.log(`Indexed ${Object.keys(footprints).length} footprints`)
  return footprints
}
