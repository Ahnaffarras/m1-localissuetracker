# Changelog - Fix Railway Deployment 502 Error

## Tanggal: 2026-07-23

### Masalah
- Error 502 Bad Gateway saat deploy di Railway
- Backend tidak bisa diakses oleh NGINX
- Log menunjukkan: `connect() failed (111: Connection refused)`

### Akar Masalah
1. Backend Express.js tidak listen di `0.0.0.0` (hanya listen di localhost/IPv6)
2. Backend crash saat startup jika DB/S3 tidak tersedia
3. Tidak ada logging yang cukup untuk debugging

### Perubahan yang Dilakukan

#### 1. backend/server.js
- ✅ Ubah `app.listen(port)` → `app.listen(port, '0.0.0.0')` 
- ✅ Tambahkan retry mechanism (5x) untuk database initialization
- ✅ Tambahkan health check endpoint: `GET /api/health`
- ✅ Improved error logging dengan retry counter

#### 2. docker-entrypoint.sh
- ✅ Tambahkan logging yang lebih detail
- ✅ Tambahkan check apakah backend berhasil start
- ✅ Tambahkan sleep 2 detik untuk memastikan backend ready

#### 3. Dokumentasi
- ✅ Buat RAILWAY_DEPLOYMENT.md dengan panduan lengkap
- ✅ List semua environment variables yang diperlukan
- ✅ Troubleshooting guide

### Next Steps untuk Deploy

1. **Commit changes:**
   ```bash
   git add .
   git commit -m "fix: Railway deployment 502 error - listen on 0.0.0.0"
   git push
   ```

2. **Verifikasi Environment Variables di Railway:**
   - DATABASE_URL
   - S3_ENDPOINT
   - S3_ACCESS_KEY
   - S3_SECRET_KEY
   - S3_BUCKET

3. **Railway akan auto-rebuild** dari Dockerfile

4. **Test setelah deploy:**
   ```bash
   curl https://m1-localissuetracker-production.up.railway.app/api/health
   ```

### Expected Result
- Health check endpoint akan return 200 OK
- Submit report akan berhasil (bukan 502)
- Backend logs akan menunjukkan "Server running on 0.0.0.0:3000"
