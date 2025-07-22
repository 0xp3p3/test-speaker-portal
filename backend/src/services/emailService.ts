import nodemailer from "nodemailer"
import type { EmailNotificationData } from "../types"

class EmailService {
  private transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  async sendNotificationEmail(data: EmailNotificationData) {
    try {
      if (!process.env.SMTP_USER) {
        console.log("Email service not configured, skipping email send")
        console.log("Would send email:", data)
        return
      }

      const htmlContent = this.generateEmailHTML(data.template, data.data)

      const mailOptions = {
        from: `"World Salon" <${process.env.SMTP_USER}>`,
        to: data.to,
        subject: data.subject,
        html: htmlContent,
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log("Email sent successfully:", result.messageId)
      return result
    } catch (error) {
      console.error("Error sending email:", error)
      throw error
    }
  }

  private generateEmailHTML(template: string, data: Record<string, any>): string {
    switch (template) {
      case "event-reminder":
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Event Reminder</h2>
            <p>Hi ${data.userName},</p>
            <p>This is a reminder that your event "<strong>${data.eventTitle}</strong>" is starting soon!</p>
            <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <p><strong>Event:</strong> ${data.eventTitle}</p>
              <p><strong>Date:</strong> ${new Date(data.eventDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${new Date(data.eventDate).toLocaleTimeString()}</p>
              ${data.zoomLink ? `<p><strong>Join Link:</strong> <a href="${data.zoomLink}">Join Zoom Meeting</a></p>` : ""}
            </div>
            <p>We look forward to seeing you there!</p>
            <p>Best regards,<br>World Salon Team</p>
          </div>
        `

      case "event-invitation":
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Event Invitation</h2>
            <p>Hi ${data.userName},</p>
            <p>You've been invited to participate in an upcoming event!</p>
            <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <p><strong>Event:</strong> ${data.eventTitle}</p>
              <p><strong>Description:</strong> ${data.message}</p>
              <p><strong>Date:</strong> ${new Date(data.eventDate).toLocaleDateString()}</p>
            </div>
            <p>Please log in to your speaker portal to RSVP.</p>
            <p>Best regards,<br>World Salon Team</p>
          </div>
        `

      case "event-cancelled":
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d32f2f;">Event Cancelled</h2>
            <p>Hi ${data.userName},</p>
            <p>We regret to inform you that the following event has been cancelled:</p>
            <div style="background: #ffebee; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #d32f2f;">
              <p><strong>Event:</strong> ${data.eventTitle}</p>
              <p><strong>Original Date:</strong> ${new Date(data.eventDate).toLocaleDateString()}</p>
            </div>
            <p>We apologize for any inconvenience this may cause.</p>
            <p>Best regards,<br>World Salon Team</p>
          </div>
        `

      default:
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${data.title}</h2>
            <p>Hi ${data.userName},</p>
            <p>${data.message}</p>
            <p>Best regards,<br>World Salon Team</p>
          </div>
        `
    }
  }
}

export const emailService = new EmailService()
