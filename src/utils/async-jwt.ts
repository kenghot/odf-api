import * as jwt from "jsonwebtoken";

export const jwtSign = (
    payload: string | Buffer | object,
    secretOrPrivateKey: jwt.Secret,
    options: jwt.SignOptions
): Promise<string> => {
    return new Promise((resolve, reject) => {
        jwt.sign(payload, secretOrPrivateKey, options, (err, token) => {
            if (err) return reject(err);

            resolve(token);
        });
    });
};

export const jwtVerify = (
    token: string,
    secretOrPrivateKey: string | Buffer | jwt.GetPublicKeyOrSecret,
    options?: jwt.VerifyOptions
): Promise<string | object | jwt.VerifyErrors> => {
    return new Promise((resolve, rejects) => {
        jwt.verify(token, secretOrPrivateKey, options, (err, decoded) => {
            if (err) return rejects(err);

            resolve(decoded);
        });
    });
};
