#!/bin/bash

# Setup Script for Privacy Layer Package
# Purpose: Fix missing configurations and dependencies for the privacy layer package
# Date: June 5, 2025

set -e

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Setting up @n8n/privacy-layer package =====${NC}"

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Step 1: Check if the privacy-layer package exists
if [ ! -d "packages/@n8n/privacy-layer" ]; then
  echo -e "${RED}Error: privacy-layer package not found.${NC}"
  echo -e "${YELLOW}Creating privacy-layer package directory structure...${NC}"
  mkdir -p packages/@n8n/privacy-layer/src
fi

# Step 2: Ensure TypeScript configuration exists
echo -e "${BLUE}Checking for TypeScript configuration...${NC}"
if [ ! -d "packages/@n8n/typescript-config" ]; then
  echo -e "${YELLOW}Creating TypeScript config package...${NC}"
  mkdir -p packages/@n8n/typescript-config
  
  # Create a basic tsconfig.common.json
  cat > packages/@n8n/typescript-config/tsconfig.common.json << EOL
{
  "compilerOptions": {
    "target": "es2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "sourceMap": true,
    "declaration": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "removeComments": true,
    "lib": ["es2022"]
  },
  "exclude": ["node_modules", "dist"]
}
EOL
  echo -e "${GREEN}Created TypeScript configuration.${NC}"
else
  echo -e "${GREEN}TypeScript config package exists.${NC}"
fi

# Step 3: Set up basic package.json for privacy-layer if it doesn't exist
if [ ! -f "packages/@n8n/privacy-layer/package.json" ]; then
  echo -e "${YELLOW}Creating package.json for privacy-layer...${NC}"
  cat > packages/@n8n/privacy-layer/package.json << EOL
{
  "name": "@n8n/privacy-layer",
  "version": "0.1.0",
  "description": "Privacy Layer for n8n AI Agent Platform",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "dev": "tsc -p tsconfig.build.json --watch",
    "clean": "rimraf dist .turbo",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts",
    "lintfix": "eslint src --ext .ts --fix",
    "test": "jest"
  },
  "dependencies": {
    "zod": "workspace:*",
    "@n8n/config": "workspace:*"
  },
  "devDependencies": {
    "@n8n/typescript-config": "workspace:*",
    "@types/jest": "^29.5.0",
    "@types/node": "^18.0.0",
    "jest": "^29.5.0",
    "rimraf": "^5.0.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0"
  }
}
EOL
  echo -e "${GREEN}Created package.json for privacy-layer.${NC}"
fi

