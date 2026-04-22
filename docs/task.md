
# Task: Build High-Performance KiCad Library Online Server (Node.js + Docker)

## Goal

Build a high-performance backend service that:

1. Pulls the latest official KiCad libraries from GitLab referring to their referenced tag in the build-configs.json:
   - https://gitlab.com/kicad/libraries/kicad-symbols.git
   - https://gitlab.com/kicad/libraries/kicad-footprints.git
   - https://gitlab.com/kicad/libraries/kicad-packages3D.git

2. Indexes:
   - symbols (from `.kicad_sym`)
   - footprints (from `.pretty/*.kicad_mod`)
   - 3D models (from `.step`, `.wrl`)

3. Exposes an HTTP API:
   - Input: `LIB_ID` (e.g. `Device:R_0805`)
   - Output: symbol + optional footprint + optional 3D model

4. Must be optimized for:
   - O(1) lookup
   - minimal memory usage
   - no parsing during request handling

---

## Key Insight (IMPORTANT)

KiCad symbol libraries:

- Each `.kicad_sym` file contains MANY symbols
- Symbols are NOT stored as individual files
- The file is already a packaged/merged artifact

Therefore:

- You MUST split symbols during indexing
- You MUST NOT parse `.kicad_sym` at request time

---

## System Architecture

### Data Flow

```

Git Repos → Raw Files → Index Builder → Indexed Data → API Server

```

---

## Project Structure

```

kicad-library-online/
├── src/
│   ├── sync/
│   │   └── gitSync.ts
│   ├── parser/
│   │   ├── libId.ts
│   │   ├── symbolSplitter.ts
│   ├── indexer/
│   │   ├── buildIndex.ts
│   │   ├── symbolIndexer.ts
│   │   ├── footprintIndexer.ts
│   │   ├── modelIndexer.ts
│   ├── store/
│   │   └── indexStore.ts
│   ├── api/
│   │   └── server.ts
│   └── types.ts
├── data/
│   ├── raw/
│   ├── index/
├── Dockerfile

````

---

## 1. Library Sync

Clone or update repositories:

```bash
git clone --depth 1 https://gitlab.com/kicad/libraries/kicad-symbols.git
git clone --depth 1 https://gitlab.com/kicad/libraries/kicad-footprints.git
git clone --depth 1 https://gitlab.com/kicad/libraries/kicad-packages3D.git
````

Requirements:

* idempotent
* support updates (git pull)
* store in `/data/raw/`

---

## 2. LIB_ID Parsing

Format:

```
library:item
```

Rules:

* split on first `:`
* both parts must exist
* reject invalid characters (`/`, `:` in library)

Type:

```ts
type LibId = {
  library: string
  item: string
}
```

---

## 3. Symbol Indexing (CRITICAL)

### Input

```
kicad-symbols/*.kicad_sym
```

### Problem

Each file contains MANY symbols.

### Solution

Split symbols using a **parentheses-aware parser**, not naive regex.

---

### Symbol Splitting Algorithm

* find `(symbol "NAME"`
* track parentheses depth
* extract full block

---

### Implementation

```ts
export function splitSymbols(content: string) {
  const results = []

  let i = 0
  while (i < content.length) {
    const start = content.indexOf('(symbol "', i)
    if (start === -1) break

    const nameStart = start + 9
    const nameEnd = content.indexOf('"', nameStart)
    const name = content.slice(nameStart, nameEnd)

    let depth = 0
    let j = start

    while (j < content.length) {
      if (content[j] === '(') depth++
      else if (content[j] === ')') depth--

      if (depth === 0) break
      j++
    }

    const body = content.slice(start, j + 1)

    results.push({ name, body, offset: start, length: j + 1 - start })

    i = j + 1
  }

  return results
}
```

---

### Symbol Index Entry (IMPORTANT: Use Offsets)

```ts
type SymbolEntry = {
  lib: string
  name: string
  file: string
  offset: number
  length: number
  footprint?: string
}
```

---

### Extract Footprint Reference

Example inside symbol:

```
(property "Footprint" "Resistor_SMD:R_0805_2012Metric")
```

---

## 4. Footprint Indexing

### Input

```
*.pretty/*.kicad_mod
```

### Strategy

* filename = footprint name
* parse model reference

```ts
(model "Resistor_SMD.3dshapes/R_0805.step")
```

---

### Footprint Entry

```ts
type FootprintEntry = {
  key: string   // "Resistor_SMD:R_0805_2012Metric"
  path: string
  model?: string
}
```

---

## 5. 3D Model Index

Scan:

```
packages3D/**/*.step
packages3D/**/*.wrl
```

---

### Model Entry

```ts
type ModelEntry = {
  key: string   // relative path
  absPath: string
}
```

---

## 6. Global Index

Use flattened keys:

```ts
type GlobalIndex = {
  symbols: Record<string, SymbolEntry>
  footprints: Record<string, FootprintEntry>
  models: Record<string, ModelEntry>
}
```

Key format:

```
Device:R_0805
Resistor_SMD:R_0805_2012Metric
```

---

## 7. Index Build Pipeline

Steps:

1. index symbols
2. index footprints
3. index models
4. resolve symbol → footprint → model

---

## 8. Runtime Loading

Load index once:

```ts
const index = JSON.parse(fs.readFileSync('index.json', 'utf-8'))
```

---

## 9. API Server

### Endpoint

```
GET /component?lib_id=Device:R_0805
```

---

### Logic

1. parse LIB_ID
2. lookup symbol
3. resolve footprint
4. resolve model

---

### Response

```json
{
  "lib_id": "Device:R_0805",
  "symbol": "...",
  "footprint": "...",
  "model": "..."
}
```

---

## 10. Lazy Symbol Loading (IMPORTANT)

Use offset-based reading:

```ts
function loadSymbol(entry) {
  const fd = fs.openSync(entry.file, 'r')
  const buffer = Buffer.alloc(entry.length)

  fs.readSync(fd, buffer, 0, entry.length, entry.offset)

  return buffer.toString('utf-8')
}
```

---

## 11. Performance Requirements

* O(1) lookup
* no parsing during request
* minimal memory footprint
* startup builds index once

---

## 12. Docker

### Requirements

* Node.js 20
* git installed

### Startup flow

1. sync repos
2. build index (if not exists)
3. start server

---

## 13. Edge Cases

* invalid LIB_ID → 400
* symbol not found → 404
* missing footprint → null
* missing 3D → null

---

## 14. Bonus (Optional)

* `/search?q=R_0805`
* `/libraries`
* caching (LRU)
* binary index (msgpack or v8.serialize)

---

## Final Notes

* Treat symbol as source of truth
* footprint + 3D are best-effort
* KiCad libraries are loosely coupled
* robustness > strict correctness


## IMPORTANT

You can always dig into the actual file content for symbol, footprint and 3d to see what's going on.
You can always dig into the kicad source code as well.
ALl the repositories have been cloned and synced locally.
For all the files especially the symbol , KiCad has refactored the file to single file only containing one symbol , you'd confirm the fact by looking at the file content.