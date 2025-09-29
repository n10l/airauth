/* eslint-disable no-console */
/**
 * Example: Advanced password security with Argon2 and TOTP
 * Demonstrates secure password handling and multi-factor authentication
 * Note: Console statements are used for demonstration purposes
 */
import {
  hashPassword,
  verifyPassword,
  needsRehash,
  validatePasswordStrength,
  generateTOTPSetup,
  verifyTOTPCode,
  generateBackupCodes,
  PasswordPolicyValidator,
  generateSecurePassword,
} from '../security/password';

// ============================================================================
// Password Registration Flow
// ============================================================================

interface UserWithPassword {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  lastLogin?: Date;
}

export class SecurePasswordManager {
  private passwordPolicy = new PasswordPolicyValidator({
    minLength: 12,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    forbidCommonPasswords: true,
    forbidUserInfo: true,
    maxAge: 90, // 90 days
    preventReuse: 5, // Last 5 passwords
  });

  /**
   * Register new user with secure password
   */
  async registerUser(userData: { email: string; name: string; password: string }) {
    console.log('🔐 Starting secure user registration...');

    // Step 1: Validate password strength
    const strengthResult = this.passwordPolicy.validate(userData.password, {
      name: userData.name,
      email: userData.email,
    });

    if (!strengthResult.isValid) {
      throw new Error(`Password validation failed: ${strengthResult.feedback.join(', ')}`);
    }

    console.log('✅ Password validation passed:', {
      strength: strengthResult.strength,
      score: strengthResult.score,
    });

    // Step 2: Hash password with Argon2
    const hashedPassword = await hashPassword(userData.password, {
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3, // 3 iterations
      parallelism: 1, // 1 thread
    });

    console.log('✅ Password hashed with Argon2id');

    // Step 3: Store user (in real app, save to database)
    const user = {
      id: `user_${Date.now()}`,
      email: userData.email,
      name: userData.name,
      passwordHash: hashedPassword,
      passwordCreatedAt: new Date(),
      createdAt: new Date(),
    };

    console.log('✅ User registered successfully:', {
      id: user.id,
      email: user.email,
      hasSecurePassword: true,
    });

    return user;
  }

  /**
   * Authenticate user with password
   */
  async authenticateUser(email: string, password: string) {
    console.log('🔑 Authenticating user...');

    // In real app, fetch user from database
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    console.log('✅ Password verification successful');

    // Check if password hash needs updating
    if (needsRehash(user.passwordHash)) {
      console.log('🔄 Password hash needs updating...');

      const newHash = await hashPassword(password);
      await this.updateUserPasswordHash(user.id, newHash);

      console.log('✅ Password hash updated with latest parameters');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      lastLogin: new Date(),
    };
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    console.log('🔄 Changing user password...');

    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    const strengthResult = this.passwordPolicy.validate(newPassword, {
      name: user.name,
      email: user.email,
    });

    if (!strengthResult.isValid) {
      throw new Error(`New password validation failed: ${strengthResult.feedback.join(', ')}`);
    }

    // Hash new password
    const newHash = await hashPassword(newPassword);

    // Update password (in real app, save to database)
    await this.updateUserPasswordHash(userId, newHash);

    console.log('✅ Password changed successfully');

    return { success: true, message: 'Password updated successfully' };
  }

  // Mock database methods (implement with your database)
  private async getUserByEmail(_email: string): Promise<UserWithPassword | null> {
    // Mock implementation
    return null;
  }

  private async getUserById(_id: string): Promise<UserWithPassword | null> {
    // Mock implementation
    return null;
  }

  private async updateUserPasswordHash(_userId: string, _hash: string): Promise<void> {
    // Mock implementation
    console.log(`Updated password hash for user ${_userId}`);
  }
}

// ============================================================================
// TOTP Multi-Factor Authentication
// ============================================================================

