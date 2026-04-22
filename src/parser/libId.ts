import { LibId } from '../types'

export function parseLibId(libIdStr: string): LibId | null {
  const colonIndex = libIdStr.indexOf(':')
  if (colonIndex === -1) return null
  const library = libIdStr.slice(0, colonIndex)
  const item = libIdStr.slice(colonIndex + 1)
  if (!library || !item) return null
  if (library.includes('/') || library.includes('\\')) return null
  return { library, item }
}
