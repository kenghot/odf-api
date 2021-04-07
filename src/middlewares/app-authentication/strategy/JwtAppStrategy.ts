import {
  AuthStrategy,
  AuthParams,
  AuthResult
} from "../../../interfaces/AuthStrategy";
import { ValidateError } from "../../error/error-type";
import { TokenGenerator } from "../../../interfaces/TokenGenerator";
import { clientIdConfig } from "../../../../client-id.config";

const defaultResult: AuthResult = {
  success: false,
  data: {}
};

export class JwtAppStrategy implements AuthStrategy {
  constructor(private tokenGenerator: TokenGenerator) {}

  async authenticate(params: AuthParams): Promise<AuthResult> {
    const { req } = params;
    const clientId = req.get("client_id");
    const result: AuthResult = defaultResult;

    if (!clientId) {
      throw new ValidateError({
        message: "ข้อมูลในการเข้าถึงระบบไม่สมบูรณ์",
        name: "ไม่สามารถเข้าสู่ระบบได้"
      });
    }

    const config = clientIdConfig[clientId];

    if (!config) {
      throw new ValidateError({
        message: "ข้อมูลในการเข้าถึงระบบไม่สมบูรณ์",
        name: "ไม่สามารถเข้าสู่ระบบได้"
      });
    }

    const secretKey = config.secretKey;

    if (!secretKey) {
      throw new ValidateError({
        message: "ข้อมูลในการเข้าถึงระบบไม่สมบูรณ์",
        name: "ไม่สามารถเข้าสู่ระบบได้"
      });
    }

    const rawToken = req.get("Authorization");
    const [bearer, token] = rawToken.split(" ");

    if (bearer !== "Bearer") {
      throw new ValidateError({
        message: "ข้อมูลในการเข้าถึงระบบไม่สมบูรณ์",
        name: "ไม่สามารถเข้าสู่ระบบได้"
      });
    }

    const decoded = await this.tokenGenerator.verifyToken({ token, secretKey });

    if (!decoded) {
      throw new ValidateError({
        message: "ข้อมูลในการเข้าถึงระบบไม่สมบูรณ์",
        name: "ไม่สามารถเข้าสู่ระบบได้"
      });
    }

    result.success = true;
    result.data = decoded;

    return result;
  }
}
