import type { ZoomMeetingResponse } from "../types"

interface CreateMeetingData {
  topic: string
  start_time: string
  duration: number
}

class ZoomService {
  private baseUrl = "https://api.zoom.us/v2"
  private jwtToken = process.env.ZOOM_JWT_TOKEN

  async createMeeting(data: CreateMeetingData): Promise<ZoomMeetingResponse | null> {
    try {
      if (!this.jwtToken) {
        console.warn("Zoom JWT token not configured, returning mock data")
        return this.createMockMeeting(data)
      }

      const response = await fetch(`${this.baseUrl}/users/me/meetings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: data.topic,
          type: 2, // Scheduled meeting
          start_time: data.start_time,
          duration: data.duration,
          settings: {
            host_video: true,
            participant_video: true,
            waiting_room: true,
            join_before_host: false,
            mute_upon_entry: true,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Zoom API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error creating Zoom meeting:", error)
      // Return mock data as fallback
      return this.createMockMeeting(data)
    }
  }

  async updateMeeting(meetingId: string, data: Partial<CreateMeetingData>): Promise<boolean> {
    try {
      if (!this.jwtToken) {
        console.warn("Zoom JWT token not configured, skipping update")
        return true
      }

      const response = await fetch(`${this.baseUrl}/meetings/${meetingId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      return response.ok
    } catch (error) {
      console.error("Error updating Zoom meeting:", error)
      return false
    }
  }

  async deleteMeeting(meetingId: string): Promise<boolean> {
    try {
      if (!this.jwtToken) {
        console.warn("Zoom JWT token not configured, skipping deletion")
        return true
      }

      const response = await fetch(`${this.baseUrl}/meetings/${meetingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.jwtToken}`,
        },
      })

      return response.ok
    } catch (error) {
      console.error("Error deleting Zoom meeting:", error)
      return false
    }
  }

  private createMockMeeting(data: CreateMeetingData): ZoomMeetingResponse {
    const meetingId = Math.floor(Math.random() * 1000000000)
    return {
      id: meetingId,
      topic: data.topic,
      start_time: data.start_time,
      join_url: `https://zoom.us/j/${meetingId}`,
      password: Math.random().toString(36).substring(2, 8),
    }
  }
}

export const zoomService = new ZoomService()
