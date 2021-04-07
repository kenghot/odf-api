import { ICustomError } from "../error-handler";

export const errorPaymentMessage = {
  [403]: "ไม่สามารถชำระเงินได้เนื่องจากยอดชำระมีมูลค่ามากกว่ายอดหนี้คงค้าง",
  [404]: "ไม่สามารถชำระเงินหรือยกเลิกการชำระเงินได้(ทำรายการซ้ำหรือไม่พบรายการที่ต้องการ)"
};

export class PaymentError extends Error {
  static errorCode = 900;
  static errorName = "PaymentError";

  public __proto__: Error;

  constructor(public error: ICustomError, ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    const trueProto = new.target.prototype;
    this.__proto__ = trueProto;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PaymentError);
    }

    if (error.name) {
      PaymentError.errorName = error.name;
    }

    this.message = error.message;
  }
}
