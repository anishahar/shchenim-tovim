import { ROLE_HIERARCHY } from '@constantsLib';
import { UserRole } from '@typesLib';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ExtendedError, Socket } from 'socket.io';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
      };
    }
  }
}

// JWT Authentication middleware
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Socket.IO authentication middleware
export function socketAuthMiddleware(socket: Socket, next: (err?: ExtendedError | undefined) => void) {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("No token"));
    }

    const user = jwt.verify(token, process.env.JWT_SECRET!) as any;

    socket.data.user = user;

    next();
  } catch {
    next(new Error("Unauthorized"));
  }
}

// Check if user has specific role or higher in hierarchy
export function hasRoleOrHigher(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Role-based authorization middleware (exact role match)
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: `${role} access required` });
    }

    next();
  };
}

// Middleware: require minimum role level (hierarchical)
export function requireMinRole(minRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!hasRoleOrHigher(req.user.role as UserRole, minRole)) {
      return res.status(403).json({
        error: `${minRole} access or higher required`
      });
    }

    next();
  };
}

// Global error handler
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}
