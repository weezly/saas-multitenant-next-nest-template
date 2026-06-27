/**
 * Public Decorator
 *
 * Markiert eine Route als Public (AuthGuard wird skipped)
 * Verwendung auf Controller- oder Method-Level:
 *
 * @Controller('auth')
 * @Public()
 * export class AuthController { }
 *
 * oder auf Method-Level:
 *
 * @Get('login')
 * @Public()
 * login() { }
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
