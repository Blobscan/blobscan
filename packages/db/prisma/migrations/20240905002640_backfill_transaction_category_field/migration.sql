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
            WHERE rollup IS NOT NULL AND category IS DISTINCT FROM 'rollup'::category -- Avoid redundant updates
            LIMIT batch_size
            FOR UPDATE NOWAIT
        ), update_rows AS (
            -- Perform the update for the selected rows
            UPDATE transaction
            SET category = 'rollup'::category
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