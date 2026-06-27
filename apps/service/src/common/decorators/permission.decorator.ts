/**
 * Permission Decorator
 *
 * Markiert eine Route mit erforderlichen Permissions
 *
 * Verwendung:
 * @Permission('projects', 'create')
 * @Permission('users', 'update')
 */

import { SetMetadata } from '@nestjs/common';
import { PERMISSION_KEY, PermissionMetadata } from '../guards/permissions.guard';

export const Permission = (resource: string, action: string) =>
  SetMetadata<string, PermissionMetadata>(PERMISSION_KEY, { resource, action });
