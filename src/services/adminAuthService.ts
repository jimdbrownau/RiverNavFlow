import { AdminService } from './adminService';

const ADMIN_SESSION_KEY = 'rivernav_admin_session';
const ADMIN_PASSWORD_KEY = 'rivernav_master_admin_password';

export interface AdminSession {
  email: string;
  token: string;
  loginTime: number;
  expiresAt: number;
  role: 'SUPER_ADMIN';
}

const DEFAULT_ADMIN_EMAIL = 'jimdbrownau@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'AdminNav2026!';

export class AdminAuthService {
  public static getMasterEmail(): string {
    return DEFAULT_ADMIN_EMAIL;
  }

  public static getDefaultPasswordHint(): string {
    return DEFAULT_ADMIN_PASSWORD;
  }

  private static getStoredPassword(): string {
    return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
  }

  public static isAuthenticated(): boolean {
    try {
      const sessionStr = sessionStorage.getItem(ADMIN_SESSION_KEY) || localStorage.getItem(ADMIN_SESSION_KEY);
      if (!sessionStr) return false;

      const session: AdminSession = JSON.parse(sessionStr);
      if (Date.now() > session.expiresAt) {
        this.logout();
        return false;
      }

      return session.role === 'SUPER_ADMIN' && !!session.token;
    } catch {
      return false;
    }
  }

  public static getActiveSession(): AdminSession | null {
    try {
      const sessionStr = sessionStorage.getItem(ADMIN_SESSION_KEY) || localStorage.getItem(ADMIN_SESSION_KEY);
      if (!sessionStr) return null;
      const session: AdminSession = JSON.parse(sessionStr);
      if (Date.now() > session.expiresAt) {
        this.logout();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  public static login(
    emailInput: string, 
    passwordInput: string, 
    rememberMe: boolean = true
  ): { success: boolean; error?: string } {
    const trimmedEmail = emailInput.trim().toLowerCase();
    const trimmedPass = passwordInput.trim();

    const expectedEmail = DEFAULT_ADMIN_EMAIL.toLowerCase();
    const expectedPassword = this.getStoredPassword();

    // Check credentials (allows master admin email or "admin")
    const isEmailValid = trimmedEmail === expectedEmail || trimmedEmail === 'admin' || trimmedEmail === 'admin@rivernav.internal';
    const isPasswordValid = trimmedPass === expectedPassword;

    if (!isEmailValid) {
      // Record failed login in audit logs
      const logs = AdminService.getAuditLogs();
      AdminService.saveAuditLogs([
        {
          id: `auth-fail-${Date.now()}`,
          userId: 'anonymous',
          userName: 'Unauthorized Attempt',
          vesselName: 'Unknown Terminal',
          packName: `Failed Admin Login Attempt (${trimmedEmail})`,
          riverName: 'Admin Gateway',
          packSizeMb: 0,
          timestamp: Date.now(),
          location: 'Remote Admin Access Portal',
          ipAddress: '198.51.100.12',
          status: 'denied',
        },
        ...logs.slice(0, 49),
      ]);

      return {
        success: false,
        error: 'Unrecognized administrator email address. Please use the registered master administrator account.',
      };
    }

    if (!isPasswordValid) {
      // Record failed login in audit logs
      const logs = AdminService.getAuditLogs();
      AdminService.saveAuditLogs([
        {
          id: `auth-fail-pass-${Date.now()}`,
          userId: 'usr-admin-1',
          userName: 'Jim Brown (Admin)',
          vesselName: 'M/Y Pacific Nomad',
          packName: 'Failed Admin Login (Incorrect Passkey)',
          riverName: 'Admin Gateway',
          packSizeMb: 0,
          timestamp: Date.now(),
          location: 'Master Login Screen',
          ipAddress: '198.51.100.24',
          status: 'denied',
        },
        ...logs.slice(0, 49),
      ]);

      return {
        success: false,
        error: 'Invalid master administrator password. Check your passkey and try again.',
      };
    }

    // Issue 24-hour admin session
    const sessionDurationMs = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const session: AdminSession = {
      email: DEFAULT_ADMIN_EMAIL,
      token: `rnv_adm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      loginTime: Date.now(),
      expiresAt: Date.now() + sessionDurationMs,
      role: 'SUPER_ADMIN',
    };

    const sessionPayload = JSON.stringify(session);
    if (rememberMe) {
      localStorage.setItem(ADMIN_SESSION_KEY, sessionPayload);
    } else {
      sessionStorage.setItem(ADMIN_SESSION_KEY, sessionPayload);
    }

    // Record successful admin authentication in audit logs
    const logs = AdminService.getAuditLogs();
    AdminService.saveAuditLogs([
      {
        id: `auth-success-${Date.now()}`,
        userId: 'usr-admin-1',
        userName: 'Jim Brown (Super Admin)',
        vesselName: 'M/Y Pacific Nomad',
        packName: 'Master Admin Session Authenticated',
        riverName: 'Admin Gateway',
        packSizeMb: 0,
        timestamp: Date.now(),
        location: 'Master Security Terminal (WGS-84)',
        ipAddress: '127.0.0.1 (Authenticated)',
        status: 'completed',
      },
      ...logs.slice(0, 49),
    ]);

    return { success: true };
  }

  public static logout(): void {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);

    // Record logout
    try {
      const logs = AdminService.getAuditLogs();
      AdminService.saveAuditLogs([
        {
          id: `auth-logout-${Date.now()}`,
          userId: 'usr-admin-1',
          userName: 'Jim Brown (Super Admin)',
          vesselName: 'M/Y Pacific Nomad',
          packName: 'Admin Session Terminated (Logged Out)',
          riverName: 'Admin Gateway',
          packSizeMb: 0,
          timestamp: Date.now(),
          location: 'Terminal Closed',
          ipAddress: '127.0.0.1',
          status: 'completed',
        },
        ...logs.slice(0, 49),
      ]);
    } catch {}
  }

  public static changePassword(
    currentPass: string, 
    newPass: string
  ): { success: boolean; error?: string } {
    const existing = this.getStoredPassword();
    if (currentPass.trim() !== existing) {
      return { success: false, error: 'Current password does not match.' };
    }

    if (newPass.trim().length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }

    localStorage.setItem(ADMIN_PASSWORD_KEY, newPass.trim());
    return { success: true };
  }
}
