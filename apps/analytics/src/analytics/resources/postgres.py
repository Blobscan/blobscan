from contextlib import contextmanager

import dagster as dg
from sqlalchemy import create_engine, Engine


class PostgresResource(dg.ConfigurableResource):
    connection_url: str

    def get_engine(self) -> Engine:
        return create_engine(self.connection_url)

    @contextmanager
    def get_connection(self):
        engine = self.get_engine()
        with engine.connect() as conn:
            yield conn


@dg.definitions
def resources() -> dg.Definitions:
    return dg.Definitions(
        resources={
            "postgres": PostgresResource(
                connection_url=dg.EnvVar("DATABASE_URL"),
            )
        }
    )
