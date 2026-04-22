# kicad-library-online

A high-performance, Dockerized backend service for serving KiCad components (symbol, footprint, 3D model) via a simple HTTP API using `LIB_ID`.

---

## 🚀 Overview

This project builds a local mirror of the official KiCad libraries and exposes them as an API.

### Features

- 🔄 Syncs latest KiCad libraries from GitLab
- ⚡ Pre-indexed for O(1) lookup
- 🧠 Zero parsing during request handling
- 📦 Supports:
  - Symbols (`.kicad_sym`)
  - Footprints (`.kicad_mod`)
  - 3D Models (`.step`, `.wrl`)
- 🐳 Fully Dockerized

---

## 📦 Data Sources

- https://gitlab.com/kicad/libraries/kicad-symbols.git
- https://gitlab.com/kicad/libraries/kicad-footprints.git
- https://gitlab.com/kicad/libraries/kicad-packages3D.git

---

## 🧠 LIB_ID Format

```
library:item
```

Example:

```
Device:R_0805
```

---

## 🏗️ Architecture

```
Git Repos → Raw Files → Index Builder → Indexed Data → API Server
```

---

## 📁 Project Structure

```
kicad-library-online/
├── src/
│   ├── sync/
│   ├── parser/
│   ├── indexer/
│   ├── store/
│   ├── api/
│   └── types.ts
├── data/
│   ├── raw/
│   ├── index/
├── Dockerfile
```

---

## 🔄 Library Sync

Clones repositories into:

```
data/raw/
```

Uses shallow clone:

```
git clone --depth 1 <repo>
```

Supports re-running safely (idempotent).

---

## ⚠️ Symbol Storage Model (IMPORTANT)

- `.kicad_sym` files are **library containers**
- Each file may contain:
  - one symbol
  - multiple symbols

👉 Therefore:

- Symbols are extracted during indexing
- Each symbol is treated as an independent entity

---

## 🧩 Index Design

### Global Index

```ts
type GlobalIndex = {
  symbols: Record<string, SymbolEntry>
  footprints: Record<string, FootprintEntry>
  models: Record<string, ModelEntry>
}
```

---

### Symbol Entry (Offset-Based)

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

### Footprint Entry

```ts
type FootprintEntry = {
  key: string
  path: string
  model?: string
}
```

---

### Model Entry

```ts
type ModelEntry = {
  key: string
  absPath: string
}
```

---

## ⚡ Performance Design

- O(1) lookup using flattened keys
- No parsing during request handling
- Symbol content loaded via file slicing
- Index precomputed at startup

---

## 🔧 Indexing Pipeline

1. Scan symbol libraries
2. Split symbols from `.kicad_sym`
3. Extract footprint references
4. Index footprints from `.pretty`
5. Index 3D models
6. Resolve relationships

---

## 🌐 API

### Get Component

```
GET /component?lib_id=Device:R_0805
```

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

## ⚠️ Edge Cases

| Case | Behavior |
|------|--------|
| Invalid LIB_ID | 400 |
| Symbol not found | 404 |
| Footprint missing | null |
| 3D model missing | null |

---

## 🐳 Docker

### Build

```
docker build -t kicad-library-online .
```

---

### Run

```
docker run -p 3000:3000 kicad-library-online
```

---

## 📊 Performance Notes

- Offset-based reading reduces memory usage
- Index loaded once at startup

---

## 📄 License

MIT
