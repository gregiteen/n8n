"use client"

import React, { useState } from "react"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"

interface AuthPageProps {
  initialMode?: "login" | "register"
  redirectPath?: string
}

export function AuthPage({ initialMode = "login", redirectPath }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {mode === "login" ? (
          <LoginForm
            onSwitchToRegister={() => setMode("register")}
            redirectPath={redirectPath}
          />
        ) : (
          <RegisterForm
            onSwitchToLogin={() => setMode("login")}
            redirectPath={redirectPath}
          />
        )}
      </div>
    </div>
  )
}
