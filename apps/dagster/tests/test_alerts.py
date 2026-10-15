from __future__ import annotations

import json
import time
from datetime import UTC, datetime
from unittest.mock import patch

import dagster as dg
import pytest

from analytics.defs.alerts import (
    HOURLY_METRICS_STALE_AFTER_SECONDS,
    hourly_metrics_staleness_alert,
    last_live_update,
    metrics_run_failure_alert,
    send_alert,
)
from analytics.defs.assets import hourly_metrics


class TestSendAlert:
    def test_posts_slack_compatible_payload(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setenv("DAGSTER_ALERT_WEBHOOK_URL", "https://hooks.example/x")
        with patch("analytics.defs.alerts.urllib.request.urlopen") as urlopen:
            send_alert("boom")

        request = urlopen.call_args.args[0]
        assert request.full_url == "https://hooks.example/x"
        assert json.loads(request.data) == {"text": "boom"}

    def test_does_not_post_without_webhook(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.delenv("DAGSTER_ALERT_WEBHOOK_URL", raising=False)
        with patch("analytics.defs.alerts.urllib.request.urlopen") as urlopen:
            send_alert("boom")

        urlopen.assert_not_called()

    def test_delivery_errors_are_not_raised(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setenv("DAGSTER_ALERT_WEBHOOK_URL", "https://hooks.example/x")
        with patch(
            "analytics.defs.alerts.urllib.request.urlopen",
            side_effect=OSError("down"),
        ):
            send_alert("boom")

    def test_malformed_webhook_url_is_not_raised(
        self, monkeypatch: pytest.MonkeyPatch,
    ):
        # No scheme: urllib.request.Request raises ValueError
        monkeypatch.setenv("DAGSTER_ALERT_WEBHOOK_URL", "hooks.example/x")
        send_alert("boom")


class TestLastLiveUpdate:
    _NOW = datetime(2024, 6, 1, 10, 20, tzinfo=UTC).timestamp()

    def _materialize(self, instance: dg.DagsterInstance, partition: str) -> None:
        instance.report_runless_asset_event(
            dg.AssetMaterialization(asset_key=hourly_metrics.key, partition=partition),
        )

    def test_none_when_never_materialized(self):
        instance = dg.DagsterInstance.ephemeral()
        assert last_live_update(instance, self._NOW) is None

    def test_ignores_older_partitions(self):
        # A backfill of old partitions must not count as a live update
        instance = dg.DagsterInstance.ephemeral()
        self._materialize(instance, "2024-05-01T00:00")
        assert last_live_update(instance, self._NOW) is None

    @pytest.mark.parametrize("partition", ["2024-06-01T10:00", "2024-06-01T09:00"])
    def test_counts_current_and_previous_hour(self, partition: str):
        instance = dg.DagsterInstance.ephemeral()
        self._materialize(instance, partition)
        assert last_live_update(instance, self._NOW) is not None


class TestHourlyMetricsStalenessAlert:
    def _evaluate(self, last_update: float | None, cursor: str | None):
        instance = dg.DagsterInstance.ephemeral()
        context = dg.build_sensor_context(instance=instance, cursor=cursor)
        with (
            patch(
                "analytics.defs.alerts.last_live_update",
                return_value=last_update,
            ),
            patch("analytics.defs.alerts.send_alert") as alert,
        ):
            hourly_metrics_staleness_alert(context)
        return alert, context.cursor

    def test_is_stopped_by_default(self):
        # Same as the live schedules, so it doesn't alert before they run
        assert (
            hourly_metrics_staleness_alert.default_status
            == dg.DefaultSensorStatus.STOPPED
        )

    def test_alerts_when_becoming_stale(self):
        stale = time.time() - HOURLY_METRICS_STALE_AFTER_SECONDS - 60
        alert, cursor = self._evaluate(stale, cursor="fresh")
        alert.assert_called_once()
        assert "stale" in alert.call_args.args[0]
        assert cursor == "stale"

    def test_alerts_when_never_materialized(self):
        alert, cursor = self._evaluate(None, cursor=None)
        alert.assert_called_once()
        assert cursor == "stale"

    def test_does_not_repeat_alert_while_stale(self):
        stale = time.time() - HOURLY_METRICS_STALE_AFTER_SECONDS - 60
        alert, cursor = self._evaluate(stale, cursor="stale")
        alert.assert_not_called()
        assert cursor == "stale"

    def test_alerts_on_recovery(self):
        alert, cursor = self._evaluate(time.time() - 60, cursor="stale")
        alert.assert_called_once()
        assert "updating again" in alert.call_args.args[0]
        assert cursor == "fresh"

    def test_no_alert_while_fresh(self):
        alert, cursor = self._evaluate(time.time() - 60, cursor="fresh")
        alert.assert_not_called()
        assert cursor == "fresh"


def test_run_failure_alert_is_registered():
    # run_failure_sensor builds a RunStatusSensorDefinition (no failure subclass)
    assert isinstance(metrics_run_failure_alert, dg.RunStatusSensorDefinition)
