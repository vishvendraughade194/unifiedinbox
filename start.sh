#!/bin/bash

echo "========================================"
echo "  Unified Messaging Dashboard"
echo "========================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Starting development server..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed!${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    echo "Or use your package manager:"
    echo "  Ubuntu/Debian: sudo apt install nodejs npm"
    echo "  macOS: brew install node"
    echo "  CentOS/RHEL: sudo yum install nodejs npm"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}ERROR: npm is not installed!${NC}"
    echo "Please install npm or reinstall Node.js"
    exit 1
fi

# Display versions
echo -e "${GREEN}Node.js version:${NC} $(node --version)"
echo -e "${GREEN}npm version:${NC} $(npm --version)"
echo

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}WARNING: .env file not found!${NC}"
    echo "Copying from env.example..."
    cp env.example .env
    echo
    echo -e "${YELLOW}Please edit .env file with your API keys before starting!${NC}"
    echo
    read -p "Press Enter to continue..."
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo
fi

echo -e "${GREEN}Starting server on http://localhost:3000${NC}"
echo "Press Ctrl+C to stop the server"
echo

# Start the development server
npm run dev
