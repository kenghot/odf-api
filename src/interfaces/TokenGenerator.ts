export interface GenerateTokenParams {
  [x: string]: any;
  secretKey: string;
  expiresIn?: string;
  // payload: any;
}
export interface VerifyTokenParams {
  [x: string]: any;
  token: string;
  secretKey: string;
}
export interface TokenGenerator {
  generateToken(params: GenerateTokenParams): Promise<string>;
  verifyToken(params: VerifyTokenParams);
}
