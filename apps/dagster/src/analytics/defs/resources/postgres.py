from contextlib import contextmanager

import dagster as dg
from pydantic import PrivateAttr
from sqlalchemy import Engine, create_engine


class PostgresResource(dg.ConfigurableResource):
    connection_url: str

    # Created lazily and reused, so every connection shares one pool instead
    # of building a new engine (and pool) per call.
    _engine: Engine | None = PrivateAttr(default=None)

    def get_engine(self) -> Engine:
        if self._engine is None:
            self._engine = create_engine(self.connection_url, pool_pre_ping=True)
        return self._engine

    @contextmanager
    def get_connection(self):
        with self.get_engine().connect() as conn:
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
