#!/usr/bin/env bash

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "       INICIANDO O SISTEMA WALLET       "
echo "========================================"

# 1. Validação do ambiente virtual do Backend
if [ ! -d "$PROJECT_ROOT/backend/venv" ]; then
    echo "[!] Ambiente virtual do backend não encontrado."
    echo "    Criando venv e instalando pacotes..."
    python3 -m venv "$PROJECT_ROOT/backend/venv"
    "$PROJECT_ROOT/backend/venv/bin/pip" install --upgrade pip
    "$PROJECT_ROOT/backend/venv/bin/pip" install -r "$PROJECT_ROOT/backend/requirements.txt"
fi

# 2. Validação dos módulos do Frontend
if [ ! -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    echo "[!] Módulos do frontend não encontrados."
    echo "    Instalando dependências via npm..."
    (cd "$PROJECT_ROOT/frontend" && npm install)
fi

# 3. Função para encerrar todos os processos filhos ao sair
cleanup() {
    echo ""
    echo "[*] Encerrando serviços do Wallet..."
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
    echo "[✓] Serviços finalizados com sucesso."
    exit 0
}

trap cleanup SIGINT SIGTERM

# 4. Inicialização do Backend (FastAPI / Uvicorn)
echo "[+] Inicializando Backend..."
cd "$PROJECT_ROOT/backend"
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 5. Inicialização do Frontend (Vite)
echo "[+] Inicializando Frontend..."
cd "$PROJECT_ROOT/frontend"
npm run dev -- --host &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "  Wallet em execução:"
echo "  ➜ Frontend: http://localhost:5173"
echo "  ➜ Backend Docs: http://localhost:8000/docs"
echo "  Pressione Ctrl + C para encerrar."
echo "========================================"
echo ""

# Mantém o script aguardando os processos
wait
