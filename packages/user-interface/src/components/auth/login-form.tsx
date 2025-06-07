"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useUserStore } from "@/stores"

interface LoginFormProps {
  onSwitchToRegister?: () => void
  redirectPath?: string
}

export function LoginForm({ onSwitchToRegister, redirectPath = "/" }: LoginFormProps) {
  const router = useRouter()
  const { login, isLoading, error } = useUserStore()
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await login(formData.email, formData.password)
      router.push(redirectPath)
    } catch (err) {
      // Error is handled by the store
      console.error("Login failed:", err)
    }
  }

  const isFormValid = formData.email && formData.password

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <h2 className="text-2xl font-bold text-center">Sign In</h2>
        <p className="text-sm text-muted-foreground text-center">
          Enter your credentials to access the n8n AI Platform
        </p>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
              required
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
          
          {onSwitchToRegister && (
            <div className="text-sm text-center">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-primary hover:underline"
                disabled={isLoading}
              >
                Sign up
              </button>
            </div>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
