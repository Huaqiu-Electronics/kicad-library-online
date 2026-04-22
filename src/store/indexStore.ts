import { GlobalIndex } from '../types'

let index: GlobalIndex | null = null

export function setIndex(newIndex: GlobalIndex): void {
  index = newIndex
}

export function getIndex(): GlobalIndex | null {
  return index
}
