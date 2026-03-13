FROM python:3.14


ARG BUILD_TIMESTAMP
ENV BUILD_TIMESTAMP=$BUILD_TIMESTAMP
ARG GIT_COMMIT
ENV GIT_COMMIT=$GIT_COMMIT

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy project metadata and source
COPY pyproject.toml .

# This makes sure that logs show up immediately instead of being buffered
ENV PYTHONUNBUFFERED=1



RUN uv pip install --system --no-cache \
  -r pyproject.toml \
  dagster \
  dagster-postgres \
  dagster-k8s

COPY src/ src/

# Expose the port that your Dagster instance will run on
EXPOSE 80
