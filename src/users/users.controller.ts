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
import { PrismaClient } from '@prisma/client';
import { AwsService } from 'src/aws/aws.service';

const prisma = new PrismaClient();

@Controller('users')
export class UsersController {
  constructor(private awsService: AwsService) {}

  @Get()
  async findAllUsers(): Promise<any[]> {
    return prisma.user.findMany();
  }

  // @Post()
  // async createUser(
  //   @Body() createUserDto: { name: string; emoji: number },
  // ): Promise<any> {
  //   const { name, emoji } = createUserDto;
  //   return prisma.user.create({
  //     data: {
  //       name: name,
  //       email:email
  //       emoji: emoji,
  //       photo: '',
  //     },
  //   });
  // }

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
