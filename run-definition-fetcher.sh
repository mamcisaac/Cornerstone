#!/bin/bash

# Run the definition fetcher in the background with output logging
echo "Starting definition fetcher for all puzzle words..."
echo "This will take some time to respect API rate limits."
echo "Check fetch-definitions.log for progress."
echo ""

# Run in background and log output
nohup node fetch-all-puzzle-definitions.js > fetch-definitions.log 2>&1 &
PID=$!

echo "Process started with PID: $PID"
echo "To check progress: tail -f fetch-definitions.log"
echo "To stop: kill $PID"
echo ""
echo "The script will:"
echo "- Fetch definitions for ~1140 unique words"
echo "- Use FreeDictionary, Datamuse, and Google APIs"
echo "- Respect rate limits (60/min for FreeDictionary, etc.)"
echo "- Save progress to all-puzzle-definitions.js"
echo "- Take approximately 20-30 minutes to complete"