import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export interface AuthUser {
  username: string;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET!;
  private static readonly ADMIN_USERNAME = process.env.ADMIN_USERNAME!;
  private static readonly ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

  static async validateCredentials(username: string, password: string): Promise<boolean> {
    if (username !== this.ADMIN_USERNAME) {
      return false;
    }

    // For simplicity, we'll compare plain text passwords
    // In production, you should hash the password in the environment
    return password === this.ADMIN_PASSWORD;
  }

  static generateToken(user: AuthUser): string {
    return jwt.sign(user, this.JWT_SECRET, { expiresIn: '24h' });
  }

  static verifyToken(token: string): AuthUser | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as AuthUser;
    } catch {
      return null;
    }
  }

  static extractTokenFromRequest(request: NextRequest): string | null {
    // Check Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check cookies
    const tokenCookie = request.cookies.get('auth-token');
    return tokenCookie?.value || null;
  }

  static async authenticateRequest(request: NextRequest): Promise<AuthUser | null> {
    const token = this.extractTokenFromRequest(request);
    if (!token) {
      return null;
    }

    return this.verifyToken(token);
  }
}

export default AuthService;