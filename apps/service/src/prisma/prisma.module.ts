import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TenantContextService } from './tenant-context.service';
import { TenantAwarePrismaService } from './tenant-aware-prisma.service';

@Module({
  providers: [PrismaService, TenantContextService, TenantAwarePrismaService],
  exports: [PrismaService, TenantContextService, TenantAwarePrismaService],
})
export class PrismaModule {}
