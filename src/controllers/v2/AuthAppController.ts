import { TokenGenerator } from "../../interfaces/TokenGenerator";
import { ValidateError } from "../../middlewares/error/error-type";

export class AuthAppController {
  constructor(private tokenGenerator: TokenGenerator) {}

  signin = async (req, res, next) => {
    try {
      const token = await this.tokenGenerator.generateToken(req.credential);

      if (!token) {
        throw new ValidateError({
          message: "ไม่สามารถสร้างโทเค็นได้",
          name: "ไม่สามารถเข้าสู่ระบบได้"
        });
      }

      res.set("x-access-token", token).send({
        success: true
      });
    } catch (err) {
      next(err);
    }
  };
}
