#!/bin/bash
cd /Users/neildesh/m/ap
export NODE_TLS_REJECT_UNAUTHORIZED=0

# Set up PATH to include nvm and pyenv
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="$HOME/.nvm/versions/node/v24.8.0/bin:$HOME/.pyenv/shims:$PATH"

# Flag to control the main loop
RUNNING=true

# Function to cleanup on exit
cleanup() {
    RUNNING=false
    pkill -P $$ 2>/dev/null
    exit
}

# Register cleanup function for Ctrl+C
trap cleanup SIGINT SIGTERM

# Function to start and monitor Python server
start_server() {
    while $RUNNING; do
        /Users/neildesh/.pyenv/shims/python3 run_server.py >/dev/stdout 2>&1 &
        SERVER_PID=$!
        wait $SERVER_PID

        if $RUNNING; then
            sleep 2
        fi
    done
}

# Function to start and monitor Expo app
start_expo() {
    while $RUNNING; do
        /Users/neildesh/.nvm/versions/node/v24.8.0/bin/npx expo start -p 54734 >/dev/stdout 2>&1 &
        EXPO_PID=$!
        wait $EXPO_PID

        if $RUNNING; then
            sleep 2
        fi
    done
}

# Start both services in background
start_server &
start_expo &

# Wait for all background jobs
wait
