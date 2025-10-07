import request from 'supertest';
import app from '../src/server';

describe('Health Endpoint', () => {
  it('should return ok status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body).toEqual({ ok: true });
  });
});


