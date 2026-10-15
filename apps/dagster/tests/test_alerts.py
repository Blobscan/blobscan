import json
import time
from types import SimpleNamespace
from unittest.mock import patch

import dagster as dg
import pytest

from analytics.defs.alerts import (
    HOURLY_METRICS_STALE_AFTER_SECONDS,
    hourly_metrics_staleness_alert,
    send_alert,
)


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


class TestHourlyMetricsStalenessAlert:
    def _evaluate(self, last_update: float | None, cursor: str | None):
        instance = dg.DagsterInstance.ephemeral()
        event = SimpleNamespace(timestamp=last_update) if last_update else None
        context = dg.build_sensor_context(instance=instance, cursor=cursor)
        with (
            patch.object(
                instance,
                "get_latest_materialization_event",
                return_value=event,
            ),
            patch("analytics.defs.alerts.send_alert") as alert,
        ):
            hourly_metrics_staleness_alert(context)
        return alert, context.cursor

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
    from analytics.defs.alerts import metrics_run_failure_alert

    assert isinstance(metrics_run_failure_alert, dg.RunFailureSensorDefinition)
