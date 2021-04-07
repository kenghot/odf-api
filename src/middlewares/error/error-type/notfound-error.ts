import { ICustomError } from "../error-handler";

export class NotFoundError extends Error {
    static errorCode = 404;
    static errorName = "NotFoundError";

    public __proto__: Error;

    constructor(error: ICustomError, ...params) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(...params);

        const trueProto = new.target.prototype;
        this.__proto__ = trueProto;

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NotFoundError);
        }

        if (error.name) {
            NotFoundError.errorName = error.name;
        }

        this.message = error.message;
    }
}
