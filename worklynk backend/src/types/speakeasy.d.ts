declare module 'speakeasy' {
  export interface GeneratedSecret {
    ascii: string;
    hex: string;
    base32: string;
    otpauth_url?: string;
  }
  export function generateSecret(options?: any): GeneratedSecret;
  export namespace totp {
    export function verify(options: {
      secret: string;
      encoding: 'ascii' | 'hex' | 'base32';
      token: string;
      window?: number;
      step?: number;
      epoch?: number;
    }): boolean;
  }
}
