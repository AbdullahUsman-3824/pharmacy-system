import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LookupsModule } from './lookups/lookups.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [LookupsModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
