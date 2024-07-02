import { IsEmail, IsNotEmpty } from 'class-validator';

export class ChangeEmailDto {
  @IsEmail()
  @IsNotEmpty()
  newEmail: string;

  @IsEmail()
  @IsNotEmpty()
  existingEmail: string;
}
