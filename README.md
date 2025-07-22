# World Salon Speaker Portal

A platform for managing speaker invitations, events, and communication, built with Next.js, Express.js, and PostgreSQL.

## Features

* **Event Management**: Create and manage events
* **Speaker Invitations**: Send and track RSVPs
* **Real-time Communication**: Live messaging via WebSockets
* **Zoom Integration**: Automatic meeting link generation
* **User Profiles**: Manage speaker profiles
* **Analytics Dashboard**: Track event statistics and attendance

## Tech Stack

### Frontend

* **Framework**: Next.js 14, TypeScript
* **Styling**: Tailwind CSS
* **State Management**: React Context API
* **Real-time**: Socket.io Client

### Backend

* **Runtime**: Node.js, Express.js, TypeScript
* **Database**: PostgreSQL with Prisma ORM
* **Authentication**: JWT
* **Real-time**: Socket.io

### External Services

* **Video Conferencing**: Zoom API
* **Email Service**: SMTP (Gmail/SendGrid)

## Quick Start

1. **Clone the repository:**

   ```bash
   git clone https://github.com/0xp3p3/test-speaker-portal.git
   cd speaker-portal
   ```

2. **Install dependencies:**

   ```bash
   npm install # Frontend
   cd backend
   npm install # Backend
   ```

3. **Set up environment variables** in `.env` and `.env.local`.

4. **Run database migrations and seed data:**

   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev
   npm run seed
   ```

5. **Start the servers:**

   ```bash
   npm run dev # Backend
   npm run dev # Frontend
   ```

## Deployment

* **Frontend**: Vercel
* **Backend**: Railway, Heroku
* **Docker**: Docker Compose

## API Documentation

* **Authentication**: `/api/auth/register`, `/api/auth/login`
* **Events**: `/api/events`, `/api/events/:id/rsvp`
* **Users**: `/api/users/profile`, `/api/users/speakers`
* **Messages**: `/api/messages/send`

## Security Features

* **JWT Authentication**
* **Password Hashing** (bcrypt)
* **SQL Injection Prevention** (Prisma ORM)
