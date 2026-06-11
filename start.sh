#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker Desktop, then try again."
  exit 1
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example"
  echo "Add your GEMINI_API_KEY from https://aistudio.google.com to .env, then run:"
  echo "  ./start.sh"
  exit 1
fi

if grep -q 'your-google-ai-studio-api-key' .env; then
  echo "Set GEMINI_API_KEY in .env before starting."
  echo "Get a key at https://aistudio.google.com"
  exit 1
fi

echo "Starting ApplyAI at http://localhost:5173"
exec docker compose up --build
