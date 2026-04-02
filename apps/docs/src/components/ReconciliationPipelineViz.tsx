'use client'

import { useState, useMemo } from 'react'

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

interface Invoice {
  number: string
  amount: number // grosze
  seller: string
  nip: string
}

interface Transaction {
  id: string
  amount: number // grosze
  title: string
  date: string
  counterparty: string
}

interface Match {
  invoiceNumber: string
  transactionId: string
  confidence: number
}

interface Pass {
  name: string
  label: string
  order: number
  description: string
  matches: Match[]
  color: string
}

const invoices: Invoice[] = [
  { number: 'FV/2026/03/001', amount: 123000, seller: 'TECHSOLUTIONS SP. Z O.O.', nip: '5213456789' },
  { number: 'FV/2026/03/002', amount: 1500000, seller: 'BUDIMEX S.A.', nip: '5260300tried' },
  { number: 'FV/2026/03/003', amount: 780000, seller: 'CLOUDWARE SP. Z O.O.', nip: '7811234567' },
  { number: 'FV/2026/03/004', amount: 450000, seller: 'DIGITAL MEDIA SP. Z O.O.', nip: '1132456789' },
  { number: 'FV/2026/03/005', amount: 2250000, seller: 'PKN ORLEN S.A.', nip: '7740001454' },
]

const transactions: Transaction[] = [
  { id: 'TX-001', amount: 123000, title: 'KSeF:2026030100001 FV/2026/03/001 TECHSOLUTIONS', date: '2026-03-05', counterparty: 'TECHSOLUTIONS SP. Z O.O.' },
  { id: 'TX-002', amount: 1500000, title: 'Zapłata za fakturę BUDIMEX', date: '2026-03-07', counterparty: 'BUDIMEX S.A.' },
  { id: 'TX-003', amount: 780000, title: 'FV/2026/03/003 usługi cloud', date: '2026-03-10', counterparty: 'CLOUDWARE SP. Z O.O.' },
  { id: 'TX-004', amount: 450000, title: 'Dig.Media — kampania Q1', date: '2026-03-12', counterparty: 'DIGITAL MEDIA SPZOO' },
  { id: 'TX-005', amount: 89900, title: 'Przelew za materiały biurowe', date: '2026-03-15', counterparty: 'OFFICE PLUS SP. Z O.O.' },
  { id: 'TX-006', amount: 34500, title: 'Opłata za hosting', date: '2026-03-18', counterparty: 'OVH SP. Z O.O.' },
  { id: 'TX-007', amount: 567000, title: 'Wpłata od klienta ABC', date: '2026-03-20', counterparty: 'ABC TRADING SP. Z O.O.' },
]

const passes: Pass[] = [
  {
    name: 'ksef-ref',
    label: 'Referencja KSeF',
    order: 50,
    description: 'Dopasowanie po numerze referencyjnym KSeF w tytule przelewu',
    matches: [{ invoiceNumber: 'FV/2026/03/001', transactionId: 'TX-001', confidence: 99 }],
    color: 'emerald',
  },
  {
    name: 'exact-nip',
    label: 'Dokładny NIP + kwota',
    order: 100,
    description: 'Dopasowanie po NIP kontrahenta i dokładnej kwocie',
    matches: [{ invoiceNumber: 'FV/2026/03/002', transactionId: 'TX-002', confidence: 95 }],
    color: 'sky',
  },
  {
    name: 'invoice-ref',
    label: 'Numer faktury',
    order: 200,
    description: 'Wyszukiwanie numeru faktury w tytule przelewu',
    matches: [{ invoiceNumber: 'FV/2026/03/003', transactionId: 'TX-003', confidence: 90 }],
    color: 'violet',
  },
  {
    name: 'fuzzy',
    label: 'Fuzzy matching',
    order: 300,
    description: 'Rozmyte dopasowanie nazw kontrahentów i kwot z tolerancją',
    matches: [{ invoiceNumber: 'FV/2026/03/004', transactionId: 'TX-004', confidence: 80 }],
    color: 'amber',
  },
  {
    name: 'partial',
    label: 'Częściowe',
    order: 400,
    description: 'Dopasowanie częściowych wpłat do faktur',
    matches: [],
    color: 'orange',
  },
  {
    name: 'proximity',
    label: 'Bliskość dat',
    order: 500,
    description: 'Dopasowanie po bliskości dat i podobieństwa kwot',
    matches: [],
    color: 'rose',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPLN(grosze: number): string {
  return (grosze / 100).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })
}

