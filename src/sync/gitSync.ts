import * as path from 'path'
import * as fs from 'fs'

const RAW_DIR = path.join(__dirname, '../../data/raw')
const PARENT_DIR = path.join(__dirname, '../../../')

export async function gitSync(): Promise<void> {
  if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR, { recursive: true })
  }

  const repos = [
    { dir: 'kicad-symbols' },
    { dir: 'kicad-footprints' },
    { dir: 'kicad-packages3D' },
  ]

  for (const repo of repos) {
    const srcPath = path.join(PARENT_DIR, repo.dir)
    const destPath = path.join(RAW_DIR, repo.dir)
    if (!fs.existsSync(destPath)) {
      console.log(`Linking ${repo.dir} from parent directory...`)
      fs.symlinkSync(srcPath, destPath, 'dir')
    }
  }
}
