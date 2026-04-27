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
      name: t.String(),
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 6 })
    })
  });
