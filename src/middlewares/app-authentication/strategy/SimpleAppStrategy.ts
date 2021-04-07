import {
  AuthStrategy,
  AuthParams,
  AuthResult
} from "../../../interfaces/AuthStrategy";
import { ValidateError } from "../../error/error-type";
import { clientIdConfig } from "../../../../client-id.config";

const defaultResult: AuthResult = {
  success: false,
  data: {}
};

export class SimpleAppStrategy implements AuthStrategy {
  authenticate(params: AuthParams): AuthResult {
    const { req } = params;
    const clientId = req.get("client_id");
    const result: AuthResult = defaultResult;

    if (!clientId) {
      throw new ValidateError({
        message: "ข้อมูลในการเข้าถึงระบบไม่สมบูรณ์",
        name: "ไม่สามารถเข้าสู่ระบบได้"
      });
    }

    const { secretKey } = req.body;

    const config = clientIdConfig[clientId];

    if (config.secretKey !== secretKey) {
      throw new ValidateError({
        message: "รหัสลับของผู้ใช้ไม่ถูกต้อง",
        name: "ไม่สามารถเข้าสู่ระบบได้"
      });
    }

    result.success = true;
    result.data = { secretKey };

    return result;
  }
}
