# API Key Management Component Design

## Overview

The API Key Management component provides a user interface for users to securely store and manage their API keys for various AI services. This component is critical for the "bring your own keys" model of our platform, where users maintain control over their AI service access.

## Component Requirements

### 1. User Interface

- **Settings Page Integration**
  - Located in the user settings area
  - Clear section for "AI Service Connections"
  - Visual indicators for connected/disconnected services

- **Key Input Forms**
  - Input fields for each supported AI service:
    - OpenAI
    - Anthropic
    - Google Gemini
    - OpenRouter
  - Password/masked input style for security
  - Show/hide toggle for key visibility
  - Validation indicators (valid/invalid)

- **Status Indicators**
  - Connection status for each service
  - Last validation timestamp
  - Usage statistics (if available from the API)

### 2. Functionality

- **Key Validation**
  - Automatic validation on key entry/update
  - Periodic re-validation (configurable)
  - Graceful error handling for invalid keys

- **Key Storage**
  - Secure encryption before storage
  - Stored in user profile in Supabase
  - Never exposed in frontend code

- **Key Management**
  - Add/update/remove keys
  - Key rotation support
  - Auto-detection of key format validity

### 3. Security Considerations

- **Encryption**
  - Keys encrypted at rest
  - Keys only decrypted when needed for API calls
  - Keys never logged

- **Access Control**
  - Only accessible to the key owner
  - Admin cannot see user keys
  - Log access attempts

- **Best Practices**
  - No client-side storage of keys
  - No exposure in URLs
  - Rate limiting on validation attempts

## Implementation Details

### Database Schema

```sql
CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT FALSE,
  last_validated TIMESTAMP WITH TIME ZONE,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, service_name)
);

-- Row level security policies
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own API keys"
  ON user_api_keys
  FOR ALL
  USING (auth.uid() = user_id);
```

### UI Component Structure

```jsx
// ApiKeyManagement.tsx
import React, { useState, useEffect } from 'react';
import { KeyInput } from './KeyInput';
import { validateKey } from '@/lib/api-key-validation';
import { useSupabase } from '@/lib/supabase';
import { Alert } from '@/components/ui/alert';

export const ApiKeyManagement = () => {
  // Component implementation
};

// KeyInput.tsx
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

export const KeyInput = ({ 
  serviceName, 
  initialValue, 
  isValid, 
  onSave,
  onValidate,
}) => {
  // Component implementation
};
```

### Backend Functions

```typescript
// Key validation function
export async function validateApiKey(
  service: 'openai' | 'anthropic' | 'gemini' | 'openrouter',
  key: string
): Promise<boolean> {
  try {
    // Implementation varies by service
    switch(service) {
      case 'openai':
        return await validateOpenAIKey(key);
      case 'anthropic':
        return await validateAnthropicKey(key);
      // etc.
    }
  } catch (error) {
    console.error(`Error validating ${service} key:`, error);
    return false;
  }
}

// Key encryption/decryption
export function encryptApiKey(key: string): string {
  // Secure encryption implementation
}

export function decryptApiKey(encryptedKey: string): string {
  // Secure decryption implementation
}
```

## User Experience Flow

1. User navigates to Settings > AI Services
2. User sees status of all connected AI services
3. User clicks to add/update a service key
4. User enters API key
5. System validates key in real-time
6. On success:
   - Shows success message
   - Updates status to connected
   - Saves encrypted key to database
7. On failure:
   - Shows error message with guidance
   - Maintains invalid status

## Error States and Messaging

| Error Type | User Message | Action |
|------------|--------------|--------|
| Invalid key format | "This doesn't appear to be a valid [Service] API key. Please check the format." | Show format example |
| Authentication failed | "We couldn't authenticate with [Service]. Please check your key." | Link to service dashboard |
| Rate limited | "Your [Service] account appears to be rate limited." | Suggest checking usage |
| Service unavailable | "We couldn't reach [Service] to verify your key. Please try again later." | Retry option |

## Mockups

```
┌─────────────────────────────────────────────────────────────┐
│ Settings > AI Services                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AI Service Connections                                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ OpenAI                                        ✓     │    │
│  │ ●●●●●●●●●●●●●●●●●●●●●●●●●●●●●           👁️  Update │    │
│  │ Connected - Last verified: Today, 2:30 PM           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Anthropic                                     ✗     │    │
│  │ [                                         ]   👁️  Save  │    │
│  │ Not connected                                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Google Gemini                                 ✓     │    │
│  │ ●●●●●●●●●●●●●●●●●●●●●●●●●●●●                👁️  Update │    │
│  │ Connected - Last verified: Yesterday, 10:15 AM      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ OpenRouter                                    ✗     │    │
│  │ [                                         ]   👁️  Save  │    │
│  │ Not connected                                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Timeline

1. **Week 1: Core UI Components**
   - Basic UI layout and forms
   - Key validation logic
   - Database schema implementation

2. **Week 2: Security and Validation**
   - Key encryption implementation
   - Service validation endpoints
   - Error handling

3. **Week 3: Integration and Testing**
   - Integration with main app
   - Security testing
   - User testing and feedback

## Success Metrics

- **Security**: No key exposure incidents
- **Usability**: >90% successful key validations on first attempt
- **Reliability**: >99% uptime for validation services
