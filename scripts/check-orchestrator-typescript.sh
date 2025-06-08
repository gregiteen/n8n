#!/bin/bash

# Script to run TypeScript check on orchestrator package and generate logs
# Always outputs logs even when there are no errors
# Writes directly to the main typescript-errors.log file

LOG_FILE="/workspaces/n8n/typescript-errors.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Make a backup of the current log file
cp $LOG_FILE "${LOG_FILE}.bak" 2>/dev/null

# Create a new log file with a header
echo "# TypeScript Errors Log - Check run on $(date)" > $LOG_FILE
echo "" >> $LOG_FILE
echo "## Running TypeScript check for orchestrator package..." >> $LOG_FILE
echo "" >> $LOG_FILE

# Run TypeScript check and capture output - ONLY ONCE
cd /workspaces/n8n/packages/orchestrator
echo "Running TypeScript check (this may take a moment)..."
OUTPUT=$(pnpm typecheck 2>&1)
EXIT_CODE=$?

# Always write output to log file
echo "## TypeScript Check Output" >> $LOG_FILE
echo '```' >> $LOG_FILE
echo "$OUTPUT" >> $LOG_FILE
echo '```' >> $LOG_FILE
echo "" >> $LOG_FILE

# Add summary based on exit code
if [ $EXIT_CODE -eq 0 ]; then
  echo "## ✅ Summary: No TypeScript errors found" >> $LOG_FILE
  
  # Add a section for tracking fixed errors
  echo "" >> $LOG_FILE
  echo "## Fixed Errors" >> $LOG_FILE
  echo "" >> $LOG_FILE
  
  # Copy any existing "Fixed Errors" section from the backup
  if [ -f "${LOG_FILE}.bak" ] && grep -q "## Fixed Errors" "${LOG_FILE}.bak"; then
    sed -n '/## Fixed Errors/,/## /p' "${LOG_FILE}.bak" | sed '/## /d' >> $LOG_FILE
  else
    echo "No previously fixed errors recorded." >> $LOG_FILE
  fi
else
  echo "## ⚠️ Summary: TypeScript errors were found" >> $LOG_FILE
  
  # Extract and list specific errors for easier processing
  echo "" >> $LOG_FILE
  echo "## Error Details" >> $LOG_FILE
  echo "" >> $LOG_FILE
  
  # Parse and list all errors
  ERRORS=$(echo "$OUTPUT" | grep -E "error TS[0-9]+:")
  if [ -n "$ERRORS" ]; then
    echo "$ERRORS" | sort | uniq >> $LOG_FILE
    ERROR_COUNT=$(echo "$ERRORS" | wc -l)
    echo "" >> $LOG_FILE
    echo "Total unique errors: $ERROR_COUNT" >> $LOG_FILE
  else
    echo "No structured error details found" >> $LOG_FILE
  fi
  
  # Add a section for tracking fixed errors
  echo "" >> $LOG_FILE
  echo "## Fixed Errors" >> $LOG_FILE
  echo "" >> $LOG_FILE
  
  # Copy any existing "Fixed Errors" section from the backup
  if [ -f "${LOG_FILE}.bak" ] && grep -q "## Fixed Errors" "${LOG_FILE}.bak"; then
    sed -n '/## Fixed Errors/,/## /p' "${LOG_FILE}.bak" | sed '/## /d' >> $LOG_FILE
  else
    echo "No previously fixed errors recorded." >> $LOG_FILE
  fi
fi

echo "" >> $LOG_FILE
echo "End of TypeScript check report - $(date)" >> $LOG_FILE

# Output the log location to the console
echo -e "\nTypeScript check completed. Results saved to $LOG_FILE"
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "✅ No TypeScript errors found!"
else
  echo -e "⚠️ TypeScript errors were found. Check the log for details."
fi

# Remove the backup file if it exists
rm "${LOG_FILE}.bak" 2>/dev/null

# Return the original exit code
exit $EXIT_CODE
