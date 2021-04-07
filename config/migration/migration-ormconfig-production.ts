import { CamelNamingStrategy } from "./helper/camel-naming";

module.exports = {
  type: "mysql",
  host: "122.155.204.84",
  port: 3306,
  username: "dba",
  password: "db@dm1n@CAT",
  database: "dop",
  synchronize: false,
  logging: false,
  entities: ["src/entities/**/*.ts"],
  migrations: ["src/migration/**/*.ts"],
  subscribers: ["src/subscriber/**/*.ts"],
  cli: {
    entitiesDir: "src/entities",
    migrationsDir: "src/migration",
    subscribersDir: "src/subscriber"
  },
  namingStrategy: new CamelNamingStrategy()
};
