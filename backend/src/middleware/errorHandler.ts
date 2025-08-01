import type { Request, Response, NextFunction } from "express"

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
}

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500
  const message = err.message || "Internal Server Error"

  // Log error for debugging
  console.error(`Error ${statusCode}: ${message}`)
  console.error(err.stack)

  // Don't leak error details in production
  const response = {
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  }

  res.status(statusCode).json(response)
}

export const createError = (message: string, statusCode = 500): AppError => {
  const error = new Error(message) as AppError
  error.statusCode = statusCode
  error.isOperational = true
  return error
}
