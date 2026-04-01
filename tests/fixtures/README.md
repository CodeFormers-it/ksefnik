# Test Fixtures

## Conventions

- All amounts in PLN
- All data is fictional but follows real Polish bank/KSeF formats
- NIP numbers use valid checksum unless explicitly testing invalid NIP
- Transactions are cross-referenced: the same invoices appear in bank statements and XML fixtures

## Directories

- `mt940/` — MT940 (SWIFT) bank statement files
- `csv/` — CSV bank exports (mBank, ING, PKO BP, Santander)
- `xml/` — KSeF FA(3) invoice XML files

## Cross-reference

| Invoice | Amount | Seller NIP | Appears in |
|---------|--------|-----------|------------|
| FV/2026/03/001 | 1 230,00 PLN | 5213456784 | MT940, all CSVs, invoice-simple.xml |
| FV/2026/03/003 | 7 800,00 PLN | 8971234561 | MT940, all CSVs, invoice-multi-line.xml |
| FV/2026/03/005 | 22 500,00 PLN | 7740001454 | MT940 (KSeF ref), ING, PKO, Santander |

## Invalid NIP fixture

- `xml/invoice-invalid-nip.xml` uses NIP `1234567890` which has an invalid checksum (expected for validation testing)
