import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsObject()
  @IsNotEmpty()
  permissions!: Record<string, string[]>;

  @IsString()
  @IsOptional()
  description?: string;
}
