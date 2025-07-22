import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seed...")

  // Create sample users
  const hashedPassword = await bcrypt.hash("password123", 12)

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "john.doe@example.com",
        password: hashedPassword,
        name: "John Doe",
        bio: "Experienced technology speaker and AI researcher with 10+ years in the industry.",
        expertise: ["Artificial Intelligence", "Machine Learning", "Technology Innovation"],
        role: "SPEAKER",
      },
    }),
    prisma.user.create({
      data: {
        email: "sarah.johnson@example.com",
        password: hashedPassword,
        name: "Dr. Sarah Johnson",
        bio: "Environmental scientist and sustainability advocate, passionate about green technology.",
        expertise: ["Sustainability", "Environmental Science", "Green Technology"],
        role: "SPEAKER",
      },
    }),
    prisma.user.create({
      data: {
        email: "organizer@worldsalon.com",
        password: hashedPassword,
        name: "Event Organizer",
        bio: "World Salon event coordinator and community manager.",
        expertise: ["Event Management", "Community Building"],
        role: "ORGANIZER",
      },
    }),
  ])

  console.log("✅ Created users")

  // Create sample events
  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: "AI in Modern Healthcare",
        description:
          "Exploring the applications of artificial intelligence in healthcare systems, from diagnosis to treatment optimization.",
        date: new Date("2024-03-15T14:00:00Z"),
        time: "14:00",
        organizerId: users[0].id,
        zoomLink: "https://zoom.us/j/123456789",
        zoomMeetingId: "123456789",
        maxAttendees: 50,
        isPublic: true,
        status: "SCHEDULED",
      },
    }),
    prisma.event.create({
      data: {
        title: "Sustainable Technology Solutions",
        description: "Discussing green technology and sustainable development practices for a better future.",
        date: new Date("2024-03-20T16:00:00Z"),
        time: "16:00",
        organizerId: users[1].id,
        zoomLink: "https://zoom.us/j/987654321",
        zoomMeetingId: "987654321",
        maxAttendees: 30,
        isPublic: true,
        status: "SCHEDULED",
      },
    }),
    prisma.event.create({
      data: {
        title: "Future of Remote Work",
        description:
          "Panel discussion on the evolution of remote work and its impact on productivity and collaboration.",
        date: new Date("2024-02-10T10:00:00Z"),
        time: "10:00",
        organizerId: users[2].id,
        zoomLink: "https://zoom.us/j/555666777",
        zoomMeetingId: "555666777",
        maxAttendees: 100,
        isPublic: true,
        status: "COMPLETED",
      },
    }),
  ])

  console.log("✅ Created events")

  // Create sample RSVPs
  await Promise.all([
    prisma.eventRSVP.create({
      data: {
        eventId: events[0].id,
        userId: users[1].id,
        status: "YES",
      },
    }),
    prisma.eventRSVP.create({
      data: {
        eventId: events[0].id,
        userId: users[2].id,
        status: "MAYBE",
      },
    }),
    prisma.eventRSVP.create({
      data: {
        eventId: events[1].id,
        userId: users[0].id,
        status: "YES",
      },
    }),
    prisma.eventRSVP.create({
      data: {
        eventId: events[1].id,
        userId: users[2].id,
        status: "YES",
      },
    }),
  ])

  console.log("✅ Created RSVPs")

  // Create sample attendees
  await Promise.all([
    prisma.eventAttendee.create({
      data: {
        eventId: events[0].id,
        email: "attendee1@example.com",
        name: "Alice Smith",
        attended: false,
      },
    }),
    prisma.eventAttendee.create({
      data: {
        eventId: events[0].id,
        email: "attendee2@example.com",
        name: "Bob Wilson",
        attended: false,
      },
    }),
    prisma.eventAttendee.create({
      data: {
        eventId: events[2].id,
        email: "attendee3@example.com",
        name: "Carol Davis",
        attended: true,
      },
    }),
  ])

  console.log("✅ Created attendees")

  // Create sample conversation
  const conversation = await prisma.conversation.create({
    data: {
      title: "AI Healthcare Discussion",
      isGroup: false,
      participants: {
        create: [{ userId: users[0].id }, { userId: users[2].id }],
      },
    },
  })

  // Create sample messages
  await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: users[2].id,
        receiverId: users[0].id,
        content: "Hi John! Thanks for agreeing to speak at our AI Healthcare event.",
        messageType: "TEXT",
        isRead: true,
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: users[0].id,
        receiverId: users[2].id,
        content: "My pleasure! I'm excited to share insights about AI applications in healthcare.",
        messageType: "TEXT",
        isRead: true,
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: users[2].id,
        receiverId: users[0].id,
        content: "Great! The event is scheduled for March 15th at 2 PM. I'll send you the detailed agenda soon.",
        messageType: "TEXT",
        isRead: false,
      },
    }),
  ])

  console.log("✅ Created conversation and messages")

  // Create sample notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: users[0].id,
        title: "Event Reminder",
        message: 'Your event "AI in Modern Healthcare" is starting in 24 hours',
        type: "EVENT_REMINDER",
        data: { eventId: events[0].id },
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[1].id,
        title: "New RSVP",
        message: "John Doe has confirmed attendance to your event",
        type: "RSVP_UPDATE",
        data: { eventId: events[1].id, rsvpStatus: "YES" },
        isRead: false,
      },
    }),
  ])

  console.log("✅ Created notifications")

  console.log("🎉 Database seeded successfully!")
  console.log("\nSample login credentials:")
  console.log("Email: john.doe@example.com | Password: password123")
  console.log("Email: sarah.johnson@example.com | Password: password123")
  console.log("Email: organizer@worldsalon.com | Password: password123")
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
