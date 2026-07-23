# Railway Deployment Guide

## Masalah yang Diperbaiki

### Error 502 Bad Gateway
**Penyebab:**
- Backend Express.js tidak listen di `0.0.0.0`, sehingga NGINX tidak bisa connect
- Backend crash karena environment variables tidak tersedia
- Database connection gagal saat startup

**Solusi:**
1. ✅ Backend sekarang listen di `0.0.0.0:3000`
2. ✅ Ditambahkan retry mechanism untuk database initialization
3. ✅ Ditambahkan health check endpoint `/api/health`
4. ✅ Improved logging di entrypoint script

## Environment Variables yang Diperlukan di Railway

Pastikan semua environment variables berikut sudah di-set di Railway:

### Database
```
DATABASE_URL=postgresql://user:password@host:port/dbname
```

### S3 Storage (MinIO atau AWS S3)
```
S3_ENDPOINT=https://your-minio-endpoint.com
S3_REGION=us-east-1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=your-bucket-name
```

### Optional - Webhooks untuk Notifikasi
```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
INFO_APP_OWNER=Your Name
```

## Cara Deploy

1. **Pastikan semua environment variables sudah di-set** di Railway dashboard

2. **Build ulang Docker image:**
   ```bash
   docker build -t localissuetracker .
   ```

3. **Test locally terlebih dahulu:**
   ```bash
   docker run -p 8080:80 \
     -e DATABASE_URL="your-db-url" \
     -e S3_ENDPOINT="your-s3-endpoint" \
     -e S3_ACCESS_KEY="your-key" \
     -e S3_SECRET_KEY="your-secret" \
     -e S3_BUCKET="your-bucket" \
     localissuetracker
   ```

4. **Akses http://localhost:8080/api/health** untuk memastikan backend berjalan

5. **Push ke Railway:**
   - Commit perubahan kode
   - Railway akan auto-rebuild dari Dockerfile

## Troubleshooting

### Cek Backend Status
```bash
# Di Railway logs, cari:
"Server running on 0.0.0.0:3000"
"Database initialized successfully"
```

### Test Health Check
```bash
curl https://your-app.railway.app/api/health
```

Should return:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-07-23T14:30:00.000Z"
}
```

### Common Issues

1. **502 Bad Gateway**
   - Backend tidak running → cek logs untuk error messages
   - Environment variables tidak lengkap → verifikasi di Railway dashboard

2. **500 Internal Server Error**
   - Database connection gagal → cek DATABASE_URL
   - S3 credentials salah → cek S3_* variables

3. **Backend Crash saat Startup**
   - Missing environment variables
   - Database tidak reachable
   - Port conflict (seharusnya tidak terjadi di Railway)

## Verification Steps

Setelah deploy, verifikasi:

1. ✅ Landing page bisa diakses
2. ✅ `/api/health` returns 200 OK
3. ✅ `/api/get-list` returns data (bisa kosong)
4. ✅ Submit report berhasil (test dengan photo kecil)
5. ✅ Photo bisa di-load dari S3

## Port Configuration

- **NGINX**: Listen di port 80 (default HTTP)
- **Backend Express**: Listen di port 3000 (internal only)
- **Railway**: Akan expose port 80 ke public URL

Jangan perlu set PORT environment variable, sudah default ke 3000 di backend.
