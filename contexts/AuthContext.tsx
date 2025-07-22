"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { apiClient } from "@/lib/api"
import { socketService } from "@/lib/socket"

interface User {
  id: string
  email: string
  name: string
  bio?: string
  photo?: string
  expertise?: string[]
  role: string
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (userData: {
    email: string
    password: string
    name: string
    bio?: string
    expertise?: string[]
  }) => Promise<void>
  logout: () => void
  updateProfile: (profileData: {
    name?: string
    bio?: string
    expertise?: string[]
  }) => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setLoading(false)
        return
      }

      apiClient.setToken(token)
      const response = await apiClient.verifyToken()

      if (response.user) {
        setUser(response.user)
        // Connect to socket with token
        socketService.connect(token)
      } else {
        localStorage.removeItem("auth_token")
        apiClient.setToken(null)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      localStorage.removeItem("auth_token")
      apiClient.setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.login({ email, password })

      if (response.user && response.token) {
        setUser(response.user)
        apiClient.setToken(response.token)
        // Connect to socket
        socketService.connect(response.token)
      }
    } catch (error: any) {
      setError(error.message || "Login failed")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: {
    email: string
    password: string
    name: string
    bio?: string
    expertise?: string[]
  }) => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.register(userData)

      if (response.user && response.token) {
        setUser(response.user)
        apiClient.setToken(response.token)
        // Connect to socket
        socketService.connect(response.token)
      }
    } catch (error: any) {
      setError(error.message || "Registration failed")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    apiClient.setToken(null)
    socketService.disconnect()
    localStorage.removeItem("auth_token")
  }

  const updateProfile = async (profileData: {
    name?: string
    bio?: string
    expertise?: string[]
  }) => {
    try {
      setError(null)
      const response = await apiClient.updateProfile(profileData)

      if (response.user) {
        setUser(response.user)
      }
    } catch (error: any) {
      setError(error.message || "Profile update failed")
      throw error
    }
  }

  const clearError = () => {
    setError(null)
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
