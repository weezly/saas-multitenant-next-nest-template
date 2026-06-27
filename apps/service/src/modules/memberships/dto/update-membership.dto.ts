import { IsUUID, IsNotEmpty } from 'class-validator';

export class UpdateMembershipDto {
  @IsUUID()
  @IsNotEmpty()
  roleId!: string;
}
