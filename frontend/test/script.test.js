const { isPhoneValid } = require('../script');

describe('Frontend Logic', () => {
  describe('isPhoneValid', () => {
    it('validates correct phone numbers', () => {
      expect(isPhoneValid('123456789')).toBe(true);
      expect(isPhoneValid('+48 123 456 789')).toBe(true);
      expect(isPhoneValid('123-456-789')).toBe(true);
      expect(isPhoneValid('500 600 700')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      expect(isPhoneValid('123')).toBe(false); // Too short
      expect(isPhoneValid('abc')).toBe(false); // Not numbers
      expect(isPhoneValid('')).toBe(false); // Empty
      expect(isPhoneValid('12345')).toBe(false); // Too short
    });
  });
});
