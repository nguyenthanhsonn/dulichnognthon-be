import { IsUUID } from 'class-validator';

export class CreateVoteRequestDto {
  @IsUUID()
  destinationId: string;
}
