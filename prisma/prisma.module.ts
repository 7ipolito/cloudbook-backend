// src/prisma/prisma.module.ts
import { PrismaClient } from '@prisma/client';
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

const prisma = new PrismaClient();

@Global()
@Module({
  providers: [
    {
      provide: 'PRISMA_CLIENT',
      useValue: prisma,
    },
    PrismaService,
  ],

  exports: ['PRISMA_CLIENT', PrismaService],
})
export class PrismaModule {}
