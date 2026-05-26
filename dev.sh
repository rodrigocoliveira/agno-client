#!/usr/bin/env bash
# Inicia o mock server (Python, porta 7777) e o exemplo React (Vite, porta 3000) juntos.
# Ctrl+C encerra ambos.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOCK_DIR="$ROOT/examples/agno-mock-server"
REACT_DIR="$ROOT/examples/react-chat"
VENV_PY="$MOCK_DIR/.venv/bin/python"

if [ ! -x "$VENV_PY" ]; then
  echo "✗ Python venv não encontrada em $VENV_PY"
  echo ""
  echo "Configure o mock server primeiro:"
  echo "  cd $MOCK_DIR"
  echo "  python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi

if ! command -v bun >/dev/null 2>&1; then
  echo "✗ bun não encontrado no PATH. Instale: https://bun.sh"
  exit 1
fi

cleanup() {
  trap - EXIT INT TERM
  echo ""
  echo "→ Encerrando serviços..."
  kill 0 2>/dev/null || true
}
trap cleanup EXIT INT TERM

(cd "$MOCK_DIR" && exec "$VENV_PY" server.py) &
(cd "$REACT_DIR" && exec bun run dev) &

echo ""
echo "→ Mock server    http://localhost:7777"
echo "→ React example  http://localhost:3000"
echo ""
echo "Ctrl+C para parar ambos."
echo ""

wait
