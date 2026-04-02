'use client'

import { useState, useMemo } from 'react'

// ---------------------------------------------------------------------------
// NIP checksum
// ---------------------------------------------------------------------------

const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7] as const

function isValidNipChecksum(nip: string): boolean {
  if (!/^\d{10}$/.test(nip)) return false
  const digits = nip.split('').map(Number)
  const sum = NIP_WEIGHTS.reduce((acc, w, i) => acc + w * digits[i], 0)
  return sum % 11 === digits[9]
}

// ---------------------------------------------------------------------------
// Validation rules
// ---------------------------------------------------------------------------

interface FormValues {
  invoiceNumber: string
  sellerNIP: string
  grossAmount: string // user-facing PLN string e.g. "1230,50"
  issueDate: string
  currency: string
}

interface Rule {
  id: number
  label: string
  check: (v: FormValues) => boolean
}

const rules: Rule[] = [
  {
    id: 1,
    label: 'Numer faktury wymagany (min 1 znak)',
    check: (v) => v.invoiceNumber.trim().length >= 1,
  },
  {
    id: 2,
    label: 'NIP sprzedawcy: 10 cyfr',
    check: (v) => /^\d{10}$/.test(v.sellerNIP),
  },
  {
    id: 3,
    label: 'NIP sprzedawcy: suma kontrolna',
    check: (v) => isValidNipChecksum(v.sellerNIP),
  },
  {
    id: 4,
    label: 'NIP \u2260 0000000000',
    check: (v) => v.sellerNIP !== '0000000000',
  },
  {
    id: 5,
    label: 'Kwota brutto > 0',
    check: (v) => {
      const n = parsePolishAmount(v.grossAmount)
      return n !== null && n > 0
    },
  },
  {
    id: 6,
    label: 'Kwota brutto \u2264 999\u00a0999,99 PLN',
    check: (v) => {
      const n = parsePolishAmount(v.grossAmount)
      return n !== null && n <= 99999999 // grosze
    },
  },
  {
    id: 7,
    label: 'Data wystawienia: format YYYY-MM-DD',
    check: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v.issueDate) && !isNaN(Date.parse(v.issueDate)),
  },
  {
    id: 8,
    label: 'Data wystawienia: nie z przysz\u0142o\u015bci',
    check: (v) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v.issueDate)) return false
      const d = new Date(v.issueDate)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      return d <= today
    },
  },
  {
    id: 9,
    label: 'Waluta: PLN',
    check: (v) => v.currency.toUpperCase() === 'PLN',
  },
  {
    id: 10,
    label: 'Numer faktury: max 256 znak\u00f3w',
    check: (v) => v.invoiceNumber.length <= 256,
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse Polish-style amount "1 230,50" → grosze (123050) */
function parsePolishAmount(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  if (isNaN(n)) return null
  return Math.round(n * 100)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const defaultValues: FormValues = {
  invoiceNumber: 'FV/2026/03/042',
  sellerNIP: '5213456789',
  grossAmount: '1 230,00',
  issueDate: '2026-03-15',
  currency: 'PLN',
}

export default function InvoiceValidatorPlayground() {
  const [values, setValues] = useState<FormValues>(defaultValues)

  const results = useMemo(() => rules.map((r) => ({ ...r, passed: r.check(values) })), [values])

  const passedCount = results.filter((r) => r.passed).length
  const allPassed = passedCount === rules.length

  function set<K extends keyof FormValues>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const groszePreview = useMemo(() => {
    const g = parsePolishAmount(values.grossAmount)
    return g !== null ? `${g} gr` : '—'
  }, [values.grossAmount])

  return (
    <div className="not-content my-8">
      <div className="text-center mb-5 space-y-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Walidator faktury — playground
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Edytuj pola, aby zobaczyc walidacj\u0119 w czasie rzeczywistym
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ---------- Left: Form ---------- */}
        <div className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-5">
          {/* Invoice number */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Numer faktury
            </label>
            <input
              type="text"
              value={values.invoiceNumber}
              onChange={set('invoiceNumber')}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Seller NIP */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              NIP sprzedawcy
            </label>
            <input
              type="text"
              value={values.sellerNIP}
              onChange={set('sellerNIP')}
              maxLength={10}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Gross amount */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Kwota brutto (PLN)
            </label>
            <div className="relative">
              <input
                type="text"
                value={values.grossAmount}
                onChange={set('grossAmount')}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-400 dark:text-gray-500">
                = {groszePreview}
              </span>
            </div>
          </div>

          {/* Issue date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Data wystawienia
            </label>
            <input
              type="text"
              value={values.issueDate}
              onChange={set('issueDate')}
              placeholder="YYYY-MM-DD"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Waluta
            </label>
            <input
              type="text"
              value={values.currency}
              onChange={set('currency')}
              maxLength={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono uppercase text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reset */}
          <button
            onClick={() => setValues(defaultValues)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Przywr\u00f3\u0107 domy\u015blne
          </button>
        </div>

        {/* ---------- Right: Rules checklist ---------- */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-5">
          {/* Header with counter */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Regu\u0142y walidacji</h4>
            <span
              className={`
                text-xs font-bold px-2 py-0.5 rounded-full
                ${allPassed
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}
              `}
            >
              {passedCount}/{rules.length}
            </span>
          </div>

          <ul className="space-y-2">
            {results.map((r) => (
              <li key={r.id} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex-shrink-0">
                  {r.passed ? (
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </span>
                <span
                  className={`text-sm transition-colors ${
                    r.passed
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-red-600 dark:text-red-400 font-medium'
                  }`}
                >
                  <span className="text-gray-400 dark:text-gray-500 font-mono mr-1.5 text-xs">
                    {String(r.id).padStart(2, '0')}
                  </span>
                  {r.label}
                </span>
              </li>
            ))}
          </ul>

          {/* Verdict */}
          <div
            className={`
              mt-5 rounded-lg p-3 text-center text-sm font-medium transition-colors
              ${
                allPassed
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
              }
            `}
          >
            {allPassed ? 'Faktura poprawna — gotowa do wys\u0142ania do KSeF' : 'Faktura zawiera b\u0142\u0119dy — popraw przed wys\u0142aniem'}
          </div>
        </div>
      </div>
    </div>
  )
}
