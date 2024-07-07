import { Module } from '@nestjs/common';
import { AwsModule } from 'src/aws/aws.module';
import { UsersController } from './users.controller';
import { UserService } from './user.service';

@Module({
  imports: [AwsModule],
  controllers: [UsersController],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}
