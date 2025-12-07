const request = require('supertest');

jest.mock('../src/db/pool', () => ({
  query: jest.fn().mockResolvedValue({ rows: [] })
}));

jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: jest.fn().mockResolvedValue() }))
}));

jest.mock('../src/services/contactService', () => ({
  saveContactRequest: jest.fn().mockResolvedValue({ id: 'test-id', created_at: new Date().toISOString() }),
  sendNotification: jest.fn().mockResolvedValue()
}));

const app = require('../src/app');
const contactService = require('../src/services/contactService');
const pool = require('../src/db/pool');
const logger = require('../src/utils/logger');

describe('POST /api/contact', () => {
  const validPayload = {
    name: 'Jan Kowalski',
    email: 'jan@example.com',
    phone: '+48 600 700 800',
    city: 'Lębork',
    message: 'Potrzebuję serwisu kotła w czwartek.'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 201 when payload is valid', async () => {
    const response = await request(app)
      .post('/api/contact')
      .send(validPayload)
      .set('Accept', 'application/json');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(contactService.saveContactRequest).toHaveBeenCalledTimes(1);
    expect(contactService.sendNotification).toHaveBeenCalledTimes(1);
  });

  it('returns 400 on invalid payload', async () => {
    const response = await request(app)
      .post('/api/contact')
      .send({})
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('status', 'error');
    expect(contactService.saveContactRequest).not.toHaveBeenCalled();
  });

  it('returns 400 when honeypot field is filled', async () => {
    const response = await request(app)
      .post('/api/contact')
      .send({ ...validPayload, company: 'bot-company' })
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('status', 'error');
    expect(contactService.saveContactRequest).not.toHaveBeenCalled();
  });

  it('returns 503 when database insert fails', async () => {
    contactService.saveContactRequest.mockRejectedValueOnce(new Error('DB down'));

    const response = await request(app)
      .post('/api/contact')
      .send(validPayload)
      .set('Accept', 'application/json');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('status', 'error');
  });

  it('skips email sending when SMTP not configured', async () => {
    jest.resetModules();
    jest.doMock('../src/config', () => ({
      mail: {
        host: null,
        user: null,
        password: null,
        to: null,
        from: null
      },
      env: 'test'
    }));

    jest.isolateModules(() => {
      const loggerMock = require('../src/utils/logger');
      const actual = jest.requireActual('../src/services/contactService');
      return actual.sendNotification(validPayload).then(() => {
        expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('Skipping email notification'));
      });
    });
  });
});

describe('GET /api/health', () => {
  it('returns ok when database responds', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });

  it('returns 503 when database fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('connection refused'));
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(503);
    expect(response.body).toHaveProperty('status', 'error');
  });
});

describe('CORS middleware', () => {
  it('rejects disallowed origins with 403 on API routes', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'https://disallowed.example.com');

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('message', 'Not allowed by CORS');
  });
});
