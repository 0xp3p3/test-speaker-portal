"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import { socketService } from "@/lib/socket"

interface Message {
  id: string
  conversationId: string
  senderId: string
  receiverId?: string
  content: string
  messageType: string
  isRead: boolean
  createdAt: string
  sender: {
    id: string
    name: string
    photo?: string
  }
}

interface Conversation {
  id: string
  title?: string
  isGroup: boolean
  participants: Array<{
    id: string
    name: string
    photo?: string
  }>
  lastMessage?: Message
  unreadCount: number
  updatedAt: string
}

export function useMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)

  useEffect(() => {
    fetchConversations()
    setupSocketListeners()

    return () => {
      socketService.removeAllListeners()
    }
  }, [])

  const setupSocketListeners = () => {
    socketService.onNewMessage((message: Message) => {
      if (selectedConversation === message.conversationId) {
        setMessages((prev) => [...prev, message])
      }
      // Update conversation list
      fetchConversations()
    })

    socketService.onMessageNotification((notification) => {
      // Handle message notifications
      fetchConversations()
    })
  }

  const fetchConversations = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getConversations()
      setConversations(response.conversations || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getMessages(conversationId)
      setMessages(response.messages || [])
      setSelectedConversation(conversationId)
      socketService.joinConversation(conversationId)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (messageData: {
    conversationId?: string
    receiverId?: string
    content: string
    messageType?: "TEXT" | "IMAGE" | "FILE"
  }) => {
    try {
      setError(null)
      const response = await apiClient.sendMessage(messageData)

      if (response.data && selectedConversation === response.data.conversationId) {
        setMessages((prev) => [...prev, response.data])
      }

      // Update conversations list
      fetchConversations()

      return response.data
    } catch (error: any) {
      setError(error.message)
      throw error
    }
  }

  const createGroupConversation = async (data: {
    title: string
    participantIds: string[]
  }) => {
    try {
      setError(null)
      const response = await apiClient.createGroupConversation(data)
      if (response.conversation) {
        setConversations((prev) => [response.conversation, ...prev])
      }
      return response.conversation
    } catch (error: any) {
      setError(error.message)
      throw error
    }
  }

  return {
    conversations,
    messages,
    loading,
    error,
    selectedConversation,
    fetchConversations,
    fetchMessages,
    sendMessage,
    createGroupConversation,
    setSelectedConversation,
    clearError: () => setError(null),
  }
}
