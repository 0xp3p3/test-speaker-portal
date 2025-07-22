import type { Server } from "socket.io"
import jwt from "jsonwebtoken"
import { prisma } from "../config/database"

export const setupSocketHandlers = (io: Server) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error("Authentication error"))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true },
      })

      if (!user) {
        return next(new Error("User not found"))
      }

      socket.userId = user.id
      socket.user = user
      next()
    } catch (error) {
      next(new Error("Authentication error"))
    }
  })

  io.on("connection", (socket) => {
    console.log(`User ${socket.user.name} connected`)

    // Join user to their personal room for notifications
    socket.join(`user_${socket.userId}`)

    // Join user's conversations
    socket.on("join_conversations", async () => {
      try {
        const conversations = await prisma.conversationUser.findMany({
          where: { userId: socket.userId },
          select: { conversationId: true },
        })

        conversations.forEach((conv) => {
          socket.join(`conversation_${conv.conversationId}`)
        })
      } catch (error) {
        console.error("Error joining conversations:", error)
      }
    })

    // Handle joining specific conversation
    socket.on("join_conversation", (conversationId: string) => {
      socket.join(`conversation_${conversationId}`)
    })

    // Handle leaving conversation
    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(`conversation_${conversationId}`)
    })

    // Handle typing indicators
    socket.on("typing_start", (data: { conversationId: string }) => {
      socket.to(`conversation_${data.conversationId}`).emit("user_typing", {
        userId: socket.userId,
        userName: socket.user.name,
        conversationId: data.conversationId,
      })
    })

    socket.on("typing_stop", (data: { conversationId: string }) => {
      socket.to(`conversation_${data.conversationId}`).emit("user_stopped_typing", {
        userId: socket.userId,
        conversationId: data.conversationId,
      })
    })

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User ${socket.user.name} disconnected`)
    })
  })
}

// Extend socket interface
declare module "socket.io" {
  interface Socket {
    userId: string
    user: {
      id: string
      name: string
      email: string
    }
  }
}
