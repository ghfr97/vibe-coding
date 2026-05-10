import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { usersRoute } from './routes/users-route';

export const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: 'Vibe Coding API Documentation',
        version: '1.0.0',
        description: 'Dokumentasi API interaktif untuk Vibe Coding project'
      }
    }
  }))
  .get('/', () => 'Hello World')
  .use(usersRoute);
