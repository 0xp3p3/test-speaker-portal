import { Router } from "express"
import { prisma } from "../config/database"
import { authenticateToken } from "../middleware/auth"
import type { AuthRequest } from "../types"

const router = Router()

// Get user notifications
router.get("/", authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id
    const { page = 1, limit = 20, unread = "false" } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where = {
      userId,
      ...(unread === "true" && { isRead: false }),
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ])

    res.json({
      notifications,
      unreadCount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (error) {
    next(error)
  }
})

// Mark notification as read
router.put("/:id/read", authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const notification = await prisma.notification.update({
      where: {
        id,
        userId, // Ensure user can only update their own notifications
      },
      data: { isRead: true },
    })

    res.json({
      message: "Notification marked as read",
      notification,
    })
  } catch (error) {
    next(error)
  }
})

// Mark all notifications as read
router.put("/read-all", authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    })

    res.json({ message: "All notifications marked as read" })
  } catch (error) {
    next(error)
  }
})

// Delete notification
router.delete("/:id", authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    await prisma.notification.delete({
      where: {
        id,
        userId,
      },
    })

    res.json({ message: "Notification deleted successfully" })
  } catch (error) {
    next(error)
  }
})

export { router as notificationRoutes }
