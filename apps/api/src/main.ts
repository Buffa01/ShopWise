import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter";
import { rateLimitMiddleware } from "./common/middleware/rate-limit.middleware";
import { requestLoggerMiddleware } from "./common/middleware/request-logger.middleware";
import { securityHeadersMiddleware } from "./common/middleware/security-headers.middleware";
import { AppModule } from "./modules/app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const httpServer = app.getHttpAdapter().getInstance() as {
    disable?: (setting: string) => void;
    set?: (setting: string, value: unknown) => void;
  };
  httpServer.disable?.("x-powered-by");
  httpServer.set?.("trust proxy", true);
  app.setGlobalPrefix("v1", {
    exclude: ["r/:code", "n/:code"]
  });
  app.enableCors({
    origin: true,
    credentials: true
  });
  app.use(securityHeadersMiddleware);
  app.use(requestLoggerMiddleware);
  app.use(rateLimitMiddleware);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  const config = app.get(ConfigService);
  const port = config.get<number>("API_PORT") ?? 3001;
  await app.listen(port);
}

void bootstrap();
