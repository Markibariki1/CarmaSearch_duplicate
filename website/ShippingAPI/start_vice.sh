#!/bin/bash

# VICE - Vehicle Import Cost Engine
# Quick Start Script

echo "🚗 Starting VICE - Vehicle Import Cost Engine"
echo "=============================================="

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3 and try again."
    exit 1
fi

# Start the web server
echo "🌐 Starting web server on port 3000..."
echo "📱 Open your browser and go to: http://localhost:3000/vice_standalone.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
python3 -m http.server 3000
