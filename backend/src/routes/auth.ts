import { Router } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { prisma } from "../config/database"
import { validateRequest, registerSchema, loginSchema } from "../middleware/validation"
import { createError } from "../middleware/errorHandler"

const router = Router()

// Register
router.post("/register", validateRequest(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name, bio, expertise } = req.body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw createError("User already exists with this email", 400)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        bio: bio || "",
        expertise: expertise || [],
      },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        photo: true,
        expertise: true,
        role: true,
        createdAt: true,
      },
    })

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" })

    res.status(201).json({
      message: "User registered successfully",
      user,
      token,
    })
  } catch (error) {
    next(error)
  }
})

// Login
router.post("/login", validateRequest(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw createError("Invalid email or password", 401)
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      throw createError("Invalid email or password", 401)
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    res.json({
      message: "Login successful",
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    next(error)
  }
})

// Verify token
router.get("/verify", async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
      throw createError("No token provided", 401)
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        photo: true,
        expertise: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw createError("Invalid token", 401)
    }

    res.json({ user })
  } catch (error) {
    next(error)
  }
})

export { router as authRoutes }
