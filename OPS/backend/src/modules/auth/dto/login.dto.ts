import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Supabase access token' })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
