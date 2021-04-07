import { ICustomError } from "../error-handler";

export class DBError extends Error {
  static errorCode = 503;
  // static errorName = "DBError";
  static errorName = "เกิดข้อผิดพลาดที่ระบบฐานข้อมูล";
  static errorMessage =
    "กรุณาลองใหม่อีกครั่งหากยังพบข้อผิดพลาดกรุณาติดต่อผู้พัฒนาระบบ";

  public __proto__: Error;

  constructor(error: ICustomError, ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    const trueProto = new.target.prototype;
    this.__proto__ = trueProto;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DBError);
    }

    if (error.name) {
      DBError.errorName = error.name;
    }

    this.message = error.message;
    // ? `${DBError.errorName} ${DBError.errorMessage} ${error.message}`
    // : `${DBError.errorName} ${DBError.errorMessage}`;
  }
}
