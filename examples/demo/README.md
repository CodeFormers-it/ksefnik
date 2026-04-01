# Ksefnik Demo

Quick demo showing KSeF invoice reconciliation with bank statements.

## Run

```bash
pnpm install
pnpm --filter @ksefnik/demo start
```

## What it does

1. Creates a KSeF simulator with sample invoices
2. Imports a bank statement (mBank CSV format)
3. Runs the 6-pass reconciliation pipeline
4. Prints matched/unmatched results with confidence scores
