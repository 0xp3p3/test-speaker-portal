import type { Request, Response, NextFunction } from "express"
import Joi from "joi"

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details.map((detail) => detail.message),
      })
    }
    next()
  }
}

// Validation schemas
export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).required(),
  bio: Joi.string().optional(),
  expertise: Joi.array().items(Joi.string()).optional(),
})

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

export const createEventSchema = Joi.object({
  title: Joi.string().min(3).required(),
  description: Joi.string().min(10).required(),
  date: Joi.string().isoDate().required(),
  time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required(),
  maxAttendees: Joi.number().integer().min(1).optional(),
  isPublic: Joi.boolean().optional(),
})

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  bio: Joi.string().optional(),
  expertise: Joi.array().items(Joi.string()).optional(),
})

export const createMessageSchema = Joi.object({
  conversationId: Joi.string().optional(),
  receiverId: Joi.string().optional(),
  content: Joi.string().min(1).required(),
  messageType: Joi.string().valid("TEXT", "IMAGE", "FILE").optional(),
}).xor("conversationId", "receiverId")
