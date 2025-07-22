import type { Request } from "express"
import type { User } from "@prisma/client"

export interface AuthRequest extends Request {
  user?: User
}

export interface CreateEventData {
  title: string
  description: string
  date: string
  time: string
  maxAttendees?: number
  isPublic?: boolean
}

export interface UpdateEventData {
  title?: string
  description?: string
  date?: string
  time?: string
  maxAttendees?: number
  isPublic?: boolean
}

export interface CreateMessageData {
  conversationId?: string
  receiverId?: string
  content: string
  messageType?: "TEXT" | "IMAGE" | "FILE"
}

export interface ZoomMeetingResponse {
  id: number
  topic: string
  start_time: string
  join_url: string
  password: string
}

export interface EmailNotificationData {
  to: string
  subject: string
  template: string
  data: Record<string, any>
}
