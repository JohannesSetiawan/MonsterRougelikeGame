import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS
    app.enableCors({
      origin: ['http://localhost:3000', 'http://localhost:5173'], // React dev servers
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe());

    // Swagger documentation
    const config = new DocumentBuilder()
      .setTitle('Pokemon Roguelike API')
      .setDescription('API for the Pokemon-inspired roguelike game')
      .setVersion('1.0')
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const port = process.env.PORT || 3001;
    await app.listen(port);
    
    logger.log(`🚀 Server running on http://localhost:${port}`);
    logger.log(`📚 API Documentation available at http://localhost:${port}/api`);
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Application failed to start', error);
  process.exit(1);
});
