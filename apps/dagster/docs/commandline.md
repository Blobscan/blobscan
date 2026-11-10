# Command line

## `analytics.backfill_rollup_change`

Launches the metrics backfill that a change of `address.rollup` needs. See
[Reprocessing after a rollup change](operations.md#reprocessing-after-a-rollup-change)
for the reason. Run it when the new labels are in the database.

The command finds the first transaction of the changed addresses and selects,
for each metrics level, the partitions from that point to the latest one. The
first transaction comes from the `transaction` table, not from
`address.first_block_number_as_sender`, which a reorg can set to `NULL`.

### Usage

Run it first without `--launch`. A dry run only reads the database and prints
the addresses, their current rollup and the partitions:

```bash
python -m analytics.backfill_rollup_change --address 0x... --address 0x...
```

Then add `--launch` to start one backfill of all the levels, and open the link
that it prints to follow the progress:

```bash
python -m analytics.backfill_rollup_change --address 0x... --address 0x... --launch
```

To change several addresses at once, pass all of them: one backfill can cover
several changes.

### Options

| Option                | Description                                                              | Default                                                  |
| --------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------- |
| `--address <address>` | Address whose rollup changed. Repeatable.                                | None                                                     |
| `--migration <path>`  | SQL file to read the addresses from, ignoring line comments. Repeatable. | None                                                     |
| `--launch`            | Start the backfill. Without this option, the command is a dry run.       | Off                                                      |
| `--wait`              | With `--launch`, wait until the backfill ends.                           | Off                                                      |
| `--allow-unlabelled`  | Launch even if some addresses have no rollup.                            | Off                                                      |
| `--graphql-url <url>` | GraphQL endpoint of the Dagster webserver.                               | `DAGSTER_GRAPHQL_URL` or `http://localhost:3003/graphql` |

At least one `--address` or `--migration` is required. The two options can be
combined.

### Where to run it

Run it in the code location container, or from `apps/dagster` with
`PYTHONPATH=src`. The container has no migration files, so `--migration` only
works from a checkout.

The command needs the values of the deployment, because the partitions depend
on them:

- `DATABASE_URL`
- `CHAIN_ID` or `DAGSTER_METRICS_START_DATE`

The open-source webserver has no authentication, so reach it from inside the
network or with a port-forward.

### Behavior

- If the addresses have sent no transactions, the command says that no backfill
  is needed and does not launch one.
- `--launch` stops if an address has no rollup, because the migration may not
  have run yet and the backfill would keep the old attribution. Pass
  `--allow-unlabelled` when removing a rollup on purpose.
- `--wait` checks the status every 30 seconds and prints it when it changes. It
  tolerates four failed checks in a row. It has no time limit.
- Stopping the command does not stop the backfill.

### Exit codes

| Code | Meaning                                                                                                                      |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- |
| `0`  | The dry run finished, no backfill was needed, the backfill was launched or, with `--wait`, the backfill succeeded.           |
| `1`  | The command could not run or launch the backfill. With `--wait`, the backfill did not succeed or the API stayed unreachable. |
| `2`  | The arguments are invalid.                                                                                                   |