function confidenceBadge(confidence: number): string {
  if (confidence >= 95) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
  if (confidence >= 85) return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300'
  if (confidence >= 70) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
  return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReconciliationPipelineViz() {
  const [selectedPass, setSelectedPass] = useState<string | null>(null)

  const allMatches = useMemo(() => passes.flatMap((p) => p.matches), [])

  const matchedInvoices = useMemo(
    () => new Set(allMatches.map((m) => m.invoiceNumber)),
    [allMatches],
  )

  const matchedTransactions = useMemo(
    () => new Set(allMatches.map((m) => m.transactionId)),
    [allMatches],
  )

  const summary = useMemo(
    () => ({
      matched: matchedInvoices.size,
      unmatchedInvoices: invoices.length - matchedInvoices.size,
      unmatchedTransactions: transactions.length - matchedTransactions.size,
    }),
    [matchedInvoices, matchedTransactions],
  )

  const selected = passes.find((p) => p.name === selectedPass)

  // Cumulative matched set up to and including a given pass
  const matchedUpTo = useMemo(() => {
    const map = new Map<string, Set<string>>()
    const running = new Set<string>()
    for (const p of passes) {
      for (const m of p.matches) running.add(m.invoiceNumber)
      map.set(p.name, new Set(running))
    }
    return map
  }, [])

  return (
    <div className="not-content my-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Pipeline rekoncyliacji — 6 przejść
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Kliknij przejście, aby zobaczyć dopasowane pary
        </p>
      </div>

      {/* Pipeline cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {passes.map((pass) => {
          const isSelected = selectedPass === pass.name
          const matched = matchedUpTo.get(pass.name)!
          return (
            <button
              key={pass.name}
              onClick={() => setSelectedPass(isSelected ? null : pass.name)}
              className={`
                relative rounded-xl border-2 p-3 text-left transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                dark:focus:ring-offset-gray-900
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-400 shadow-lg scale-[1.03]'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                }
              `}
            >
              {/* Order badge */}
              <span className="absolute -top-2.5 -right-2 text-[10px] font-mono bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full px-1.5 py-0.5">
                #{pass.order}
              </span>

              {/* Pass name */}
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1 leading-tight">
                {pass.label}
              </div>

              {/* Match count */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`
                    inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                    ${
                      pass.matches.length > 0
                        ? `bg-${pass.color}-100 text-${pass.color}-700 dark:bg-${pass.color}-900/40 dark:text-${pass.color}-300`
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                    }
                  `}
                >
                  {pass.matches.length}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {pass.matches.length === 1 ? 'dopasowanie' : 'dopasowań'}
                </span>
              </div>

              {/* Cumulative progress bar */}
              <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-500"
                  style={{ width: `${(matched.size / invoices.length) * 100}%` }}
                />
              </div>
              <div className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                {matched.size}/{invoices.length} łącznie
              </div>
            </button>
          )
        })}
      </div>

      {/* Connector line (decorative) */}
      <div className="hidden lg:flex items-center justify-center -mt-4 -mb-2 px-8">
        <div className="flex-1 h-0.5 bg-gradient-to-r from-emerald-400 via-sky-400 to-rose-400 rounded-full opacity-30" />
      </div>

      {/* Expanded pass detail */}
      {selected && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-5 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                {selected.label}
                <span className="ml-2 text-xs font-mono text-gray-400">order: {selected.order}</span>
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{selected.description}</p>
            </div>
            <button
              onClick={() => setSelectedPass(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              aria-label="Zamknij"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {selected.matches.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">
              Brak dopasowań w tym przejściu
            </p>
          ) : (
            <div className="space-y-2">
              {selected.matches.map((match) => {
                const inv = invoices.find((i) => i.number === match.invoiceNumber)!
                const tx = transactions.find((t) => t.id === match.transactionId)!
                return (
                  <div
                    key={match.invoiceNumber}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/80"
                  >
                    {/* Invoice side */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {inv.number}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {inv.seller} &middot; {formatPLN(inv.amount)}
                      </div>
                    </div>

                    {/* Arrow + confidence */}
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <svg className="w-5 h-5 text-gray-300 dark:text-gray-600 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${confidenceBadge(match.confidence)}`}>
                        {match.confidence}%
                      </span>
                    </div>

                    {/* Transaction side */}
                    <div className="flex-1 min-w-0 text-right sm:text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {tx.id}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {tx.title}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Invoice status list */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-5">
        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">Status faktur</h4>
        <div className="space-y-1.5">
          {invoices.map((inv) => {
            const match = allMatches.find((m) => m.invoiceNumber === inv.number)
            const isMatched = !!match
            return (
              <div
                key={inv.number}
                className="flex items-center gap-3 text-sm"
              >
                <span
                  className={`
                    w-2.5 h-2.5 rounded-full flex-shrink-0
                    ${isMatched ? 'bg-emerald-500' : 'bg-red-400'}
                  `}
                />
                <span className="font-mono text-xs text-gray-600 dark:text-gray-300 w-36 truncate">
                  {inv.number}
                </span>
                <span className="text-gray-500 dark:text-gray-400 flex-1 truncate text-xs">
                  {inv.seller}
                </span>
                <span className="font-medium text-gray-700 dark:text-gray-200 text-xs whitespace-nowrap">
                  {formatPLN(inv.amount)}
                </span>
                {match ? (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${confidenceBadge(match.confidence)}`}>
                    {match.confidence}%
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    brak
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3">
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{summary.matched}</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400">dopasowanych faktur</div>
        </div>
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3">
          <div className="text-2xl font-bold text-red-700 dark:text-red-300">{summary.unmatchedInvoices}</div>
          <div className="text-xs text-red-600 dark:text-red-400">niedopasowanych faktur</div>
        </div>
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{summary.unmatchedTransactions}</div>
          <div className="text-xs text-amber-600 dark:text-amber-400">niedopasowanych transakcji</div>
        </div>
      </div>
    </div>
  )
}
