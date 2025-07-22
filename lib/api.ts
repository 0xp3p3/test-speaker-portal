interface ApiResponse<T = any> {
  message?: string
  data?: T
  user?: T
  token?: string
  events?: T
  conversations?: T
  notifications?: T
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface ApiError {
  error: string
  details?: string[]
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
    this.token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error("API request failed:", error)
      throw error
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("auth_token", token)
      } else {
        localStorage.removeItem("auth_token")
      }
    }
  }

  // Auth endpoints
  async register(userData: {
    email: string
    password: string
    name: string
    bio?: string
    expertise?: string[]
  }): Promise<ApiResponse> {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async login(credentials: { email: string; password: string }): Promise<ApiResponse> {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  }

  async verifyToken(): Promise<ApiResponse> {
    return this.request("/auth/verify")
  }

  // User endpoints
  async getProfile(): Promise<ApiResponse> {
    return this.request("/users/profile")
  }

  async updateProfile(profileData: {
    name?: string
    bio?: string
    expertise?: string[]
  }): Promise<ApiResponse> {
    return this.request("/users/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    })
  }

  async getSpeakers(params?: {
    page?: number
    limit?: number
    expertise?: string
  }): Promise<ApiResponse> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append("page", params.page.toString())
    if (params?.limit) searchParams.append("limit", params.limit.toString())
    if (params?.expertise) searchParams.append("expertise", params.expertise)

    return this.request(`/users/speakers?${searchParams.toString()}`)
  }

  async getSpeaker(id: string): Promise<ApiResponse> {
    return this.request(`/users/${id}`)
  }

  // Event endpoints
  async getEvents(params?: {
    page?: number
    limit?: number
    status?: string
    organizerId?: string
    upcoming?: boolean
  }): Promise<ApiResponse> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append("page", params.page.toString())
    if (params?.limit) searchParams.append("limit", params.limit.toString())
    if (params?.status) searchParams.append("status", params.status)
    if (params?.organizerId) searchParams.append("organizerId", params.organizerId)
    if (params?.upcoming) searchParams.append("upcoming", "true")

    return this.request(`/events?${searchParams.toString()}`)
  }

  async getMyEvents(type?: "all" | "organized" | "attending"): Promise<ApiResponse> {
    const params = type ? `?type=${type}` : ""
    return this.request(`/events/my-events${params}`)
  }

  async createEvent(eventData: {
    title: string
    description: string
    date: string
    time: string
    maxAttendees?: number
    isPublic?: boolean
  }): Promise<ApiResponse> {
    return this.request("/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    })
  }

  async getEvent(id: string): Promise<ApiResponse> {
    return this.request(`/events/${id}`)
  }

  async updateEvent(
    id: string,
    eventData: {
      title?: string
      description?: string
      date?: string
      time?: string
      maxAttendees?: number
      isPublic?: boolean
    },
  ): Promise<ApiResponse> {
    return this.request(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(eventData),
    })
  }

  async rsvpToEvent(eventId: string, status: "YES" | "NO" | "MAYBE"): Promise<ApiResponse> {
    return this.request(`/events/${eventId}/rsvp`, {
      method: "POST",
      body: JSON.stringify({ status }),
    })
  }

  async getEventAttendees(eventId: string): Promise<ApiResponse> {
    return this.request(`/events/${eventId}/attendees`)
  }

  async addEventAttendee(
    eventId: string,
    attendeeData: {
      email: string
      name: string
    },
  ): Promise<ApiResponse> {
    return this.request(`/events/${eventId}/attendees`, {
      method: "POST",
      body: JSON.stringify(attendeeData),
    })
  }

  // Message endpoints
  async getConversations(): Promise<ApiResponse> {
    return this.request("/messages/conversations")
  }

  async getMessages(
    conversationId: string,
    params?: {
      page?: number
      limit?: number
    },
  ): Promise<ApiResponse> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append("page", params.page.toString())
    if (params?.limit) searchParams.append("limit", params.limit.toString())

    return this.request(`/messages/conversations/${conversationId}/messages?${searchParams.toString()}`)
  }

  async sendMessage(messageData: {
    conversationId?: string
    receiverId?: string
    content: string
    messageType?: "TEXT" | "IMAGE" | "FILE"
  }): Promise<ApiResponse> {
    return this.request("/messages/send", {
      method: "POST",
      body: JSON.stringify(messageData),
    })
  }

  async createGroupConversation(data: {
    title: string
    participantIds: string[]
  }): Promise<ApiResponse> {
    return this.request("/messages/conversations", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Notification endpoints
  async getNotifications(params?: {
    page?: number
    limit?: number
    unread?: boolean
  }): Promise<ApiResponse> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append("page", params.page.toString())
    if (params?.limit) searchParams.append("limit", params.limit.toString())
    if (params?.unread) searchParams.append("unread", "true")

    return this.request(`/notifications?${searchParams.toString()}`)
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse> {
    return this.request(`/notifications/${id}/read`, {
      method: "PUT",
    })
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse> {
    return this.request("/notifications/read-all", {
      method: "PUT",
    })
  }

  async deleteNotification(id: string): Promise<ApiResponse> {
    return this.request(`/notifications/${id}`, {
      method: "DELETE",
    })
  }
}

export const apiClient = new ApiClient()
