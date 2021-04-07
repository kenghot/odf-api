import { CamelNamingStrategy } from "./helper/camel-naming";

module.exports = {
  type: "mysql",
  // host: "odf.ccu8u64cgc5g.ap-southeast-1.rds.amazonaws.com",
  host: "odf.cljujz3c0aon.ap-southeast-1.rds.amazonaws.com",
  port: 3306,
  username: "admin",
  password: "odf2020d",
  database: "odf",
  synchronize: false,
  logging: false,
  entities: ["src/entities/**/*.ts"],
  migrations: ["src/migration/**/*.ts"],
  subscribers: ["src/subscriber/**/*.ts"],
  cli: {
    entitiesDir: "src/entities",
    migrationsDir: "src/migration",
    subscribersDir: "src/subscriber",
  },
  charset: "UTF8_GENERAL_CI",
  namingStrategy: new CamelNamingStrategy(),
};
