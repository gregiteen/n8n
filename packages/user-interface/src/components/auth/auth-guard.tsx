"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUserStore } from "@/stores"

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  fallback?: React.ReactNode
}

export function AuthGuard({ 
  children, 
  redirectTo = "/auth", 
  fallback = <div className="flex items-center justify-center min-h-screen">Loading...</div> 
}: AuthGuardProps) {
  const router = useRouter()
  const { currentUser, isLoading, initializeAuth } = useUserStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push(redirectTo)
    }
  }, [currentUser, isLoading, router, redirectTo])

  if (isLoading) {
    return <>{fallback}</>
  }

  if (!currentUser) {
    return null
  }

  return <>{children}</>
}

interface PublicOnlyProps {
  children: React.ReactNode
  redirectTo?: string
}

export function PublicOnly({ children, redirectTo = "/" }: PublicOnlyProps) {
  const router = useRouter()
  const { currentUser, isLoading, initializeAuth } = useUserStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    if (!isLoading && currentUser) {
      router.push(redirectTo)
    }
  }, [currentUser, isLoading, router, redirectTo])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (currentUser) {
    return null
  }

  return <>{children}</>
}
