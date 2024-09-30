DO $$
DECLARE
    batch_size INT := 10000; -- Define the size of each batch
    update_count INT := 0; -- Variable to store the count of updated rows
BEGIN
    -- Loop indefinitely until no rows are updated
    LOOP
        WITH candidate_rows AS (
            -- Select rows for update in batches of 1000, using NOWAIT to avoid locking conflicts
            SELECT transaction.category as category, transaction.rollup as rollup, blobs_on_transactions.tx_hash as tx_hash
            FROM blobs_on_transactions JOIN transaction ON blobs_on_transactions.tx_hash = transaction.hash
            WHERE blobs_on_transactions.category = 'other'::category AND transaction.category = 'rollup'::category
            LIMIT batch_size
            FOR UPDATE NOWAIT
        ), update_rows AS (
            -- Perform the update for the selected rows
            UPDATE blobs_on_transactions
            SET category = candidate_rows.category, rollup = candidate_rows.rollup
            FROM candidate_rows
            WHERE candidate_rows.tx_hash = blobs_on_transactions.tx_hash
            RETURNING blobs_on_transactions.tx_hash
        )
        -- Count the number of updated rows in this batch
        SELECT count(1) INTO update_count FROM update_rows;

        -- Exit the loop if no rows were updated in this batch
        EXIT WHEN update_count = 0;

        -- Optional: Sleep briefly to reduce load on the database
        PERFORM pg_sleep(0.1);
    END LOOP;
END $$;-- This is an empty migration.