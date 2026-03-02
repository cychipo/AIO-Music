import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api/v1");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  });

  // ─── Swagger ────────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle("VibeX API")
    .setDescription(
      "REST API cho ứng dụng nghe nhạc đa nguồn: YouTube, Spotify, SoundCloud.\n\n" +
        "Sử dụng **Bearer JWT** để xác thực. Lấy token qua `POST /auth/login`.",
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Nhập JWT token lấy từ endpoint /auth/login",
      },
      "JWT",
    )
    .addTag("auth", "Đăng ký / Đăng nhập")
    .addTag("users", "Quản lý người dùng")
    .addTag("tracks", "Quản lý bài hát")
    .addTag("playlists", "Quản lý playlist")
    .addTag("search", "Tìm kiếm đa nguồn")
    .addTag(
      "stream",
      "Streaming audio via play-dl (YouTube, Spotify, SoundCloud)",
    )
    .addTag("trending", "Top trending từ YouTube / Spotify / SoundCloud")
    .addServer(`http://localhost:${process.env.PORT || 3001}`, "Local")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup("docs", app, document, {
    customSiteTitle: "VibeX API Docs",
    customCss: `
      .swagger-ui .topbar { background-color: #ffa883; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
      body { font-family: 'Outfit', 'Inter', sans-serif; background: #faf2e8; }
      .swagger-ui .info .title { color: #3d2b1f; }
      .swagger-ui .scheme-container { background: #fde3c8; padding: 16px; border-radius: 12px; }
    `,
    swaggerOptions: {
      persistAuthorization: true, // Giữ token sau khi reload
      displayRequestDuration: true, // Hiển thị thời gian request
      filter: true, // Thanh tìm kiếm endpoint
      tryItOutEnabled: true, // Mở sẵn "Try it out"
    },
  });
  // ────────────────────────────────────────────────────────────────────────────

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`VibeX Backend  → http://localhost:${port}/api/v1`);
  console.log(`Swagger Docs       → http://localhost:${port}/docs`);
}

bootstrap();
