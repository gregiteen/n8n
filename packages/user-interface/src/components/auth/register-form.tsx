"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useUserStore } from "@/stores"

interface RegisterFormProps {
  onSwitchToLogin?: () => void
  redirectPath?: string
}

export function RegisterForm({ onSwitchToLogin, redirectPath = "/" }: RegisterFormProps) {
  const router = useRouter()
  const { register, isLoading, error } = useUserStore()
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([])
    }
  }

  const validateForm = (): boolean => {
    const errors: string[] = []
    
    if (!formData.name.trim()) {
      errors.push("Name is required")
    }
    
    if (!formData.email.trim()) {
      errors.push("Email is required")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Please enter a valid email address")
    }
    
    if (!formData.password) {
      errors.push("Password is required")
    } else if (formData.password.length < 6) {
      errors.push("Password must be at least 6 characters long")
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.push("Passwords do not match")
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password
      })
      
      router.push(redirectPath)
    } catch (err) {
      // Error is handled by the store
      console.error("Registration failed:", err)
    }
  }

  const isFormValid = formData.name && formData.email && formData.password && formData.confirmPassword

  const displayError = error || (validationErrors.length > 0 ? validationErrors[0] : null)

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <h2 className="text-2xl font-bold text-center">Create Account</h2>
        <p className="text-sm text-muted-foreground text-center">
          Sign up to get started with the n8n AI Platform
        </p>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {displayError && (
            <Alert variant="destructive">
              <AlertDescription>
                {displayError}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isLoading}
              required
            />
          </div>
          
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
            <p className="text-xs text-muted-foreground">
              Password must be at least 6 characters long
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
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
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
          
          {onSwitchToLogin && (
            <div className="text-sm text-center">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-primary hover:underline"
                disabled={isLoading}
              >
                Sign in
              </button>
            </div>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
