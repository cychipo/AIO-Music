# AIO-MUSIC

Ứng dụng nghe nhạc đa nguồn — YouTube, Spotify, SoundCloud — với giao diện Pastel hiện đại.

## Cấu trúc dự án

```
AIO-MUSIC/
├── backend/          # NestJS API
└── frontend/         # React.js SPA
```

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env   # Điền API keys
yarn install
yarn start:dev
```

### Frontend

```bash
cd frontend
yarn install
yarn dev
```

## Yêu cầu hệ thống

- Node.js >= 18
- MongoDB (local hoặc Atlas)
- Redis (optional, cho caching)
