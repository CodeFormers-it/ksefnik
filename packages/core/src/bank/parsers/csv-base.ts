export function parseCSV(content: string, delimiter: string = ';'): string[][] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0)
  return lines.map((line) => parseCsvLine(line, delimiter))
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === delimiter) {
        fields.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }
  fields.push(current.trim())

  return fields
}

export function stripBOM(content: string): string {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content
}

export function parseAmount(text: string): number {
  // Handle both "1230,00" and "1230.00" and "+1230,00" / "-1230,00"
  const cleaned = text.replace(/\s/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return Math.round(num * 100)
}