export class TOTPManager {
  /**
   * Set up TOTP for user
   */
  async setupTOTP(userId: string, accountName: string) {
    console.log('🔐 Setting up TOTP for user...');

    // Generate TOTP setup
    const totpSetup = generateTOTPSetup(accountName, 'NextAirAuth App', {
      digits: 6,
      step: 30,
      algorithm: 'sha1',
    });

    console.log('✅ TOTP setup generated:', {
      secretLength: totpSetup.secret.length,
      backupCodesCount: totpSetup.backupCodes.length,
      qrCodeGenerated: totpSetup.qrCode.startsWith('data:image/'),
    });

    // In real app, save secret and backup codes to database (encrypted)
    await this.saveTOTPSecret(userId, totpSetup.secret, totpSetup.backupCodes);

    return {
      qrCode: totpSetup.qrCode,
      manualEntryKey: totpSetup.secret,
      backupCodes: totpSetup.backupCodes,
      uri: totpSetup.uri,
    };
  }

  /**
   * Verify TOTP code during login
   */
  async verifyTOTP(userId: string, code: string) {
    console.log('🔍 Verifying TOTP code...');

    // Get user's TOTP secret from database
    const totpData = await this.getTOTPSecret(userId);
    if (!totpData) {
      throw new Error('TOTP not set up for this user');
    }

    // Verify TOTP code
    const isValid = verifyTOTPCode(code, totpData.secret, {
      window: 1, // Allow 1 time step tolerance
    });

    if (isValid) {
      console.log('✅ TOTP verification successful');
      return { success: true, method: 'totp' };
    }

    // If TOTP fails, try backup codes
    const backupResult = this.verifyBackupCode(code, totpData.backupCodes);
    if (backupResult.isValid) {
      console.log('✅ Backup code verification successful');

      // Remove used backup code
      await this.removeUsedBackupCode(userId, backupResult.codeIndex);

      return { success: true, method: 'backup_code' };
    }

    console.log('❌ TOTP verification failed');
    throw new Error('Invalid TOTP code or backup code');
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(userId: string) {
    console.log('🔄 Regenerating backup codes...');

    const newBackupCodes = generateBackupCodes(10);
    await this.updateBackupCodes(userId, newBackupCodes);

    console.log('✅ New backup codes generated');

    return newBackupCodes;
  }

  /**
   * Disable TOTP for user
   */
  async disableTOTP(userId: string, password: string) {
    console.log('🔓 Disabling TOTP...');

    // Verify password before disabling TOTP
    const user = await this.getUserById(userId);
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Password verification required to disable TOTP');
    }

    await this.removeTOTPSecret(userId);

    console.log('✅ TOTP disabled successfully');

    return { success: true, message: 'TOTP disabled' };
  }

  // Mock database methods
  private async saveTOTPSecret(userId: string, _secret: string, _backupCodes: string[]) {
    console.log(`Saved TOTP secret for user ${userId}`);
  }

  private async getTOTPSecret(_userId: string) {
    // Mock implementation
    return {
      secret: 'JBSWY3DPEHPK3PXP',
      backupCodes: ['ABCD-1234', 'EFGH-5678'],
    };
  }

  private async removeUsedBackupCode(userId: string, codeIndex: number) {
    console.log(`Removed backup code ${codeIndex} for user ${userId}`);
  }

  private async updateBackupCodes(userId: string, _codes: string[]) {
    console.log(`Updated backup codes for user ${userId}`);
  }

  private async removeTOTPSecret(userId: string) {
    console.log(`Removed TOTP secret for user ${userId}`);
  }

  private async getUserById(_userId: string) {
    // Mock implementation
    return { passwordHash: 'mock-hash' };
  }

  private verifyBackupCode(code: string, backupCodes: string[]) {
    // Simplified backup code verification
    const normalizedCode = code.replace(/[-\s]/g, '').toUpperCase();
    const index = backupCodes.findIndex(
      bc => bc.replace(/[-\s]/g, '').toUpperCase() === normalizedCode
    );

    return {
      isValid: index !== -1,
      codeIndex: index,
    };
  }
}

// ============================================================================
// Password Strength Checker API
// ============================================================================

export class PasswordStrengthAPI {
  /**
   * Check password strength endpoint
   */
  async checkPasswordStrength(password: string, userInfo?: { name?: string; email?: string }) {
    const result = validatePasswordStrength(password);

    // Additional checks with user info
    const policy = new PasswordPolicyValidator({
      forbidUserInfo: true,
      forbidCommonPasswords: true,
    });

    const policyResult = policy.validate(password, userInfo);

    return {
      strength: result.strength,
      score: result.score,
      isValid: result.isValid && policyResult.isValid,
      feedback: [...result.feedback, ...policyResult.feedback],
      suggestions: this.generatePasswordSuggestions({
        score: result.score,
        feedback: { suggestions: Array.isArray(result.feedback) ? result.feedback : [] },
      }),
    };
  }

