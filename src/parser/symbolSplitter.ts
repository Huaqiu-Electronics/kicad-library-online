export function splitSymbols(content: string): Array<{ name: string; body: string; offset: number; length: number; footprint?: string }> {
  const results: Array<{ name: string; body: string; offset: number; length: number; footprint?: string }> = []
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
    let footprint: string | undefined
    const fpMatch = body.match(/\(property\s+"Footprint"\s+"([^"]+)"\)/)
    if (fpMatch) {
      footprint = fpMatch[1]
    }
    results.push({ name, body, offset: start, length: j + 1 - start, footprint })
    i = j + 1
  }
  return results
}
