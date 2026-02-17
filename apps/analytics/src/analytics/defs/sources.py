import dagster as dg

transaction = dg.AssetSpec("transaction")
block = dg.AssetSpec("block")
address = dg.AssetSpec("address")
blob = dg.AssetSpec("blob")
blobs_on_transactions = dg.AssetSpec("blobs_on_transactions")
transaction_fork = dg.AssetSpec("transaction_fork")