  /**
   * Generate secure password
   */
  generatePassword(
    options: {
      length?: number;
      includeSymbols?: boolean;
      excludeSimilar?: boolean;
    } = {}
  ) {
    const { length = 16, includeSymbols = true, excludeSimilar = true } = options;

    return generateSecurePassword(length, {
      includeLowercase: true,
      includeUppercase: true,
      includeNumbers: true,
      includeSpecialChars: includeSymbols,
      excludeSimilar,
    });
  }

  private generatePasswordSuggestions(result: {
    score: number;
    feedback: { suggestions?: string[]; warning?: string };
  }) {
    const suggestions = [];

    if (result.score < 4) {
      suggestions.push('Consider using a longer password (12+ characters)');
    }

    if (result.feedback.suggestions?.includes('Add uppercase letters')) {
      suggestions.push('Add some uppercase letters (A-Z)');
    }

    if (result.feedback.suggestions?.includes('Add special characters')) {
      suggestions.push('Include special characters like !@#$%^&*');
    }

    suggestions.push("Use a unique password that you haven't used elsewhere");
    suggestions.push('Consider using a password manager');

    return suggestions;
  }
}

// ============================================================================
// Complete Authentication Flow Example
// ============================================================================

export class SecureAuthFlow {
  private passwordManager = new SecurePasswordManager();
  private totpManager = new TOTPManager();
  private strengthAPI = new PasswordStrengthAPI();

  /**
   * Complete user registration with security features
   */
  async registerWithSecurity(userData: {
    email: string;
    name: string;
    password: string;
    enableTOTP?: boolean;
  }) {
    try {
      // Step 1: Register user with secure password
      const user = await this.passwordManager.registerUser(userData);

      // Step 2: Set up TOTP if requested
      let totpSetup = null;
      if (userData.enableTOTP) {
        totpSetup = await this.totpManager.setupTOTP(user.id, userData.email);
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        totp: totpSetup,
        message: 'Registration successful with enhanced security',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Complete login with MFA
   */
  async loginWithMFA(credentials: { email: string; password: string; totpCode?: string }) {
    try {
      // Step 1: Authenticate with password
      const user = await this.passwordManager.authenticateUser(
        credentials.email,
        credentials.password
      );

      // Step 2: Verify TOTP if provided
      if (credentials.totpCode) {
        await this.totpManager.verifyTOTP(user.id, credentials.totpCode);
      }

      return {
        success: true,
        user,
        requiresMFA: !credentials.totpCode,
        message: credentials.totpCode ? 'Login successful' : 'TOTP code required',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Password strength check endpoint
   */
  async checkPassword(
    password: string,
    userInfo?: { name?: string; email?: string; [key: string]: unknown }
  ) {
    return this.strengthAPI.checkPasswordStrength(password, userInfo);
  }

  /**
   * Generate secure password
   */
  generateSecurePassword(options?: {
    length?: number;
    includeSymbols?: boolean;
    includeNumbers?: boolean;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
  }) {
    return this.strengthAPI.generatePassword(options);
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

export const securityExamples = {
  passwordManager: new SecurePasswordManager(),
  totpManager: new TOTPManager(),
  strengthAPI: new PasswordStrengthAPI(),
  authFlow: new SecureAuthFlow(),
};

// Example usage:
/*
const authFlow = new SecureAuthFlow()

// Register user with TOTP
const registration = await authFlow.registerWithSecurity({
  email: 'user@example.com',
  name: 'John Doe',
  password: 'MySecure!Password123',
  enableTOTP: true
})

// Login with MFA
const login = await authFlow.loginWithMFA({
  email: 'user@example.com',
  password: 'MySecure!Password123',
  totpCode: '123456'
})

// Check password strength
const strength = await authFlow.checkPassword('weakpass', {
  name: 'John Doe',
  email: 'user@example.com'
})

// Generate secure password
const securePassword = authFlow.generateSecurePassword({
  length: 20,
  includeSymbols: true,
  excludeSimilar: true
})
*/
