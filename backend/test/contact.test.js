const request = require('supertest');

jest.mock('../src/services/contactService', () => ({
  saveContactRequest: jest.fn().mockResolvedValue({ id: 'test-id', created_at: new Date().toISOString() }),
  sendNotification: jest.fn().mockResolvedValue()
}));

const app = require('../src/app');
const { saveContactRequest, sendNotification } = require('../src/services/contactService');

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
    expect(saveContactRequest).toHaveBeenCalledTimes(1);
    expect(sendNotification).toHaveBeenCalledTimes(1);
  });

  it('returns 400 on invalid payload', async () => {
    const response = await request(app)
      .post('/api/contact')
      .send({})
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('status', 'error');
    expect(saveContactRequest).not.toHaveBeenCalled();
  });

  it('returns 400 when honeypot field is filled', async () => {
    const response = await request(app)
      .post('/api/contact')
      .send({ ...validPayload, company: 'bot-company' })
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('status', 'error');
    expect(saveContactRequest).not.toHaveBeenCalled();
  });
});
