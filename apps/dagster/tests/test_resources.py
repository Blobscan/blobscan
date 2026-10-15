from sqlalchemy import text

from analytics.defs.resources.postgres import PostgresResource

_URL = "postgresql://user:pass@localhost:1/db"


class TestPostgresResource:
    def test_engine_is_reused_across_calls(self):
        resource = PostgresResource(connection_url=_URL)
        assert resource.get_engine() is resource.get_engine()

    def test_teardown_disposes_engine(self):
        resource = PostgresResource(connection_url=_URL)
        engine = resource.get_engine()

        resource.teardown_after_execution(None)  # type: ignore[arg-type]

        assert resource.get_engine() is not engine

    def test_connections_use_utc_time_zone(self, postgres: PostgresResource):
        # The server default is changed for new sessions; the resource must
        # still give UTC sessions.
        resource = PostgresResource(connection_url=postgres.connection_url)
        with resource.get_connection() as conn:
            db_name = conn.execute(text("SELECT current_database()")).scalar()
            conn.execute(
                text(f"ALTER DATABASE {db_name} SET timezone TO 'America/New_York'"),
            )
            conn.commit()
        resource.teardown_after_execution(None)  # type: ignore[arg-type]

        try:
            with resource.get_connection() as conn:
                assert conn.execute(text("SHOW timezone")).scalar() == "UTC"
        finally:
            with resource.get_connection() as conn:
                conn.execute(text(f"ALTER DATABASE {db_name} RESET timezone"))
                conn.commit()
            resource.teardown_after_execution(None)  # type: ignore[arg-type]
