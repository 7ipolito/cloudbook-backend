import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager'; // ! Don't forget this import
import { Inject, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly prisma: PrismaService,
  ) {}

  async getProfileByEmail(email: string): Promise<User> {
    const cachedData = await this.cacheManager.get<string>('/users/profile');
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    const userProfile = await this.prisma.user.findUnique({
      where: { email: email },
    });
    await this.cacheManager.set('/users/profile', userProfile);
    return userProfile;
  }
}
