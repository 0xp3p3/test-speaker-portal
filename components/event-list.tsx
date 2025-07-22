"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Clock, Users, ExternalLink } from "lucide-react"
import { useEvents } from "@/hooks/useEvents"

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

interface EventListProps {
  events: Event[]
  currentUserId: string
}

export function EventList({ events, currentUserId }: EventListProps) {
  const { rsvpToEvent } = useEvents()
  const [loadingRsvp, setLoadingRsvp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getRSVPStatus = (event: Event) => {
    const userRsvp = event.rsvps?.find((rsvp) => rsvp.user.id === currentUserId)
    return userRsvp?.status || "PENDING"
  }

  const getRSVPBadgeVariant = (status: string) => {
    switch (status) {
      case "YES":
        return "default"
      case "NO":
        return "destructive"
      case "MAYBE":
        return "secondary"
      default:
        return "outline"
    }
  }

  const handleRSVP = async (eventId: string, status: "YES" | "NO" | "MAYBE") => {
    try {
      setLoadingRsvp(eventId)
      setError(null)
      await rsvpToEvent(eventId, status)
    } catch (error: any) {
      setError(error.message || "Failed to update RSVP")
    } finally {
      setLoadingRsvp(null)
    }
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">No events found</p>
          <p className="text-sm text-muted-foreground text-center mt-1">Create your first event to get started</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {events.map((event) => (
        <Card key={event.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <CardDescription className="mt-1">Speaker: {event.organizer.name}</CardDescription>
              </div>
              <div className="flex gap-2">
                {event.organizerId !== currentUserId && (
                  <Badge variant={getRSVPBadgeVariant(getRSVPStatus(event))}>RSVP: {getRSVPStatus(event)}</Badge>
                )}
                {event.organizerId === currentUserId && <Badge variant="default">Your Event</Badge>}
                <Badge variant="outline">{event.status}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{event.description}</p>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(event.date)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {event.time}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {event._count.rsvps} RSVPs, {event._count.attendees} attendees
              </div>
              {event.maxAttendees && <div className="text-xs">Max: {event.maxAttendees}</div>}
            </div>

            <div className="flex gap-2 flex-wrap">
              {event.zoomLink && (
                <Button variant="outline" size="sm" asChild>
                  <a href={event.zoomLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Join Zoom
                  </a>
                </Button>
              )}

              {event.organizerId !== currentUserId && event.status === "SCHEDULED" && (
                <>
                  <Button
                    variant={getRSVPStatus(event) === "YES" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleRSVP(event.id, "YES")}
                    disabled={loadingRsvp === event.id}
                  >
                    {loadingRsvp === event.id ? "..." : "Yes"}
                  </Button>
                  <Button
                    variant={getRSVPStatus(event) === "MAYBE" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handleRSVP(event.id, "MAYBE")}
                    disabled={loadingRsvp === event.id}
                  >
                    {loadingRsvp === event.id ? "..." : "Maybe"}
                  </Button>
                  <Button
                    variant={getRSVPStatus(event) === "NO" ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => handleRSVP(event.id, "NO")}
                    disabled={loadingRsvp === event.id}
                  >
                    {loadingRsvp === event.id ? "..." : "No"}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
