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
