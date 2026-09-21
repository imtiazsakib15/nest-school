import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateStudentProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  section?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  className?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;
}
