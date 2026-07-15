---
"@blobscan/db": patch
---

Drop the unused `inserted_at` indexes

No application query filters or orders by `inserted_at` on `address`,
`blob`, `block`, or `transaction`, and production index statistics show
zero scans over the database's entire lifetime while the four indexes
occupied ~635 MB combined and added maintenance work to every insert.
