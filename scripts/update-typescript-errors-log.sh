#!/bin/bash

# Script to update TypeScript errors log with resolved issues
# Run this script after fixing TypeScript issues in the orchestrator package

# Generate a timestamp
TIMESTAMP=$(date +"%B %d, %Y")

# Run TypeScript check and check for errors
cd /workspaces/n8n/packages/orchestrator
pnpm typecheck > /tmp/typescript-check.log 2>&1
EXIT_CODE=$?

# Update the typescript-errors.log file
ERRORS_LOG="/workspaces/n8n/typescript-errors.log"

# Create a backup of the current log
cp $ERRORS_LOG "${ERRORS_LOG}.bak"

if [ $EXIT_CODE -eq 0 ]; then
  # No errors found - update the log to reflect all errors are fixed
  echo "# TypeScript Errors Log - Updated on $TIMESTAMP" > $ERRORS_LOG
  echo "" >> $ERRORS_LOG
  echo "## Summary of Fixes" >> $ERRORS_LOG
  echo "" >> $ERRORS_LOG
  echo "This log contains the TypeScript errors that were identified and fixed in the n8n orchestrator package." >> $ERRORS_LOG
  echo "" >> $ERRORS_LOG
  echo "## ✅ All TypeScript Errors Fixed! ($TIMESTAMP)" >> $ERRORS_LOG
  echo "" >> $ERRORS_LOG
  echo "The orchestrator package now compiles without TypeScript errors." >> $ERRORS_LOG
  
  # Preserve previous fixes section if it exists
  if grep -q "## Fixed Errors" "${ERRORS_LOG}.bak"; then
    echo "" >> $ERRORS_LOG
    echo "## History of Fixed Errors" >> $ERRORS_LOG
    sed -n '/## Fixed Errors/,/## /p' "${ERRORS_LOG}.bak" | sed '/## $/d' >> $ERRORS_LOG
  fi
else
  # Errors still exist - update the log but preserve the structure
  echo "# TypeScript Errors Log - Updated on $TIMESTAMP" > $ERRORS_LOG
  echo "" >> $ERRORS_LOG
  echo "## Summary of Fixes" >> $ERRORS_LOG
  echo "" >> $ERRORS_LOG
  echo "This log contains the TypeScript errors that were identified and fixed in the n8n orchestrator package." >> $ERRORS_LOG
  echo "" >> $ERRORS_LOG
  
  # Copy existing fixed errors section
  if grep -q "## Fixed Errors" "${ERRORS_LOG}.bak"; then
    sed -n '/## Fixed Errors/,/## /p' "${ERRORS_LOG}.bak" | sed '/## $/d' >> $ERRORS_LOG
  else
    echo "## Fixed Errors ($TIMESTAMP)" >> $ERRORS_LOG
    echo "" >> $ERRORS_LOG
    echo "No fixes recorded yet." >> $ERRORS_LOG
  fi
  
  echo "" >> $ERRORS_LOG
  echo "## Remaining TypeScript Errors ($TIMESTAMP)" >> $ERRORS_LOG
  echo "" >> $ERRORS_LOG
  echo '```' >> $ERRORS_LOG
  cat /tmp/typescript-check.log >> $ERRORS_LOG
  echo '```' >> $ERRORS_LOG
fi

echo "TypeScript errors log updated at: $ERRORS_LOG"

# Clean up
rm /tmp/typescript-check.log

# Return the original exit code to indicate if there were errors
exit $EXIT_CODE
