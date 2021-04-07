export interface IClientId {
  secretKey: string;
  expiresIn: string;
  username: string;
  password: string;
}
interface IClientIdConfig {
  [key: string]: IClientId;
}

export const clientIdConfig: IClientIdConfig = {
  // ["odf-website"]: {
  //   secretKey: process.env.WEBSITE_JWT_SECRET_KEY,
  //   expiresIn: process.env.JWT_EXPIRED_IN
  // },
  ["odf-ktb"]: {
    secretKey: process.env.KTB_JWT_SECRET_KEY,
    expiresIn: process.env.KTB_JWT_EXPIRED_ID,
    username: process.env.KTB_USER,
    password: process.env.KTB_PASS
  }
};
