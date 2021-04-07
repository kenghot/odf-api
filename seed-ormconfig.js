const {
  CustomCamelNamingStrategy
} = require("./src/utils/custom-camel-naming");

module.exports = {
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "",
  database: "odf",
  synchronize: false,
  logging: false,
  entities: ["src/entities/**/*.ts"],
  migrations: ["src/seed/**/*.ts"],
  subscribers: ["src/subscriber/**/*.ts"],
  cli: {
    entitiesDir: "src/entities",
    migrationsDir: "src/seed",
    subscribersDir: "src/subscriber"
  },
  charset: "UTF8_GENERAL_CI",
  namingStrategy: new CustomCamelNamingStrategy()
};
