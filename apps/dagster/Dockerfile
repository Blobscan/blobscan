FROM python:3.14-slim

ARG BUILD_TIMESTAMP
ENV BUILD_TIMESTAMP=$BUILD_TIMESTAMP
ARG GIT_COMMIT
ENV GIT_COMMIT=$GIT_COMMIT
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app
ENV VIRTUAL_ENV=/app/.venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY src/ ./

RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Run dagster gRPC server on port 4000
EXPOSE 4000

HEALTHCHECK --timeout=1s --start-period=3s --interval=10s --retries=5 \
    CMD ["dagster", "api", "grpc-health-check", "-p", "4000"]

CMD ["dagster", "api", "grpc", "-h", "0.0.0.0", "-p", "4000", "-m", "analytics.definitions"]
