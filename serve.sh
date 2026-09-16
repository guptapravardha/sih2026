#!/bin/sh
# GramSaarthi — start a local server (ES modules need http://, not file://)
PORT=${1:-8000}
echo "GramSaarthi running at http://localhost:$PORT"
python3 -m http.server $PORT
