import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SecurityModule } from './modules/security.module';
import { AuthModule } from './modules/auth.module';
import { securityHeaders } from './config/security.config';
import { Request, Response, NextFunction } from 'express';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AuthFlowModule } from './authflow.module';
import { AuthResolver } from './graphql/auth.resolver';
import { PrismaModule } from './modules/prisma.module';

@Module({
  imports: [
    PrismaModule,
    SecurityModule,
    AuthModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      context: ({ req }: { req: Request }) => ({ req }),
    }),
    AuthFlowModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ErrorInterceptor,
    },
    AuthResolver,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((_req: Request, res: Response, next: NextFunction) => {
        // Apply security headers
        Object.entries(securityHeaders).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        next();
      })
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
} 