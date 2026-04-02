'use client'

import { useState, useMemo } from 'react'

// ---------------------------------------------------------------------------
// NIP checksum (same as validator)
// ---------------------------------------------------------------------------

const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7] as const

function isValidNipChecksum(nip: string): boolean {
  if (!/^\d{10}$/.test(nip)) return false
  const digits = nip.split('').map(Number)
  const sum = NIP_WEIGHTS.reduce((acc, w, i) => acc + w * digits[i], 0)
  return sum % 11 === digits[9]
}

// ---------------------------------------------------------------------------
// Format detection
// ---------------------------------------------------------------------------

interface DetectedFormat {
  id: string
  name: string
  color: string
  bgClass: string
}

const FORMATS: Record<string, DetectedFormat> = {
  mt940: { id: 'mt940', name: 'MT940 (SWIFT)', color: 'blue', bgClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  mbank: { id: 'mbank', name: 'mBank CSV', color: 'red', bgClass: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
  ing: { id: 'ing', name: 'ING Bank CSV', color: 'orange', bgClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' },
  pkobp: { id: 'pkobp', name: 'PKO BP CSV', color: 'sky', bgClass: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300' },
  santander: { id: 'santander', name: 'Santander CSV', color: 'rose', bgClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' },
}

function detectFormat(content: string): DetectedFormat | null {
  if (!content.trim()) return null
  if (content.includes(':20:') && (content.includes(':60F:') || content.includes(':61:'))) return FORMATS.mt940
  if (content.includes('#Data operacji') && content.includes('#Opis operacji')) return FORMATS.mbank
  if (content.includes('"Data transakcji"') && content.includes('"Dane kontrahenta"')) return FORMATS.ing
  if (content.includes('"Data operacji"') && content.includes('"Typ transakcji"')) return FORMATS.pkobp
  if (/Data operacji;Data waluty;Tytu/.test(content)) return FORMATS.santander
  return null
}

// ---------------------------------------------------------------------------
// NIP extraction
// ---------------------------------------------------------------------------

interface ExtractedNip {
  nip: string
  valid: boolean
  context: string
}

function extractNips(content: string): ExtractedNip[] {
  const found = new Map<string, ExtractedNip>()

  // Pattern 1: NIP followed by 10 digits
  const nipLabelRe = /NIP[:\s]*(\d{10})/gi
  let m: RegExpExecArray | null
  while ((m = nipLabelRe.exec(content)) !== null) {
    const nip = m[1]
    if (!found.has(nip)) {
      const start = Math.max(0, m.index - 20)
      const end = Math.min(content.length, m.index + m[0].length + 20)
      found.set(nip, {
        nip,
        valid: isValidNipChecksum(nip),
        context: content.slice(start, end).replace(/\n/g, ' ').trim(),
      })
    }
  }

  // Pattern 2: standalone 10-digit numbers with valid checksum
  const rawDigitsRe = /\b(\d{10})\b/g
  while ((m = rawDigitsRe.exec(content)) !== null) {
    const nip = m[1]
    if (!found.has(nip) && isValidNipChecksum(nip)) {
      const start = Math.max(0, m.index - 20)
      const end = Math.min(content.length, m.index + m[0].length + 20)
      found.set(nip, {
        nip,
        valid: true,
        context: content.slice(start, end).replace(/\n/g, ' ').trim(),
      })
    }
  }

  return Array.from(found.values())
}

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const MBANK_SAMPLE = `#Data operacji;#Data waluty;#Opis operacji;#Tytuł;#Nadawca/Odbiorca;#Numer konta;#Kwota;#Saldo po operacji;
2026-03-05;2026-03-05;PRZELEW PRZYCHODZĄCY;Zapłata za FV/2026/03/001 NIP: 5213456789 TECHSOLUTIONS SP. Z O.O.;TECHSOLUTIONS SP. Z O.O.;PL61109010140000071219812874;1 230,00;45 678,90;
2026-03-07;2026-03-07;PRZELEW PRZYCHODZĄCY;Za usługi budowlane marzec 2026 NIP: 5260250995;BUDIMEX S.A.;PL27114020040000300201355387;15 000,00;60 678,90;
2026-03-10;2026-03-10;PRZELEW WYCHODZĄCY;Opłata za usługi cloud FV/2026/03/003;CLOUDWARE SP. Z O.O. NIP: 7811234567;PL98109023450000000131293456;-7 800,00;52 878,90;
2026-03-12;2026-03-12;PRZELEW WYCHODZĄCY;Kampania marketingowa Q1 2026;DIGITAL MEDIA SP. Z O.O.;PL44102011370000160200834255;-4 500,00;48 378,90;
2026-03-15;2026-03-15;PRZELEW WYCHODZĄCY;Materiały biurowe marzec;OFFICE PLUS SP. Z O.O. NIP 1234563218;PL55114020040000390270242389;-899,00;47 479,90;`

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BankFormatDetector() {
  const [content, setContent] = useState(MBANK_SAMPLE)

  const format = useMemo(() => detectFormat(content), [content])
  const nips = useMemo(() => extractNips(content), [content])

  const lineCount = useMemo(() => content.split('\n').filter((l) => l.trim()).length, [content])

  return (
    <div className="not-content my-8 space-y-5">
      {/* Header */}
      <div className="text-center space-y-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Detektor formatu wyci\u0105gu bankowego
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Wklej wyci\u0105g bankowy, aby automatycznie wykry\u0107 format i wyodr\u0119bni\u0107 NIP-y
        </p>
      </div>

      {/* Textarea with detected format badge */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          spellCheck={false}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-xs font-mono text-gray-800 dark:text-gray-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          placeholder="Wklej tutaj tre\u015b\u0107 wyci\u0105gu bankowego (MT940, CSV mBank, ING, PKO BP, Santander)..."
        />

        {/* Format badge */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {format ? (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${format.bgClass}`}>
              {format.name}
            </span>
          ) : content.trim() ? (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              Nierozpoznany format
            </span>
          ) : null}
        </div>

        {/* Line count */}
        <div className="absolute bottom-3 right-3 text-[10px] font-mono text-gray-400 dark:text-gray-500">
          {lineCount} {lineCount === 1 ? 'linia' : lineCount < 5 ? 'linie' : 'linii'}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setContent(MBANK_SAMPLE)}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Wczytaj przyk\u0142ad mBank
        </button>
        <button
          onClick={() => setContent('')}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Wyczy\u015b\u0107
        </button>
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Detected format card */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-5">
          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">Wykryty format</h4>
          {format ? (
            <div className="space-y-3">
              <div className={`inline-flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-lg ${format.bgClass}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {format.name}
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">ID parsera:</span>{' '}
                  <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[11px]">{format.id}</code>
                </p>
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Obs\u0142ugiwane formaty:</span>{' '}
                  MT940, mBank, ING, PKO BP, Santander
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">
              {content.trim() ? 'Nie uda\u0142o si\u0119 rozpozna\u0107 formatu' : 'Wklej wyci\u0105g, aby wykry\u0107 format'}
            </p>
          )}
        </div>

        {/* Extracted NIPs card */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Wykryte NIP-y</h4>
            {nips.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                {nips.length}
              </span>
            )}
          </div>

          {nips.length > 0 ? (
            <ul className="space-y-2.5">
              {nips.map((n) => (
                <li key={n.nip} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex-shrink-0">
                    {n.valid ? (
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">
                        {n.nip}
                      </code>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          n.valid
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        }`}
                      >
                        {n.valid ? 'poprawny' : 'b\u0142\u0119dna suma kontrolna'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono mt-0.5 truncate">
                      ...{n.context}...
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">
              {content.trim() ? 'Nie znaleziono NIP-\u00f3w' : 'Wklej wyci\u0105g, aby wyodr\u0119bni\u0107 NIP-y'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
