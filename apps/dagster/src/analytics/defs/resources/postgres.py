from __future__ import annotations

from contextlib import contextmanager
from typing import TYPE_CHECKING

import dagster as dg
from pydantic import PrivateAttr
from sqlalchemy import Engine, create_engine, event

if TYPE_CHECKING:
    from sqlalchemy.engine.interfaces import DBAPIConnection
    from sqlalchemy.pool import ConnectionPoolEntry


def _set_utc_time_zone(
    dbapi_connection: DBAPIConnection,
    _connection_record: ConnectionPoolEntry,
) -> None:
    # The metrics SQL compares naive TIMESTAMP/DATE columns with UTC partition
    # bounds and uses now(). Postgres resolves both with the session TimeZone,
    # so it must be UTC, whatever the server or role default is.
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("SET TIME ZONE 'UTC'")
    finally:
        cursor.close()
    # Commit, or the SET is rolled back with the implicit transaction
    dbapi_connection.commit()


class PostgresResource(dg.ConfigurableResource):
    connection_url: str

    # Created lazily and reused, so every connection shares one pool instead
    # of building a new engine (and pool) per call.
    _engine: Engine | None = PrivateAttr(default=None)

    def get_engine(self) -> Engine:
        if self._engine is None:
            self._engine = create_engine(self.connection_url, pool_pre_ping=True)
            event.listen(self._engine, "connect", _set_utc_time_zone)
        return self._engine

    @contextmanager
    def get_connection(self):
        with self.get_engine().connect() as conn:
            yield conn

    @contextmanager
    def transaction(self):
        """Yield a connection inside a transaction.

        Commits when the block exits normally, rolls back if it raises.
        """
        with self.get_engine().begin() as conn:
            yield conn

    def teardown_after_execution(self, context: dg.InitResourceContext) -> None:  # noqa: ARG002
        if self._engine is not None:
            self._engine.dispose()
            self._engine = None


@dg.definitions
def resources() -> dg.Definitions:
    return dg.Definitions(
        resources={
            "postgres": PostgresResource(
                connection_url=dg.EnvVar("DATABASE_URL"),
            ),
        },
    )
