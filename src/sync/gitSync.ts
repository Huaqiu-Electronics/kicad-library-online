import { execSync } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as config from '../../build-configs.json'

const RAW_DIR = path.join(__dirname, '../../data/raw')

export async function gitSync(): Promise<void> {
  if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR, { recursive: true })
  }

  const repos = [
    { url: 'https://gitlab.com/kicad/libraries/kicad-symbols.git', dir: 'kicad-symbols', ref: config.sources.symbols.ref },
    { url: 'https://gitlab.com/kicad/libraries/kicad-footprints.git', dir: 'kicad-footprints', ref: config.sources.footprints.ref },
    { url: 'https://gitlab.com/kicad/libraries/kicad-packages3D.git', dir: 'kicad-packages3D', ref: config.sources['3dmodels'].ref },
  ]

  for (const repo of repos) {
    const repoPath = path.join(RAW_DIR, repo.dir)
    if (fs.existsSync(repoPath)) {
      console.log(`Pulling ${repo.dir}...`)
      try {
        execSync(`git fetch origin ${repo.ref} && git checkout ${repo.ref}`, { cwd: repoPath, stdio: 'inherit' })
      } catch (e) {
        console.log(`Pull failed for ${repo.dir}, proceeding...`)
      }
    } else {
      console.log(`Cloning ${repo.dir} with ref ${repo.ref}...`)
      execSync(`git clone --depth 1 --branch ${repo.ref} ${repo.url} ${repoPath}`, { cwd: RAW_DIR, stdio: 'inherit' })
    }
  }
}
