import { Elysia, t } from 'elysia';
import * as usersService from '../services/users-service';

export const usersRoute = new Elysia({ prefix: '/api/users' })
  .post('/register', async ({ body, set }) => {
    try {
      await usersService.registerUser(body);
      return { data: 'OK' };
    } catch (error: any) {
      if (error.message === 'Email sudah terdaftar') {
        set.status = 400;
        return { error: error.message };
      }
      set.status = 500;
      return { error: 'Internal Server Error' };
    }
  }, {
    body: t.Object({
      name: t.String({ maxLength: 255 }),
      email: t.String({ format: 'email', maxLength: 255 }),
      password: t.String({ minLength: 6, maxLength: 255 })
    }),
    response: {
      200: t.Object({ data: t.String() }),
      400: t.Object({ error: t.String() }),
      500: t.Object({ error: t.String() })
    },
    detail: {
      tags: ['Auth'],
      summary: 'Daftar user baru',
      description: 'Mendaftarkan user baru ke sistem.'
    }
  })
  .post('/login', async ({ body, set }) => {
    try {
      const result = await usersService.loginUser(body);
      return { data: result };
    } catch (error: any) {
      if (error.message === 'Email atau password salah') {
        set.status = 401;
        return { error: error.message };
      }
      set.status = 500;
      return { error: 'Internal Server Error' };
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email', maxLength: 255 }),
      password: t.String({ maxLength: 255 })
    }),
    response: {
      200: t.Object({ 
        data: t.Object({ 
          token: t.String() 
        }) 
      }),
      401: t.Object({ error: t.String() }),
      500: t.Object({ error: t.String() })
    },
    detail: {
      tags: ['Auth'],
      summary: 'Login user',
      description: 'Melakukan login dan mendapatkan token autentikasi.'
    }
  })
  .get('/current', async ({ headers, set }) => {
    try {
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      const token = authHeader.substring(7);
      if (!token) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      const result = await usersService.getCurrentUser(token);
      return { data: result };
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        set.status = 401;
        return { error: 'Unauthorized' };
      }
      set.status = 500;
      return { error: 'Internal Server Error' };
    }
  }, {
    response: {
      200: t.Object({
        data: t.Object({
          email: t.String(),
          name: t.String()
        })
      }),
      401: t.Object({ error: t.String() }),
      500: t.Object({ error: t.String() })
    },
    detail: {
      tags: ['Users'],
      summary: 'Dapatkan user saat ini',
      description: 'Mendapatkan informasi profil user yang sedang login menggunakan Bearer token.'
    }
  })
  .delete('/logout', async ({ headers, set }) => {
    try {
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      const token = authHeader.substring(7);
      if (!token) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      await usersService.logoutUser(token);
      return { data: 'ok' };
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        set.status = 401;
        return { error: 'Unauthorized' };
      }
      set.status = 500;
      return { error: 'Internal Server Error' };
    }
  }, {
    response: {
      200: t.Object({ data: t.String() }),
      401: t.Object({ error: t.String() }),
      500: t.Object({ error: t.String() })
    },
    detail: {
      tags: ['Auth'],
      summary: 'Logout user',
      description: 'Menghapus session atau token user yang sedang login.'
    }
  });