# Step 4: Set up tsconfig files for privacy-layer
if [ ! -f "packages/@n8n/privacy-layer/tsconfig.json" ]; then
  echo -e "${YELLOW}Creating tsconfig.json for privacy-layer...${NC}"
  cat > packages/@n8n/privacy-layer/tsconfig.json << EOL
{
  "extends": "@n8n/typescript-config/tsconfig.common.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "baseUrl": "."
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
EOL
fi

if [ ! -f "packages/@n8n/privacy-layer/tsconfig.build.json" ]; then
  echo -e "${YELLOW}Creating tsconfig.build.json for privacy-layer...${NC}"
  cat > packages/@n8n/privacy-layer/tsconfig.build.json << EOL
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
EOL
fi

# Step 5: Create basic source file if it doesn't exist
if [ ! -f "packages/@n8n/privacy-layer/src/index.ts" ]; then
  echo -e "${YELLOW}Creating basic source file for privacy-layer...${NC}"
  cat > packages/@n8n/privacy-layer/src/index.ts << EOL
/**
 * Privacy Layer for n8n AI Agent Platform
 * This module provides tools for ensuring user data privacy and compliance
 */

import { z } from 'zod';

/**
 * Privacy impact level for data processing
 */
export enum PrivacyImpactLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * Configuration schema for privacy settings
 */
export const PrivacyConfigSchema = z.object({
  enabled: z.boolean().default(true),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  redactionEnabled: z.boolean().default(true),
  encryptionEnabled: z.boolean().default(true),
  retentionPeriodDays: z.number().int().positive().default(30),
});

export type PrivacyConfig = z.infer<typeof PrivacyConfigSchema>;

/**
 * Privacy Layer service for handling data privacy concerns
 */
export class PrivacyService {
  private config: PrivacyConfig;

  constructor(config?: Partial<PrivacyConfig>) {
    this.config = PrivacyConfigSchema.parse(config || {});
  }

  /**
   * Redacts sensitive information from text
   */
  redact(text: string, patterns?: RegExp[]): string {
    if (!this.config.redactionEnabled) return text;
    
    const defaultPatterns = [
      // Email addresses
      /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g,
      // Phone numbers (simple pattern)
      /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g,
      // SSN
      /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
    ];

    const patternsToUse = patterns || defaultPatterns;
    let redactedText = text;
    
    patternsToUse.forEach(pattern => {
      redactedText = redactedText.replace(pattern, '[REDACTED]');
    });
    
    return redactedText;
  }

  /**
   * Assesses the privacy impact of data
   */
  assessPrivacyImpact(data: unknown): PrivacyImpactLevel {
    // Simple implementation - real version would have more sophisticated logic
    const stringData = JSON.stringify(data);
    
    if (stringData.length < 10) return PrivacyImpactLevel.NONE;
    if (stringData.length < 100) return PrivacyImpactLevel.LOW;
    if (stringData.length < 1000) return PrivacyImpactLevel.MEDIUM;
    return PrivacyImpactLevel.HIGH;
  }
}

export default PrivacyService;
EOL
fi

# Step 6: Create a basic test file
if [ ! -f "packages/@n8n/privacy-layer/src/index.test.ts" ]; then
  echo -e "${YELLOW}Creating test file for privacy-layer...${NC}"
  mkdir -p packages/@n8n/privacy-layer/src
  cat > packages/@n8n/privacy-layer/src/index.test.ts << EOL
import { PrivacyService, PrivacyImpactLevel } from './index';

describe('PrivacyService', () => {
  let privacyService: PrivacyService;
  
  beforeEach(() => {
    privacyService = new PrivacyService();
  });
  
  describe('redact', () => {
    it('should redact email addresses', () => {
      const text = 'Contact me at test@example.com for details';
      const redacted = privacyService.redact(text);
      expect(redacted).toEqual('Contact me at [REDACTED] for details');
    });
    
    it('should redact phone numbers', () => {
      const text = 'Call me at (555) 123-4567';
      const redacted = privacyService.redact(text);
      expect(redacted).toEqual('Call me at [REDACTED]');
    });
    
    it('should handle empty text', () => {
      const text = '';
      const redacted = privacyService.redact(text);
      expect(redacted).toEqual('');
    });
  });
  
  describe('assessPrivacyImpact', () => {
    it('should assess small data as NONE impact', () => {
      const impact = privacyService.assessPrivacyImpact('123');
      expect(impact).toEqual(PrivacyImpactLevel.NONE);
    });
    
    it('should assess medium data as MEDIUM impact', () => {
      const impact = privacyService.assessPrivacyImpact('x'.repeat(500));
      expect(impact).toEqual(PrivacyImpactLevel.MEDIUM);
    });
    
    it('should assess large data as HIGH impact', () => {
      const impact = privacyService.assessPrivacyImpact('x'.repeat(1500));
      expect(impact).toEqual(PrivacyImpactLevel.HIGH);
    });
  });
});
EOL
fi

# Step 7: Create a basic jest.config.js file
if [ ! -f "packages/@n8n/privacy-layer/jest.config.js" ]; then
  echo -e "${YELLOW}Creating jest.config.js for privacy-layer...${NC}"
  cat > packages/@n8n/privacy-layer/jest.config.js << EOL
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
};
EOL
fi

# Step 8: Create .eslintrc.js for linting
if [ ! -f "packages/@n8n/privacy-layer/.eslintrc.js" ]; then
  echo -e "${YELLOW}Creating .eslintrc.js for privacy-layer...${NC}"
  cat > packages/@n8n/privacy-layer/.eslintrc.js << EOL
module.exports = {
  extends: ['../../.eslintrc.js'],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
  },
};
EOL
fi

# Step 9: Install dependencies at the workspace level if needed
echo -e "${BLUE}Installing dependencies...${NC}"
pnpm install || {
  echo -e "${YELLOW}Warning: pnpm install failed, but continuing...${NC}"
}

echo -e "${GREEN}Setup complete for @n8n/privacy-layer package!${NC}"
echo
echo -e "${BLUE}Now you can run:${NC}"
echo -e "${YELLOW}- pnpm test --filter @n8n/privacy-layer${NC}"
echo -e "${YELLOW}- pnpm build --filter @n8n/privacy-layer${NC}"
echo -e "${YELLOW}- pnpm lint --filter @n8n/privacy-layer${NC}"
