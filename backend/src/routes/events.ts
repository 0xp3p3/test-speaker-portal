import { Router } from "express"
import { prisma } from "../config/database"
import { authenticateToken } from "../middleware/auth"
import { validateRequest, createEventSchema } from "../middleware/validation"
import type { AuthRequest, CreateEventData, UpdateEventData } from "../types"
import { createError } from "../middleware/errorHandler"
import { zoomService } from "../services/zoomService"
import { notificationService } from "../services/notificationService"

const router = Router()

// Get all events (with filters)
router.get("/", async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, organizerId, upcoming = "false" } = req.query

    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {
      isPublic: true,
      ...(status && { status }),
      ...(organizerId && { organizerId: organizerId as string }),
      ...(upcoming === "true" && {
        date: {
          gte: new Date(),
        },
      }),
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              photo: true,
              expertise: true,
            },
          },
          _count: {
            select: {
              rsvps: true,
              attendees: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { date: "asc" },
      }),
      prisma.event.count({ where }),
    ])

    res.json({
      events,
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

// Get user's events (as organizer or attendee)
router.get("/my-events", authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id
    const { type = "all" } = req.query

    let events

    if (type === "organized") {
      events = await prisma.event.findMany({
        where: { organizerId: userId },
        include: {
          _count: {
            select: {
              rsvps: true,
              attendees: true,
            },
          },
          rsvps: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { date: "asc" },
      })
    } else if (type === "attending") {
      const rsvps = await prisma.eventRSVP.findMany({
        where: {
          userId,
          status: "YES",
        },
        include: {
          event: {
            include: {
              organizer: {
                select: {
                  id: true,
                  name: true,
                  photo: true,
                },
              },
              _count: {
                select: {
                  rsvps: true,
                  attendees: true,
                },
              },
            },
          },
        },
        orderBy: { event: { date: "asc" } },
      })
      events = rsvps.map((rsvp) => rsvp.event)
    } else {
      // All events (organized + attending)
      const [organizedEvents, attendingRSVPs] = await Promise.all([
        prisma.event.findMany({
          where: { organizerId: userId },
          include: {
            organizer: {
              select: {
                id: true,
                name: true,
                photo: true,
              },
            },
            _count: {
              select: {
                rsvps: true,
                attendees: true,
              },
            },
          },
        }),
        prisma.eventRSVP.findMany({
          where: {
            userId,
            status: "YES",
          },
          include: {
            event: {
              include: {
                organizer: {
                  select: {
                    id: true,
                    name: true,
                    photo: true,
                  },
                },
                _count: {
                  select: {
                    rsvps: true,
                    attendees: true,
                  },
                },
              },
            },
          },
        }),
      ])

      const attendingEvents = attendingRSVPs.map((rsvp) => rsvp.event)
      events = [...organizedEvents, ...attendingEvents].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      )
    }

    res.json({ events })
  } catch (error) {
    next(error)
  }
})

// Create new event
router.post("/", authenticateToken, validateRequest(createEventSchema), async (req: AuthRequest, res, next) => {
  try {
    const eventData: CreateEventData = req.body
    const organizerId = req.user!.id

    // Create Zoom meeting
    const zoomMeeting = await zoomService.createMeeting({
      topic: eventData.title,
      start_time: `${eventData.date}T${eventData.time}:00`,
      duration: 60,
    })

    // Create event in database
    const event = await prisma.event.create({
      data: {
        title: eventData.title,
        description: eventData.description,
        date: new Date(`${eventData.date}T${eventData.time}:00`),
        time: eventData.time,
        organizerId,
        maxAttendees: eventData.maxAttendees,
        isPublic: eventData.isPublic ?? true,
        zoomLink: zoomMeeting?.join_url,
        zoomMeetingId: zoomMeeting?.id?.toString(),
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            photo: true,
            expertise: true,
          },
        },
      },
    })

    res.status(201).json({
      message: "Event created successfully",
      event,
    })
  } catch (error) {
    next(error)
  }
})

