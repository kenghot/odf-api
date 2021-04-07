import { AuthStrategy, AuthOptions } from "../../interfaces/AuthStrategy";
import { ValidateError } from "../error/error-type";

export const authentication = (
  strategy: AuthStrategy,
  options?: AuthOptions
) => {
  return async (req, res, next) => {
    try {
      const { success, data } = await strategy.authenticate({
        req,
        res,
        options
      });

      if (!success) {
        throw new ValidateError({
          message: "ข้อมูลในการเข้าถึงระบบไม่สมบูรณ์",
          name: "ไม่สามารถเข้าสู่ระบบได้"
        });
      }

      req.credential = data;

      next();
    } catch (err) {
      console.log(err);
      next(err);
    }
  };
};
