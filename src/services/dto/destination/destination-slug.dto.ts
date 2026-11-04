import { IsString, Length } from 'class-validator';

export class DestinationSlugDto {
  @IsString()
  @Length(1, 255)
  slug: string;
}
