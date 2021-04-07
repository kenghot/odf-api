import { Request, Response } from "express";

export interface AuthRequest extends Request {}
export interface AuthResponse extends Response {}
export interface AuthOptions {
  fieldame?: string;
  password?: string;
  [x: string]: string | number | object;
}

export interface AuthParams {
  req: AuthRequest;
  res: AuthResponse;
  options?: AuthOptions;
}
export interface AuthResult {
  success: boolean;
  data: any;
}
export interface AuthStrategy {
  authenticate(params: AuthParams): Promise<AuthResult> | AuthResult;
}
