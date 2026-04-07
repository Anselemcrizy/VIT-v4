#!/bin/bash

echo "⌐ Starting Environment Setup..."
# Install requirements if they exist
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
fi

echo "⌐ Starting FastAPI Server..."
# Run uvicorn server - assuming main:app is the entry point
python -m uvicorn main:app --host 0.0.0.0 --port 8080
