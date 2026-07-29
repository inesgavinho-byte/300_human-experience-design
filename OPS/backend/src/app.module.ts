import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import databaseConfig from './config/database.config';
import supabaseConfig from './config/supabase.config';
import { PrismaService } from './shared/prisma/prisma.service';
import { SupabaseService } from './shared/utils/supabase.service';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { RolesGuard } from './common/guards/roles.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { BuildingsModule } from './modules/buildings/buildings.module';
import { FloorsModule } from './modules/floors/floors.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { RequirementsModule } from './modules/requirements/requirements.module';
import { ExperiencesModule } from './modules/experiences/experiences.module';
import { SystemsModule } from './modules/systems/systems.module';
import { SubsystemsModule } from './modules/subsystems/subsystems.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { EquipmentLibraryModule } from './modules/equipment-library/equipment-library.module';
import { TechnicalZonesModule } from './modules/technical-zones/technical-zones.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { AiModule } from './modules/ai/ai.module';
import { EngineeringEngineModule } from './modules/engineering-engine/engineering-engine.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ProposalsModule } from './modules/proposals/proposals.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, supabaseConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
        limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      },
    ]),
    AuthModule,
    ProjectsModule,
    BuildingsModule,
    FloorsModule,
    RoomsModule,
    RequirementsModule,
    ExperiencesModule,
    SystemsModule,
    SubsystemsModule,
    EquipmentModule,
    EquipmentLibraryModule,
    TechnicalZonesModule,
    PrescriptionsModule,
    IntegrationsModule,
    AiModule,
    EngineeringEngineModule,
    ProcurementModule,
    DocumentsModule,
    ProposalsModule,
  ],
  providers: [
    PrismaService,
    SupabaseService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
