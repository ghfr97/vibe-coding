import { describe, it, expect, beforeEach } from 'bun:test';
import { app } from '../src/index';
import { db } from '../src/db';
import { users, sessions } from '../src/db/schema';

describe('Users API', () => {
  beforeEach(async () => {
    // Menghapus data agar konsisten sebelum setiap test
    await db.delete(sessions);
    await db.delete(users);
  });

  describe('POST /api/users/register', () => {
    it('harus berhasil mendaftarkan user baru', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
          })
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toBe('OK');
    });

    it('harus gagal jika email sudah terdaftar', async () => {
      // Daftarkan user pertama
      await app.handle(
        new Request('http://localhost/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
          })
        })
      );

      // Coba daftar lagi dengan email yang sama
      const response = await app.handle(
        new Request('http://localhost/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Another User',
            email: 'test@example.com',
            password: 'password123'
          })
        })
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Email sudah terdaftar');
    });

    it('harus gagal jika input melebihi 255 karakter', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'a'.repeat(256),
            email: 'test@example.com',
            password: 'password123'
          })
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      // Daftarkan user untuk keperluan login
      await app.handle(
        new Request('http://localhost/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
          })
        })
      );
    });

    it('harus berhasil login dengan kredensial yang benar', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data.token).toBeDefined();
    });

    it('harus gagal jika password salah', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'wrongpassword'
          })
        })
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Email atau password salah');
    });
  });

  describe('Autentikasi Terproteksi', () => {
    let token: string;

    beforeEach(async () => {
      // Register
      await app.handle(
        new Request('http://localhost/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
          })
        })
      );

      // Login
      const loginRes = await app.handle(
        new Request('http://localhost/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        })
      );
      const loginBody = await loginRes.json();
      token = loginBody.data.token;
    });

    it('harus berhasil mendapatkan data user saat ini', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/current', {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data.email).toBe('test@example.com');
      expect(body.data.name).toBe('Test User');
    });

    it('harus berhasil logout', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/logout', {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toBe('ok');

      // Pastikan token sudah tidak bisa digunakan
      const currentRes = await app.handle(
        new Request('http://localhost/api/users/current', {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        })
      );
      expect(currentRes.status).toBe(401);
    });

    it('harus gagal jika token tidak valid', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/current', {
          method: 'GET',
          headers: { 
            'Authorization': 'Bearer wrong-token'
          }
        })
      );

      expect(response.status).toBe(401);
    });
  });
});
