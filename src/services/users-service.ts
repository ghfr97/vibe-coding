import { db } from '../db';
import { users, sessions } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Mendaftarkan pengguna baru ke dalam sistem.
 * Fungsi ini akan mengecek apakah email sudah terdaftar, melakukan hashing pada password,
 * lalu menyimpan data pengguna baru ke database.
 * 
 * @param data - Objek yang berisi informasi pengguna (nama, email, password)
 * @returns Objek dengan property success true jika pendaftaran berhasil
 * @throws Error jika email sudah terdaftar di database
 */
export const registerUser = async (data: typeof users.$inferInsert) => {
  // Check if email already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error('Email sudah terdaftar');
  }

  // Hash password using Bun.password
  const hashedPassword = await Bun.password.hash(data.password);

  // Insert user
  await db.insert(users).values({
    ...data,
    password: hashedPassword,
  });

  return { success: true };
};

/**
 * Melakukan autentikasi pengguna.
 * Fungsi ini memvalidasi keberadaan email, memverifikasi kecocokan password, 
 * dan menghasilkan sesi baru (session token) jika kredensial valid.
 * 
 * @param data - Objek yang berisi kredensial login (email dan password)
 * @returns Objek yang memuat session token (token)
 * @throws Error jika email tidak ditemukan atau password salah
 */
export const loginUser = async (data: Pick<typeof users.$inferSelect, 'email' | 'password'>) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (!user) {
    throw new Error('Email atau password salah');
  }

  const isPasswordValid = await Bun.password.verify(data.password, user.password);
  if (!isPasswordValid) {
    throw new Error('Email atau password salah');
  }

  const token = crypto.randomUUID();

  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return { token };
};

/**
 * Mengambil informasi profil pengguna yang sedang login.
 * Fungsi ini mencari kecocokan data pengguna di database berdasarkan session token yang diberikan.
 * 
 * @param token - String session token milik pengguna yang sedang aktif
 * @returns Objek yang memuat data pengguna (id, name, email, createdAt)
 * @throws Error "Unauthorized" jika token tidak valid atau data sesi tidak ditemukan
 */
export const getCurrentUser = async (token: string) => {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  const user = result[0];

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
};

/**
 * Mengakhiri sesi aktif pengguna (Logout).
 * Fungsi ini akan menghapus data session token yang cocok dari database, sehingga token tersebut tidak dapat digunakan lagi.
 * 
 * @param token - String session token yang ingin dihapus/di-logout
 * @throws Error "Unauthorized" jika session token tidak ditemukan di database
 */
export const logoutUser = async (token: string) => {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (!session) {
    throw new Error('Unauthorized');
  }

  await db.delete(sessions).where(eq(sessions.token, token));
};
