import { io, type Socket } from "socket.io-client"

class SocketService {
  private socket: Socket | null = null
  private token: string | null = null

  connect(token: string) {
    this.token = token

    if (this.socket?.connected) {
      this.socket.disconnect()
    }

    this.socket = io(process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000", {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
    })

    this.socket.on("connect", () => {
      console.log("Connected to server")
      this.socket?.emit("join_conversations")
    })

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server")
    })

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket() {
    return this.socket
  }

  // Message events
  onNewMessage(callback: (message: any) => void) {
    this.socket?.on("new_message", callback)
  }

  onMessageNotification(callback: (notification: any) => void) {
    this.socket?.on("message_notification", callback)
  }

  // Typing events
  onUserTyping(callback: (data: any) => void) {
    this.socket?.on("user_typing", callback)
  }

  onUserStoppedTyping(callback: (data: any) => void) {
    this.socket?.on("user_stopped_typing", callback)
  }

  emitTypingStart(conversationId: string) {
    this.socket?.emit("typing_start", { conversationId })
  }

  emitTypingStop(conversationId: string) {
    this.socket?.emit("typing_stop", { conversationId })
  }

  // Conversation events
  joinConversation(conversationId: string) {
    this.socket?.emit("join_conversation", conversationId)
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit("leave_conversation", conversationId)
  }

  // Notification events
  onNotification(callback: (notification: any) => void) {
    this.socket?.on("notification", callback)
  }

  // Remove listeners
  removeAllListeners() {
    this.socket?.removeAllListeners()
  }
}

export const socketService = new SocketService()
