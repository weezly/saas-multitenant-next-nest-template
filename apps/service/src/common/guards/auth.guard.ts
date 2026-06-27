/**
 * JWT Authentication Guard
 *
 * Verantwortung:
 * - JWT aus Authorization Header extrahieren
 * - Token validieren
 * - User-Daten (userId, email, activeTenantId, roleId) extrahieren
 * - Daten an request anhängen
 *
 * @Public() Decorator überspringt diesen Guard
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      activeTenantId?: string;
      roleId?: string;
      token?: string;
    }
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Prüfe ob Route als @Public() markiert ist
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    // 1. JWT aus Authorization Header extrahieren
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    // Authorization: Bearer <token>
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const token = parts[1];

    // 2. Token validieren und dekodieren
    try {
      const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

      const decoded = jwt.verify(token, secret) as {
        id: string;
        email: string;
        activeTenantId?: string;
        activeRoleId?: string;
        iat?: number;
        exp?: number;
      };

      // 3. User-Daten extrahieren und an request anhängen
      request.user = {
        id: decoded.id,
        email: decoded.email,
      };

      request.activeTenantId = decoded.activeTenantId;
      request.roleId = decoded.activeRoleId;
      request.token = token;

      return true;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token has expired');
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      }

      throw new HttpException(
        'Internal server error during authentication',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
