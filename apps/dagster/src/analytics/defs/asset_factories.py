from typing import Optional, Sequence, Union
from analytics.defs.helpers import execute_sql_window, partition_meta
import dagster as dg

from sqlalchemy.sql.elements import TextClause
from .resources.postgres import PostgresResource


def make_metrics_asset(
    *,
    name: str,
    deps: Sequence[Union[dg.AssetDep, dg.AssetsDefinition, dg.SourceAsset]],
    partitions_def: dg.PartitionsDefinition,
    sql: TextClause,
    automation_condition: Optional[dg.AutomationCondition] = None,
    backfill_policy: Optional[dg.BackfillPolicy] = None,
):
    @dg.asset(
        name=name,
        deps=list(deps),
        partitions_def=partitions_def,
        automation_condition=automation_condition,
        backfill_policy=backfill_policy,
    )
    def _asset(
        context: dg.AssetExecutionContext, postgres: PostgresResource
    ) -> dg.MaterializeResult:
        rowcount, ms = execute_sql_window(context=context, postgres=postgres, sql=sql)
        return dg.MaterializeResult(
            metadata={
                "partition_range": partition_meta(context),
                "rows_affected": dg.MetadataValue.int(rowcount),
                "query_ms": dg.MetadataValue.int(ms),
            }
        )

    return _asset
