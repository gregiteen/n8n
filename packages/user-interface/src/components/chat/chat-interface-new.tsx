'use client';

import React from 'react';
import { Send, Paperclip, Bot, User, Settings } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useAgentStore } from '@/stores';

export function ChatInterface() {
  const { 
    agents, 
    selectedAgentId, 
    chatMessages, 
    loading, 
    error,
    fetchAgents, 
    selectAgent, 
    sendMessage 
  } = useAgentStore();
  
  const [message, setMessage] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  React.useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedAgentId) return;

    try {
      await sendMessage(selectedAgentId, message);
      setMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedAgent = agents.find(agent => agent.id === selectedAgentId);
  const currentMessages = selectedAgentId ? chatMessages[selectedAgentId] || [] : [];

  return (
    <div className="flex h-[calc(100vh-8rem)] space-x-6">
      {/* Agent Sidebar */}
      <div className="w-80 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Agents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && agents.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                Loading agents...
              </div>
            ) : agents.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No agents available
              </div>
            ) : (
              agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => selectAgent(agent.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border transition-colors',
                    selectedAgentId === agent.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{agent.avatar || '🤖'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium truncate">{agent.name}</p>
                        <div
                          className={cn(
                            'h-2 w-2 rounded-full',
                            agent.status === 'active' && 'bg-green-500',
                            agent.status === 'idle' && 'bg-yellow-500',
                            agent.status === 'busy' && 'bg-red-500',
                            agent.status === 'offline' && 'bg-gray-500'
                          )}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">
                        {agent.type} • {agent.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(agent.lastActivity)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
            
            {error && (
              <div className="text-center text-red-500 py-4 text-sm">
                Error: {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Details */}
        {selectedAgent && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agent Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedAgent.capabilities?.map((capability) => (
                  <span
                    key={capability}
                    className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-full"
                  >
                    {capability}
                  </span>
                )) || (
                  <span className="text-muted-foreground text-sm">No capabilities listed</span>
                )}
              </div>
              {selectedAgent.currentTaskId && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-medium">Current Task</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedAgent.currentTaskId}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          {/* Chat Header */}
          <CardHeader className="border-b">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{selectedAgent?.avatar || '🤖'}</div>
              <div>
                <CardTitle className="text-lg">{selectedAgent?.name || 'Select an Agent'}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedAgent?.status === 'active' && 'Online and ready to help'}
                  {selectedAgent?.status === 'idle' && 'Available'}
                  {selectedAgent?.status === 'busy' && 'Currently handling another task'}
                  {selectedAgent?.status === 'offline' && 'Offline'}
                  {!selectedAgent && 'Choose an agent to start chatting'}
                </p>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-auto p-0">
            <div className="space-y-4 p-4">
              {!selectedAgent ? (
                <div className="text-center text-muted-foreground py-8">
                  Select an AI agent from the sidebar to start a conversation
                </div>
              ) : currentMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-start space-x-2 max-w-[70%]',
                        msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      )}
                    >
                      <div
                        className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center text-sm',
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        )}
                      >
                        {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div
                        className={cn(
                          'rounded-lg px-3 py-2',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatRelativeTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>

          {/* Message Input */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" disabled={!selectedAgent}>
                <Paperclip className="h-4 w-4" />
              </Button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={selectedAgent ? "Type your message..." : "Select an agent first..."}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={!selectedAgent || loading}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <Button 
                onClick={handleSendMessage}
                disabled={!message.trim() || !selectedAgent || loading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
