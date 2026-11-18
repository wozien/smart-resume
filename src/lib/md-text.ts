export function stripMd(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

export function splitBlocks(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
}

export function isListBlock(block: string) {
  return block.split('\n').every((line) => /^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line))
}

export function listItems(block: string) {
  return block
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*+]|\d+\.)\s+/, '').trim())
    .filter(Boolean)
}
