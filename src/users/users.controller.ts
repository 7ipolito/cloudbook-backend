import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaClient, User } from '@prisma/client';
import { AwsService } from 'src/aws/aws.service';
import { UserService } from './user.service';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

const prisma = new PrismaClient();

@Controller('users')
export class UsersController {
  constructor(
    private awsService: AwsService,
    private readonly userService: UserService,
  ) {}

  // @Get()
  // async findAllUsers(): Promise<any[]> {
  //   return prisma.user.findMany();
  // }

  @Get('profile')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60000)
  async findUser(@Body() dto): Promise<User> {
    console.time();
    const { email } = dto;
    return this.userService.getProfileByEmail(email);
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: number,
    @Body() updateUserDto: { name?: string; emoji?: number },
  ): Promise<any> {
    const { name, emoji } = updateUserDto;
    return prisma.user.update({
      where: { id: Number(id) },
      data: {
        name,
        emoji,
      },
    });
  }

  @Post('/:id/upload')
  @UseInterceptors(FileInterceptor('file'))
  async updatePhotoUser(
    @UploadedFile() file,
    @Param('id') id: number,
  ): Promise<any> {
    let urlPhotoPlayer = null;

    urlPhotoPlayer = await this.awsService.uploadPhoto(file, id);
    console.log(urlPhotoPlayer);
    return prisma.user.update({
      where: { id: Number(id) },
      data: {
        photo: urlPhotoPlayer.url,
      },
    });
  }
}
