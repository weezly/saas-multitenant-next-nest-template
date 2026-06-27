/**
 * User Decorator - Extrahiert aktuellen User aus Request
 *
 * Verwendung:
 * getProfile(@User() user: AuthenticatedUser) {
 *   return { id: user.id, email: user.email };
 * }
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../guards/auth.guard';

export const User = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
