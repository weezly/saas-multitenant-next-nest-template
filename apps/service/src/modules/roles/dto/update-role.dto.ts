import { IsString, IsObject, IsOptional } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  permissions?: Record<string, string[]>;

  @IsString()
  @IsOptional()
  description?: string;
}
