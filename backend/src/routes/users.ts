import { Router } from "express"
import { prisma } from "../config/database"
import { authenticateToken } from "../middleware/auth"
import { validateRequest, updateProfileSchema } from "../middleware/validation"
import type { AuthRequest } from "../types"
import { createError } from "../middleware/errorHandler"

const router = Router()

// Get current user profile
router.get("/profile", authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        photo: true,
        expertise: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            eventsAsOrganizer: true,
            eventRSVPs: true,
          },
        },
      },
    })

    res.json({ user })
  } catch (error) {
    next(error)
  }
})

// Update user profile
router.put("/profile", authenticateToken, validateRequest(updateProfileSchema), async (req: AuthRequest, res, next) => {
  try {
    const { name, bio, expertise } = req.body

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(expertise && { expertise }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        photo: true,
        expertise: true,
        role: true,
        updatedAt: true,
      },
    })

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    next(error)
  }
})

// Get all speakers (public endpoint for discovery)
router.get("/speakers", async (req, res, next) => {
  try {
    const { page = 1, limit = 10, expertise } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where = {
      role: "SPEAKER" as const,
      ...(expertise && {
        expertise: {
          has: expertise as string,
        },
      }),
    }

    const [speakers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          bio: true,
          photo: true,
          expertise: true,
          _count: {
            select: {
              eventsAsOrganizer: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ])

    res.json({
      speakers,
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

// Get speaker by ID
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params

    const speaker = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        bio: true,
        photo: true,
        expertise: true,
        createdAt: true,
        eventsAsOrganizer: {
          select: {
            id: true,
            title: true,
            description: true,
            date: true,
            time: true,
            status: true,
            _count: {
              select: {
                rsvps: true,
                attendees: true,
              },
            },
          },
          where: {
            status: "COMPLETED",
          },
          orderBy: { date: "desc" },
          take: 5,
        },
        _count: {
          select: {
            eventsAsOrganizer: true,
          },
        },
      },
    })

    if (!speaker) {
      throw createError("Speaker not found", 404)
    }

    res.json({ speaker })
  } catch (error) {
    next(error)
  }
})

export { router as userRoutes }
