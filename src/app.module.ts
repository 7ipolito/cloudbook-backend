import { Module } from '@nestjs/common';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { AwsModule } from './aws/aws.module';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    AuthModule,
    AwsModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: 'localhost',
            port: 6379,
          },
        }),
      }),
    }),
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [UsersController],
  providers: [
    {
      provide: APP_INTERCEPTOR, // Binding the interceptor globally
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
