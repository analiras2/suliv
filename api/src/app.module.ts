import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AllergensModule } from './allergens/allergens.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import {
  environmentConfiguration,
  environmentValidationSchema,
} from './config/environment';
import { FeedModule } from './feed/feed.module';
import { PrismaModule } from './prisma/prisma.module';
import { RankingModule } from './ranking/ranking.module';
import { RecipesModule } from './recipes/recipes.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [environmentConfiguration],
      validationOptions: { abortEarly: false },
      validationSchema: environmentValidationSchema,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AllergensModule,
    RecipesModule,
    RankingModule,
    FeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
