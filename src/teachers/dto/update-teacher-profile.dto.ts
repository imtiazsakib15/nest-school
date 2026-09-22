import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTeacherProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;
}
