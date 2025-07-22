"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import { socketService } from "@/lib/socket"

interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  isRead: boolean
  data?: any
  createdAt: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNotifications()
    setupSocketListeners()

    return () => {
      socketService.removeAllListeners()
    }
  }, [])

  const setupSocketListeners = () => {
    socketService.onNotification((notification: Notification) => {
      setNotifications((prev) => [notification, ...prev])
      setUnreadCount((prev) => prev + 1)
    })
  }

  const fetchNotifications = async (params?: {
    page?: number
    limit?: number
    unread?: boolean
  }) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getNotifications(params)
      setNotifications(response.notifications || [])
      setUnreadCount(response.unreadCount || 0)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      setError(null)
      await apiClient.markNotificationAsRead(id)
      setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error: any) {
      setError(error.message)
    }
  }

  const markAllAsRead = async () => {
    try {
      setError(null)
      await apiClient.markAllNotificationsAsRead()
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })))
      setUnreadCount(0)
    } catch (error: any) {
      setError(error.message)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      setError(null)
      await apiClient.deleteNotification(id)
      setNotifications((prev) => prev.filter((notif) => notif.id !== id))
    } catch (error: any) {
      setError(error.message)
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearError: () => setError(null),
  }
}
