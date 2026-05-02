import { db } from '../db';
import { users, sessions } from '../db/schema';
import { eq } from 'drizzle-orm';

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
