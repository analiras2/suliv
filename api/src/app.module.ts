import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AllergensModule } from './allergens/allergens.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import {
  environmentConfiguration,
  environmentValidationSchema,
} from './config/environment';
import { EventsModule } from './events/events.module';
import { FavoritesModule } from './favorites/favorites.module';
import { FeedModule } from './feed/feed.module';
import { PrismaModule } from './prisma/prisma.module';
import { RankingModule } from './ranking/ranking.module';
import { RecipesModule } from './recipes/recipes.module';
import { ReportsModule } from './reports/reports.module';
import { SearchModule } from './search/search.module';
import { SyncModule } from './sync/sync.module';
import { TermsModule } from './terms/terms.module';
import { UploadsModule } from './uploads/uploads.module';
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
    RankingModule,
    // SearchModule must be scanned before FeedModule: FeedModule
    // transitively imports RecipesModule (for its own use of
    // RecipesService), which registers `GET /recipes/:slug` — a wildcard
    // route that would otherwise shadow SearchModule's literal
    // `/recipes/search` route if registered first. Module scan order (not
    // just top-level array position) determines controller/route
    // registration order, since a module reached transitively registers at
    // the point it's first visited in the DFS.
    SearchModule,
    FeedModule,
    RecipesModule,
    EventsModule,
    CommentsModule,
    ReportsModule,
    FavoritesModule,
    SyncModule,
    TermsModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
