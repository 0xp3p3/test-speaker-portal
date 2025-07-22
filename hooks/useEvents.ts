"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"

interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  zoomLink?: string
  organizerId: string
  maxAttendees?: number
  isPublic: boolean
  status: string
  organizer: {
    id: string
    name: string
    photo?: string
    expertise?: string[]
  }
  _count: {
    rsvps: number
    attendees: number
  }
  rsvps?: Array<{
    id: string
    status: string
    user: {
      id: string
      name: string
      email: string
    }
  }>
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = async (params?: {
    page?: number
    limit?: number
    status?: string
    organizerId?: string
    upcoming?: boolean
  }) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getEvents(params)
      setEvents(response.events || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyEvents = async (type?: "all" | "organized" | "attending") => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getMyEvents(type)
      setEvents(response.events || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const createEvent = async (eventData: {
    title: string
    description: string
    date: string
    time: string
    maxAttendees?: number
    isPublic?: boolean
  }) => {
    try {
      setError(null)
      const response = await apiClient.createEvent(eventData)
      if (response.events) {
        setEvents((prev) => [response.events, ...prev])
      }
      return response.events
    } catch (error: any) {
      setError(error.message)
      throw error
    }
  }

  const rsvpToEvent = async (eventId: string, status: "YES" | "NO" | "MAYBE") => {
    try {
      setError(null)
      await apiClient.rsvpToEvent(eventId, status)
      // Refresh events to get updated RSVP status
      await fetchMyEvents()
    } catch (error: any) {
      setError(error.message)
      throw error
    }
  }

  useEffect(() => {
    fetchEvents({ upcoming: true })
  }, [])

  return {
    events,
    loading,
    error,
    fetchEvents,
    fetchMyEvents,
    createEvent,
    rsvpToEvent,
    clearError: () => setError(null),
  }
}
