# Based on: https://github.com/astral-sh/uv-docker-example

# Use a Python image with uv pre-installed
FROM ghcr.io/astral-sh/uv:0.6.14-python3.13-bookworm

# Install the project into `/app`
WORKDIR /app

# Copy the project into the image
ADD . /app

# Sync the project into a new environment, asserting the lockfile is up to date
RUN uv sync --locked --no-dev

# Place executables in the environment at the front of the path
ENV PATH="/app/.venv/bin:$PATH"

# Reset the entrypoint, don't invoke `uv`
ENTRYPOINT []

# Indicate the port the app listens on
EXPOSE 5004

# Run the application
CMD ["python", "app.py"]
