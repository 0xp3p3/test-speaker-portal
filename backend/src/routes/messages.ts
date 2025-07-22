import { Router } from "express"
import { prisma } from "../config/database"
import { authenticateToken } from "../middleware/auth"
import { validateRequest, createMessageSchema } from "../middleware/validation"
import type { AuthRequest, CreateMessageData } from "../types"
import { createError } from "../middleware/errorHandler"
import { io } from "../server"

const router = Router()

// Get user's conversations
router.get("/conversations", authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                photo: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: userId },
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    // Format conversations for frontend
    const formattedConversations = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      isGroup: conv.isGroup,
      participants: conv.participants.filter((p) => p.userId !== userId).map((p) => p.user),
      lastMessage: conv.messages[0] || null,
      unreadCount: conv._count.messages,
      updatedAt: conv.updatedAt,
    }))

    res.json({ conversations: formattedConversations })
  } catch (error) {
    next(error)
  }
})

// Get messages in a conversation
router.get("/conversations/:id/messages", authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id: conversationId } = req.params
    const { page = 1, limit = 50 } = req.query
    const userId = req.user!.id
    const skip = (Number(page) - 1) * Number(limit)

    // Check if user is participant in conversation
    const participation = await prisma.conversationUser.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    })

    if (!participation) {
      throw createError("Not authorized to view this conversation", 403)
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
    })

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    })

    // Update last read timestamp
    await prisma.conversationUser.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: { lastReadAt: new Date() },
    })

    res.json({
      messages: messages.reverse(),
      pagination: {
        page: Number(page),
        limit: Number(limit),
      },
    })
  } catch (error) {
    next(error)
  }
})

// Send message
router.post("/send", authenticateToken, validateRequest(createMessageSchema), async (req: AuthRequest, res, next) => {
  try {
    const messageData: CreateMessageData = req.body
    const senderId = req.user!.id

    let conversationId = messageData.conversationId

    // If no conversation ID provided, create or find direct conversation
    if (!conversationId && messageData.receiverId) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          participants: {
            every: {
              userId: {
                in: [senderId, messageData.receiverId],
              },
            },
          },
        },
        include: {
          participants: true,
        },
      })

      if (existingConversation && existingConversation.participants.length === 2) {
        conversationId = existingConversation.id
      } else {
        // Create new conversation
        const newConversation = await prisma.conversation.create({
          data: {
            isGroup: false,
            participants: {
              create: [{ userId: senderId }, { userId: messageData.receiverId }],
            },
          },
        })
        conversationId = newConversation.id
      }
    }

    if (!conversationId) {
      throw createError("Conversation ID or receiver ID required", 400)
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        receiverId: messageData.receiverId,
        content: messageData.content,
        messageType: messageData.messageType || "TEXT",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    // Emit real-time message to conversation participants
    io.to(`conversation_${conversationId}`).emit("new_message", message)

    // Send notification to receiver if it's a direct message
    if (messageData.receiverId) {
      io.to(`user_${messageData.receiverId}`).emit("message_notification", {
        conversationId,
        sender: message.sender,
        content: messageData.content,
      })
    }

    res.status(201).json({
      message: "Message sent successfully",
      data: message,
    })
  } catch (error) {
    next(error)
  }
})

// Create group conversation
router.post("/conversations", authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { title, participantIds } = req.body
    const userId = req.user!.id

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      throw createError("Participant IDs required", 400)
    }

    // Include creator in participants
    const allParticipantIds = [...new Set([userId, ...participantIds])]

    const conversation = await prisma.conversation.create({
      data: {
        title,
        isGroup: true,
        participants: {
          create: allParticipantIds.map((id) => ({ userId: id })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                photo: true,
              },
            },
          },
        },
      },
    })

    res.status(201).json({
      message: "Group conversation created successfully",
      conversation,
    })
  } catch (error) {
    next(error)
  }
})

export { router as messageRoutes }
