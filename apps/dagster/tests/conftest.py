import logging
import os
import subprocess
from pathlib import Path

import pytest
from testcontainers.postgres import PostgresContainer

from analytics.defs.resources.postgres import PostgresResource

DB_USERNAME = "blobscan"
DB_PASSWORD = "s3cr3t"
DB_NAME = "blobscan_test"

DATABASE_URL = f"postgresql://{DB_USERNAME}:{DB_PASSWORD}@localhost:9999/{DB_NAME}"

# Must be set before any module import that calls get_partition_start_date()
# at module level.
os.environ.setdefault("DAGSTER_METRICS_START_DATE", "2024-03-13T13:55")
os.environ.setdefault("DATABASE_URL", DATABASE_URL)
os.environ.setdefault("DIRECT_URL", DATABASE_URL)

_TESTS_ROOT = Path(__file__).resolve().parent.parent
_DB_PKG_ROOT = _TESTS_ROOT.parent.parent / "packages" / "db"



logger = logging.getLogger(__name__)

@pytest.fixture(scope="session", autouse=True)
def postgres():
    logger.debug("Starting postgres container")

    with PostgresContainer(
        "postgres:16",
        username=DB_USERNAME,
        password=DB_PASSWORD,
        dbname=DB_NAME).with_bind_ports(5432, 9999) as container:
        url = (
            f"postgresql://{container.username}:{container.password}"
            f"@{container.get_container_host_ip()}:{container.get_exposed_port(5432)}"
            f"/{container.dbname}"
        )


        result = subprocess.run(
            ["pnpm", "exec", "prisma", "migrate", "deploy"],
            cwd=_DB_PKG_ROOT,
            env={**os.environ, "DATABASE_URL": url},
            capture_output=True,
            text=True,
            check=False,
        )

        logger.debug("prisma migrate deploy output:\n%s", result.stdout)

        if result.returncode != 0:
            logger.error("prisma migrate deploy stderr:\n%s", result.stderr)
            result.check_returncode()

        result = subprocess.run(
            ["pnpm", "tsx", "db-seed.ts"],
            cwd=_TESTS_ROOT,
            env={**os.environ, "DATABASE_URL": url},
            capture_output=True,
            text=True,
            check=False,
        )

        logger.debug("db seeding output: \n%s", result.stdout)

        if result.returncode != 0:
            logger.error("db seeding failed stderr:\n%s", result.stderr)
            result.check_returncode()

        logger.debug("Postgres container started. Connection url %s", url)

        yield PostgresResource(connection_url=url)
