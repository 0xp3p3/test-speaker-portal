"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, MessageSquare } from "lucide-react"
import { useMessages } from "@/hooks/useMessages"
import { useAuth } from "@/contexts/AuthContext"

export function MessagingPanel() {
  const { user } = useAuth()
  const {
    conversations,
    messages,
    loading,
    error,
    selectedConversation,
    fetchMessages,
    sendMessage,
    setSelectedConversation,
    clearError,
  } = useMessages()
  const [newMessage, setNewMessage] = useState("")

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      await sendMessage({
        conversationId: selectedConversation,
        content: newMessage.trim(),
      })
      setNewMessage("")
    } catch (error) {
      // Error is handled by the hook
    }
  }

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId)
    fetchMessages(conversationId)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Conversations</CardTitle>
          <CardDescription>Your recent messages</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <Alert variant="destructive" className="m-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && conversations.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 cursor-pointer hover:bg-muted/50 border-b ${
                    selectedConversation === conversation.id ? "bg-muted" : ""
                  }`}
                  onClick={() => handleConversationSelect(conversation.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-sm">
                      {conversation.isGroup
                        ? conversation.title
                        : conversation.participants.map((p) => p.name).join(", ")}
                    </h4>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="default" className="text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                  {conversation.lastMessage && (
                    <p className="text-xs text-muted-foreground truncate">{conversation.lastMessage.content}</p>
                  )}
                </div>
              ))}
              {conversations.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations yet</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {selectedConversation
              ? conversations.find((c) => c.id === selectedConversation)?.isGroup
                ? conversations.find((c) => c.id === selectedConversation)?.title
                : conversations
                    .find((c) => c.id === selectedConversation)
                    ?.participants.map((p) => p.name)
                    .join(", ")
              : "Select a conversation"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-[480px]">
          {selectedConversation ? (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {loading && messages.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.senderId === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">{formatTime(message.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
