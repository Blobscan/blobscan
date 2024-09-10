DO $$
DECLARE
    batch_size INT := 1000; -- Define the size of each batch
    update_count INT := 0; -- Variable to store the count of updated rows
BEGIN
    -- Loop indefinitely until no rows are updated
    LOOP
        WITH candidate_rows AS (
            -- Select rows for update in batches of 1000, using NOWAIT to avoid locking conflicts
            SELECT hash
            FROM transaction
            WHERE blob_gas_used IS NULL
            LIMIT batch_size
            FOR UPDATE NOWAIT
        ), update_rows AS (
            -- Perform the update for the selected rows
            UPDATE transaction
            SET blob_gas_used = (
              SELECT COUNT(btx.blob_hash) * 131072 AS blob_gas_used
              FROM blobs_on_transactions btx
              WHERE btx.tx_hash = transaction.hash
            )
            FROM candidate_rows
            WHERE candidate_rows.hash = transaction.hash
            RETURNING transaction.hash
        )
        -- Count the number of updated rows in this batch
        SELECT count(1) INTO update_count FROM update_rows;

        -- Exit the loop if no rows were updated in this batch
        EXIT WHEN update_count = 0;

        -- Optional: Sleep briefly to reduce load on the database
        PERFORM pg_sleep(0.1);
    END LOOP;
END $$;