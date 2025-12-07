import { describe, it, expect } from 'vitest';

describe('Mercado Pago Integration', () => {
  it('should validate Mercado Pago access token', async () => {
    const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    
    expect(mpAccessToken).toBeDefined();
    expect(mpAccessToken).toMatch(/^APP_USR-/);
    
    // Test the token by making a simple API call to Mercado Pago
    const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
      },
    });
    
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });
});
