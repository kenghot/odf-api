import { CamelNamingStrategy } from "./helper/camel-naming";

module.exports = {
  type: "mysql",
  host: "203.150.91.218",
  port: 3306,
  username: "dop_app",
  password: "!Mission2Mars?",
  database: "dop",
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
  namingStrategy: new CamelNamingStrategy(),
};
