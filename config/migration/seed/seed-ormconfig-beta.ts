module.exports = {
  type: "mysql",
  host: "203.150.91.218",
  port: 3306,
  username: "dop_user",
  password: "p@2sWord",
  database: "dop",
  synchronize: false,
  logging: false,
  entities: ["src/entities/**/*.ts"],
  migrations: ["src/seed/**/*.ts"],
  subscribers: ["src/subscriber/**/*.ts"],
  cli: {
    entitiesDir: "src/entities",
    migrationsDir: "src/seed",
    subscribersDir: "src/subscriber"
  }
};
