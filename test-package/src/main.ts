import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { AuthFlowModule } from '@authflow/phantom';

@Module({
  imports: [AuthFlowModule],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap(); 