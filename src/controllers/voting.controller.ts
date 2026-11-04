import {
  Body,
  Controller,
  Get,
  Header,
  Inject,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  AccessTokenGuard,
  type AuthenticatedRequest,
} from '../guards/access-token.guard.js';
import { VotingService } from '../services/voting.service.js';
import { CreateVoteRequestDto } from '../services/dto/voting/create-vote.request.dto.js';
import { dtoValidation } from '../services/dto/validation.js';

@Controller('votes')
@UseGuards(AccessTokenGuard)
export class VotingController {
  constructor(@Inject(VotingService) private readonly voting: VotingService) {}

  @Post()
  @Header('Cache-Control', 'no-store')
  castVote(
    @Req() request: AuthenticatedRequest,
    @Body(dtoValidation(CreateVoteRequestDto)) body: CreateVoteRequestDto,
  ) {
    // userId lấy từ guard, tuyệt đối không nhận userId do client gửi.
    return this.voting.castVote(request.authUser.id, body.destinationId);
  }

  @Get('me')
  @Header('Cache-Control', 'no-store')
  mine(@Req() request: AuthenticatedRequest) {
    return this.voting.mine(request.authUser.id);
  }
}