// Get event by ID
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            bio: true,
            photo: true,
            expertise: true,
          },
        },
        rsvps: {
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
        attendees: true,
        _count: {
          select: {
            rsvps: true,
            attendees: true,
          },
        },
      },
    })

    if (!event) {
      throw createError("Event not found", 404)
    }

    res.json({ event })
  } catch (error) {
    next(error)
  }
})

// Update event
router.put("/:id", authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const updateData: UpdateEventData = req.body
    const userId = req.user!.id

    // Check if user is the organizer
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: { organizerId: true },
    })

    if (!existingEvent) {
      throw createError("Event not found", 404)
    }

    if (existingEvent.organizerId !== userId) {
      throw createError("Not authorized to update this event", 403)
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...(updateData.title && { title: updateData.title }),
        ...(updateData.description && { description: updateData.description }),
        ...(updateData.date &&
          updateData.time && {
            date: new Date(`${updateData.date}T${updateData.time}:00`),
          }),
        ...(updateData.time && { time: updateData.time }),
        ...(updateData.maxAttendees !== undefined && { maxAttendees: updateData.maxAttendees }),
        ...(updateData.isPublic !== undefined && { isPublic: updateData.isPublic }),
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
      },
    })

    res.json({
      message: "Event updated successfully",
      event: updatedEvent,
    })
  } catch (error) {
    next(error)
  }
})

// RSVP to event
router.post("/:id/rsvp", authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id: eventId } = req.params
    const { status } = req.body // 'YES', 'NO', 'MAYBE'
    const userId = req.user!.id

    if (!["YES", "NO", "MAYBE"].includes(status)) {
      throw createError("Invalid RSVP status", 400)
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: { id: true, name: true },
        },
      },
    })

    if (!event) {
      throw createError("Event not found", 404)
    }

    // Upsert RSVP
    const rsvp = await prisma.eventRSVP.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      update: { status },
      create: {
        eventId,
        userId,
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Send notification to organizer
    if (status === "YES") {
      await notificationService.createNotification({
        userId: event.organizerId,
        title: "New RSVP",
        message: `${req.user!.name} has confirmed attendance to your event "${event.title}"`,
        type: "RSVP_UPDATE",
        data: { eventId, rsvpStatus: status },
      })
    }

    res.json({
      message: "RSVP updated successfully",
      rsvp,
    })
  } catch (error) {
    next(error)
  }
})

// Get event attendees (for organizers)
router.get("/:id/attendees", authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id: eventId } = req.params
    const userId = req.user!.id

    // Check if user is the organizer
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    })

    if (!event) {
      throw createError("Event not found", 404)
    }

    if (event.organizerId !== userId) {
      throw createError("Not authorized to view attendees", 403)
    }

    const [rsvps, attendees] = await Promise.all([
      prisma.eventRSVP.findMany({
        where: { eventId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              photo: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.eventAttendee.findMany({
        where: { eventId },
        orderBy: { createdAt: "desc" },
      }),
    ])

    res.json({
      rsvps,
      attendees,
      summary: {
        totalRSVPs: rsvps.length,
        confirmed: rsvps.filter((r) => r.status === "YES").length,
        declined: rsvps.filter((r) => r.status === "NO").length,
        maybe: rsvps.filter((r) => r.status === "MAYBE").length,
        totalAttendees: attendees.length,
      },
    })
  } catch (error) {
    next(error)
  }
})

// Add external attendee
router.post("/:id/attendees", authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id: eventId } = req.params
    const { email, name } = req.body
    const userId = req.user!.id

    // Check if user is the organizer
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    })

    if (!event) {
      throw createError("Event not found", 404)
    }

    if (event.organizerId !== userId) {
      throw createError("Not authorized to add attendees", 403)
    }

    const attendee = await prisma.eventAttendee.create({
      data: {
        eventId,
        email,
        name,
      },
    })

    res.status(201).json({
      message: "Attendee added successfully",
      attendee,
    })
  } catch (error) {
    next(error)
  }
})

export { router as eventRoutes }
