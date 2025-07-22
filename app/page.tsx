"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, MessageSquare, Plus, Bell } from "lucide-react"
import { LoginForm } from "@/components/login-form"
import { ProfileForm } from "@/components/profile-form"
import { EventForm } from "@/components/event-form"
import { EventList } from "@/components/event-list"
import { MessagingPanel } from "@/components/messaging-panel"
import { NotificationPanel } from "@/components/notification-panel"
import { useAuth } from "@/contexts/AuthContext"
import { useEvents } from "@/hooks/useEvents"
import { useNotifications } from "@/hooks/useNotifications"
import { Badge } from "@/components/ui/badge"

export default function SpeakerPortal() {
  const { user, loading: authLoading, logout } = useAuth()
  const { events, loading: eventsLoading, fetchMyEvents, createEvent } = useEvents()
  const { unreadCount } = useNotifications()
  const [activeTab, setActiveTab] = useState<"dashboard" | "profile" | "events" | "messages" | "notifications">(
    "dashboard",
  )
  const [showEventForm, setShowEventForm] = useState(false)

  useEffect(() => {
    if (user) {
      fetchMyEvents()
    }
  }, [user])

  const handleEventCreate = async (eventData: {
    title: string
    description: string
    date: string
    time: string
    maxAttendees?: number
    isPublic?: boolean
  }) => {
    try {
      await createEvent(eventData)
      fetchMyEvents();
      setShowEventForm(false)
    } catch (error) {
      console.error("Failed to create event:", error)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">World Salon</h1>
            <p className="text-gray-600">Speaker Portal</p>
          </div>
          <LoginForm />
        </div>
      </div>
    )
  }

  const myEvents = events.filter((e) => e.organizerId === user.id)
  const attendingEvents = events.filter((e) =>
    e.rsvps?.some((rsvp) => rsvp.user.id === user.id && rsvp.status === "YES"),
  )
  const upcomingEvents = events.filter((e) => new Date(e.date) > new Date())

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">World Salon - Speaker Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user.name}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64">
            <nav className="space-y-2">
              <Button
                variant={activeTab === "dashboard" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("dashboard")}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant={activeTab === "profile" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("profile")}
              >
                <Users className="mr-2 h-4 w-4" />
                Profile
              </Button>
              <Button
                variant={activeTab === "events" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("events")}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Events
              </Button>
              <Button
                variant={activeTab === "messages" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("messages")}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Messages
              </Button>
              <Button
                variant={activeTab === "notifications" ? "default" : "ghost"}
                className="w-full justify-start relative"
                onClick={() => setActiveTab("notifications")}
              >
                <Bell className="mr-2 h-4 w-4" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-auto text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                  <Button onClick={() => setShowEventForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                  </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">My Events</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{myEvents.length}</div>
                      <p className="text-xs text-muted-foreground">Events organized</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{upcomingEvents.length}</div>
                      <p className="text-xs text-muted-foreground">Next 30 days</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Attending</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{attendingEvents.length}</div>
                      <p className="text-xs text-muted-foreground">Events attending</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Events */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Events</CardTitle>
                    <CardDescription>Your latest speaking engagements and events</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {eventsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <EventList events={events.slice(0, 5)} currentUserId={user.id} />
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Profile Management</h2>
                <ProfileForm />
              </div>
            )}

            {activeTab === "events" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Events</h2>
                  <Button onClick={() => setShowEventForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                  </Button>
                </div>
                {eventsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <EventList events={events} currentUserId={user.id} />
                )}
              </div>
            )}

            {activeTab === "messages" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
                <MessagingPanel />
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
                <NotificationPanel />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Creation Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <EventForm onSubmit={handleEventCreate} onCancel={() => setShowEventForm(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
