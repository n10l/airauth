import { describe, it, expect, _vi } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  needsRehash,
  validatePasswordStrength,
  isCommonPassword,
  generateTOTPSecret,
  generateTOTPCode,
  verifyTOTPCode,
  generateTOTPSetup,
  generateBackupCodes,
  verifyBackupCode,
  PasswordPolicyValidator,
  generateSecurePassword,
  type PasswordHashOptions,
  type TOTPOptions,
  type PasswordPolicy,
} from '../password';

describe('Password Security', () => {
  describe('Password Hashing', () => {
    it('should hash password with default options', async () => {
      const password = 'testPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should hash password with custom options', async () => {
      const password = 'testPassword123!';
      const options: PasswordHashOptions = {
        memoryCost: 2 ** 15,
        timeCost: 2,
        parallelism: 1,
        hashLength: 32,
      };

      const hash = await hashPassword(password, options);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should create different hashes for same password', async () => {
      const password = 'testPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should reject empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password cannot be empty');
    });

    it('should reject password that is too long', async () => {
      const longPassword = 'a'.repeat(1001);

      await expect(hashPassword(longPassword)).rejects.toThrow('Password too long');
    });

    it('should handle different parallelism values', async () => {
      const password = 'testPassword123!';
      const options = { parallelism: 4 };

      const hash = await hashPassword(password, options);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should handle different time cost values', async () => {
      const password = 'testPassword123!';
      const options = { timeCost: 2 }; // Minimum valid value is 2

      const hash = await hashPassword(password, options);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });
  });

  describe('Password Verification', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123!';
      const wrongPassword = 'wrongPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should handle empty password', async () => {
      const isValid = await verifyPassword('', 'hash');
      expect(isValid).toBe(false);
    });

    it('should handle empty hash', async () => {
      const isValid = await verifyPassword('password', '');
      expect(isValid).toBe(false);
    });

    it('should handle malformed hash', async () => {
      const password = 'testPassword123!';
      const malformedHash = 'invalid-hash';

      const isValid = await verifyPassword(password, malformedHash);
      expect(isValid).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValidLower = await verifyPassword('testpassword123!', hash);
      const isValidUpper = await verifyPassword('TESTPASSWORD123!', hash);

      expect(isValidLower).toBe(false);
      expect(isValidUpper).toBe(false);
    });

    it('should handle very long password verification', async () => {
      const longPassword = 'a'.repeat(1001);
      const hash = await hashPassword('shortpass');

      const isValid = await verifyPassword(longPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('Rehashing', () => {
    it('should identify when rehash is needed with different options', () => {
      const hash = '$argon2id$v=19$m=65536,t=3,p=1$random$hash';
      const newOptions: PasswordHashOptions = {
        memoryCost: 2 ** 17,
        timeCost: 4,
      };

      const needsNew = needsRehash(hash, newOptions);
      expect(typeof needsNew).toBe('boolean');
    });

    it('should handle malformed hash for rehashing', () => {
      const malformedHash = 'invalid-hash';
      const needsNew = needsRehash(malformedHash);

      expect(needsNew).toBe(true); // Should need rehash for invalid hash
    });

    it('should handle empty hash', () => {
      const emptyHash = '';
      const needsNew = needsRehash(emptyHash);

      expect(needsNew).toBe(true);
    });
  });

  describe('Password Strength Validation', () => {
    it('should validate very weak password', () => {
      const result = validatePasswordStrength('123');

      expect(result.isValid).toBe(false);
      expect(['very-weak', 'weak']).toContain(result.strength);
      expect(result.score).toBeLessThan(4);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should validate weak password', () => {
      const result = validatePasswordStrength('password');

      expect(result.strength).toBe('weak');
      expect(result.feedback.length).toBeGreaterThan(0);
      expect(result.feedback).toContain('Password must contain uppercase letters');
      expect(result.feedback).toContain('Password must contain numbers');
      expect(result.feedback).toContain('Password must contain special characters');
    });

    it('should validate fair password', () => {
      const result = validatePasswordStrength('Password1');

      expect(result.strength).toBe('fair');
      expect(result.score).toBeGreaterThan(2);
    });

    it('should validate good password', () => {
      const result = validatePasswordStrength('Password123!');

      expect(result.strength).toBe('good');
      expect(result.score).toBeGreaterThan(4);
    });

    it('should validate strong password', () => {
      const result = validatePasswordStrength('MyVerySecurePassword123!');

      expect(result.strength).toBe('strong');
      expect(result.score).toBeGreaterThan(6);
      expect(result.isValid).toBe(true);
    });

    it('should detect repetitive characters', () => {
      const result = validatePasswordStrength('aaaaaaa');

      expect(result.feedback).toContain('Avoid repeating characters');
    });

    it('should detect common patterns', () => {
      const result = validatePasswordStrength('password123');

      expect(result.feedback).toContain('Avoid common patterns and words');
    });

    it('should handle empty password', () => {
      const result = validatePasswordStrength('');

      expect(result.isValid).toBe(false);
      expect(['very-weak', 'weak']).toContain(result.strength);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Common Password Detection', () => {
    it('should detect common passwords', () => {
      const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];

      commonPasswords.forEach(password => {
        expect(isCommonPassword(password)).toBe(true);
      });
    });

    it('should not flag uncommon passwords as common', () => {
      const uncommonPasswords = ['MySecureP@ssw0rd!', 'UnusualCombination789', 'RandomPhrase#2024'];

      uncommonPasswords.forEach(password => {
        expect(isCommonPassword(password)).toBe(false);
      });
    });

    it('should be case insensitive', () => {
      expect(isCommonPassword('PASSWORD')).toBe(true);
      expect(isCommonPassword('Password')).toBe(true);
      expect(isCommonPassword('pAsSwOrD')).toBe(true);
    });
  });

  describe('TOTP (Time-based OTP)', () => {
    describe('TOTP Secret Generation', () => {
      it('should generate secret with default length', () => {
        const secret = generateTOTPSecret();

        expect(secret).toBeDefined();
        expect(typeof secret).toBe('string');
        expect(secret.length).toBe(32);
        expect(/^[A-Z2-7]+$/.test(secret)).toBe(true); // Base32 format
      });

      it('should generate secret with custom length', () => {
        const secret = generateTOTPSecret(16);

        expect(secret.length).toBe(16);
        expect(/^[A-Z2-7]+$/.test(secret)).toBe(true);
      });

      it('should generate different secrets each time', () => {
        const secret1 = generateTOTPSecret();
        const secret2 = generateTOTPSecret();

        expect(secret1).not.toBe(secret2);
      });
    });

    describe('TOTP Code Generation', () => {
      const testSecret = 'JBSWY3DPEHPK3PXP';

      it('should generate 6-digit code by default', () => {
        const code = generateTOTPCode(testSecret);

        expect(code).toBeDefined();
        expect(typeof code).toBe('string');
        expect(code.length).toBe(6);
        expect(/^\d{6}$/.test(code)).toBe(true);
      });

      it('should generate code with custom digits', () => {
        const options: TOTPOptions = { digits: 8 };
        const code = generateTOTPCode(testSecret, options);

        expect(code.length).toBe(8);
        expect(/^\d{8}$/.test(code)).toBe(true);
      });

      it('should generate code with custom step', () => {
        const options: TOTPOptions = { step: 60 };
        const code = generateTOTPCode(testSecret, options);

        expect(code).toBeDefined();
        expect(/^\d{6}$/.test(code)).toBe(true);
      });

      it('should generate same code for same time window', () => {
        const code1 = generateTOTPCode(testSecret);
        const code2 = generateTOTPCode(testSecret);

        // Should be same within the same 30-second window
        expect(code1).toBe(code2);
      });
    });

    describe('TOTP Code Verification', () => {
      const testSecret = 'JBSWY3DPEHPK3PXP';

      it('should verify correct code', () => {
        const code = generateTOTPCode(testSecret);
        const isValid = verifyTOTPCode(code, testSecret);

        expect(isValid).toBe(true);
      });

      it('should reject incorrect code', () => {
        const wrongCode = '000000';
        const isValid = verifyTOTPCode(wrongCode, testSecret);

        expect(isValid).toBe(false);
      });

      it('should handle empty code', () => {
        const isValid = verifyTOTPCode('', testSecret);

        expect(isValid).toBe(false);
      });

      it('should handle empty secret', () => {
        const isValid = verifyTOTPCode('123456', '');

        expect(isValid).toBe(false);
      });
    });

    describe('TOTP Setup Generation', () => {
      it('should generate complete TOTP setup', () => {
        const setup = generateTOTPSetup('testuser@example.com', 'TestApp');

        expect(setup).toHaveProperty('secret');
        expect(setup).toHaveProperty('qrCode');
        expect(setup).toHaveProperty('uri');
        expect(setup).toHaveProperty('backupCodes');

        expect(typeof setup.secret).toBe('string');
        expect(typeof setup.qrCode).toBe('string');
        expect(typeof setup.uri).toBe('string');
        expect(Array.isArray(setup.backupCodes)).toBe(true);
        expect(setup.backupCodes.length).toBe(10);
      });

      it('should generate valid TOTP URI', () => {
        const setup = generateTOTPSetup('test@example.com', 'App');

        expect(setup.uri.startsWith('otpauth://totp/')).toBe(true);
        expect(setup.uri).toContain('test%40example.com'); // URL encoded email
        expect(setup.uri).toContain('issuer=App');
        expect(setup.uri).toContain(`secret=${setup.secret}`);
      });
    });
  });

  describe('Backup Codes', () => {
    describe('Backup Code Generation', () => {
      it('should generate default number of backup codes', () => {
        const codes = generateBackupCodes();

        expect(Array.isArray(codes)).toBe(true);
        expect(codes.length).toBe(10);

        codes.forEach(code => {
          expect(typeof code).toBe('string');
          expect(code.length).toBe(9); // Format: XXXX-XXXX
          expect(/^[A-F0-9]{4}-[A-F0-9]{4}$/.test(code)).toBe(true);
        });
      });

      it('should generate custom number of backup codes', () => {
        const codes = generateBackupCodes(5);

        expect(codes.length).toBe(5);
      });

      it('should generate unique backup codes', () => {
        const codes = generateBackupCodes(20);
        const uniqueCodes = [...new Set(codes)];

        expect(uniqueCodes.length).toBe(codes.length);
      });
    });

    describe('Backup Code Verification', () => {
      it('should verify correct backup code', () => {
        const codes = ['ABCD1234', 'EFGH5678'];
        const testCode = 'ABCD-1234';

        const result = verifyBackupCode(testCode, codes);

        expect(result.isValid).toBe(true);
        expect(result.codeIndex).toBe(0);
      });

      it('should reject incorrect backup code', () => {
        const codes = ['ABCD1234', 'EFGH5678'];
        const wrongCode = 'WRONG123';

        const result = verifyBackupCode(wrongCode, codes);

        expect(result.isValid).toBe(false);
        expect(result.codeIndex).toBe(-1);
      });

      it('should handle empty codes array', () => {
        const result = verifyBackupCode('TESTCODE', []);

        expect(result.isValid).toBe(false);
        expect(result.codeIndex).toBe(-1);
      });

      it('should normalize code format', () => {
        const codes = ['ABCD1234'];
        const testCode = 'abcd 1234'; // Different format

        const result = verifyBackupCode(testCode, codes);

        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Password Policy Validator', () => {
    let policy: PasswordPolicy;
    let validator: PasswordPolicyValidator;

    it('should create validator with default policy', () => {
      const _validator = new PasswordPolicyValidator();
      expect(validator).toBeDefined();
    });

    it('should validate password with custom policy', () => {
      const _policy: PasswordPolicy = {
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        forbidCommonPasswords: true,
      };
      const _validator = new PasswordPolicyValidator(policy);

      const result = validator.validate('SecureP@ssw0rd!');

      expect(result.isValid).toBe(true);
      expect(result.feedback.length).toBe(0);
    });

    it('should detect length violations', () => {
      const _policy: PasswordPolicy = { minLength: 8, maxLength: 12 };
      const _validator = new PasswordPolicyValidator(policy);

      const shortResult = validator.validate('Ab1!');
      const longResult = validator.validate('VeryLongPassword123!');

      expect(shortResult.isValid).toBe(false);
      expect(shortResult.feedback).toContain('Password must be at least 8 characters long');

      expect(longResult.isValid).toBe(false);
      expect(longResult.feedback).toContain('Password must be no more than 12 characters long');
    });

    it('should detect character type violations', () => {
      const _policy: PasswordPolicy = {
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
      };
      const _validator = new PasswordPolicyValidator(policy);

      const noUppercase = validator.validate('lowercase1!');
      const noLowercase = validator.validate('UPPERCASE1!');
      const noNumbers = validator.validate('NoNumbers!');
      const noSpecial = validator.validate('NoSpecialChars1');

      expect(noUppercase.feedback).toContain('Password must contain uppercase letters');
      expect(noLowercase.feedback).toContain('Password must contain lowercase letters');
      expect(noNumbers.feedback).toContain('Password must contain numbers');
      expect(noSpecial.feedback).toContain('Password must contain special characters');
    });

    it('should detect common passwords', () => {
      const _policy: PasswordPolicy = { forbidCommonPasswords: true };
      const _validator = new PasswordPolicyValidator(policy);

      const result = validator.validate('password');

      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain('Password is too common');
    });

    it('should detect user info in password', () => {
      const _policy: PasswordPolicy = { forbidUserInfo: true };
      const _validator = new PasswordPolicyValidator(policy);
      const userInfo = { name: 'John', email: 'john@example.com' };

      const nameResult = validator.validate('Johnpassword123!', userInfo);
      const emailResult = validator.validate('john_password123!', userInfo);

      // Check if feedback contains user info related message
      expect(nameResult.isValid).toBe(false);
      expect(emailResult.isValid).toBe(false);
    });
  });

  describe('Secure Password Generation', () => {
    it('should generate password with default length', () => {
      const password = generateSecurePassword();

      expect(typeof password).toBe('string');
      expect(password.length).toBe(16);
    });

    it('should generate password with custom length', () => {
      const password = generateSecurePassword(24);

      expect(password.length).toBe(24);
    });

    it('should generate password with all character types by default', () => {
      const password = generateSecurePassword(20);

      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/\d/.test(password)).toBe(true);
      expect(/[^a-zA-Z\d]/.test(password)).toBe(true);
    });

    it('should generate password with only specified character types', () => {
      const options = {
        includeUppercase: false,
        includeSpecialChars: false,
      };
      const password = generateSecurePassword(16, options);

      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[A-Z]/.test(password)).toBe(false);
      expect(/[^a-zA-Z\d]/.test(password)).toBe(false);
      // Note: numbers might not be present in every short password due to randomness
    });

    it('should generate different passwords each time', () => {
      const password1 = generateSecurePassword();
      const password2 = generateSecurePassword();

      expect(password1).not.toBe(password2);
    });

    it('should exclude similar characters when specified', () => {
      const options = { excludeSimilar: true };
      const password = generateSecurePassword(20, options);

      // Should not contain 0, O, l, I, etc.
      expect(/[0OlI]/.test(password)).toBe(false);
    });

    it('should throw error when no character types are included', () => {
      const options = {
        includeLowercase: false,
        includeUppercase: false,
        includeNumbers: false,
        includeSpecialChars: false,
      };

      expect(() => generateSecurePassword(16, options)).toThrow(
        'At least one character type must be included'
      );
    });
  });
});
