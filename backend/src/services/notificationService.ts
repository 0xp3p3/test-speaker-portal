import { prisma } from "../config/database"
import { emailService } from "./emailService"
import { io } from "../server"

interface CreateNotificationData {
  userId: string
  title: string
  message: string
  type: "EVENT_REMINDER" | "EVENT_INVITATION" | "MESSAGE_RECEIVED" | "RSVP_UPDATE" | "EVENT_CANCELLED" | "SYSTEM"
  data?: Record<string, any>
}

class NotificationService {
  async createNotification(data: CreateNotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          data: data.data || {},
        },
      })

      // Send real-time notification
      io.to(`user_${data.userId}`).emit("notification", notification)

      // Send email notification for important events
      if (["EVENT_REMINDER", "EVENT_INVITATION", "EVENT_CANCELLED"].includes(data.type)) {
        const user = await prisma.user.findUnique({
          where: { id: data.userId },
          select: { email: true, name: true },
        })

        if (user) {
          await emailService.sendNotificationEmail({
            to: user.email,
            subject: data.title,
            template: this.getEmailTemplate(data.type),
            data: {
              userName: user.name,
              title: data.title,
              message: data.message,
              ...data.data,
            },
          })
        }
      }

      return notification
    } catch (error) {
      console.error("Error creating notification:", error)
      throw error
    }
  }

  async sendEventReminder(eventId: string) {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          organizer: { select: { name: true } },
          rsvps: {
            where: { status: "YES" },
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      })

      if (!event) return

      const eventDate = new Date(event.date)
      const now = new Date()
      const hoursUntilEvent = Math.round((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60))

      // Send reminders to confirmed attendees
      for (const rsvp of event.rsvps) {
        await this.createNotification({
          userId: rsvp.user.id,
          title: "Event Reminder",
          message: `"${event.title}" starts in ${hoursUntilEvent} hours`,
          type: "EVENT_REMINDER",
          data: {
            eventId: event.id,
            eventTitle: event.title,
            eventDate: event.date,
            zoomLink: event.zoomLink,
            hoursUntilEvent,
          },
        })
      }
    } catch (error) {
      console.error("Error sending event reminders:", error)
    }
  }

  private getEmailTemplate(type: string): string {
    switch (type) {
      case "EVENT_REMINDER":
        return "event-reminder"
      case "EVENT_INVITATION":
        return "event-invitation"
      case "EVENT_CANCELLED":
        return "event-cancelled"
      default:
        return "general-notification"
    }
  }
}

export const notificationService = new NotificationService()
