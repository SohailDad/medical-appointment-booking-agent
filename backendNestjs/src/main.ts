import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const host = configService.get<string>('HOST', '0.0.0.0');
  const FRONTEND_URL = configService.get<string>('FRONTEND_URL', 'http://localhost:8081');
  const CHATBOT_API_URL = configService.get<string>('CHATBOT_API_URL');

app.enableCors({
    origin: [FRONTEND_URL, "exp://zdcvlke-sohail-dad-8081.exp.direct", CHATBOT_API_URL],
    // origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  });
  // Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.listen(port,host);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
