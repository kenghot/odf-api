import * as jwt from "jsonwebtoken";
import { SignOptions } from "jsonwebtoken";
import {
  GenerateTokenParams,
  TokenGenerator,
  VerifyTokenParams
} from "../interfaces/TokenGenerator";

const defaultParams: GenerateTokenParams = {
  payload: {},
  secretKey: "",
  options: {}
};

export class JwtGenerator implements TokenGenerator {
  async generateToken(
    params: GenerateTokenParams = defaultParams
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const { secretKey, expiresIn, payload = {} } = params;
      const options = this.prepareOptions(expiresIn);

      jwt.sign(payload, secretKey, options && options, (err, token) => {
        if (err) {
          console.log(err);
          return reject(err);
        }

        resolve(token);
      });
    });
  }

  private prepareOptions(expiresIn: number | string) {
    const options: SignOptions = {};
    if (expiresIn) {
      options.expiresIn = expiresIn;
    }

    return options;
  }

  async verifyToken(params: VerifyTokenParams) {
    return new Promise((resolve, reject) => {
      const { token, secretKey } = params;

      jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
          console.error(err);
          return reject(err);
        }

        resolve(decoded);
      });
    });
  }
}
