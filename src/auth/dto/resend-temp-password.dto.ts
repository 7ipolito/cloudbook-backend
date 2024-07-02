import { IsEmail, IsString } from 'class-validator';

export class ResendTempPasswordDto {
  @IsString()
  @IsEmail()
  email: string;
}
