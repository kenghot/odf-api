module.exports = {
  type: "mysql",
  host: "odf.ccu8u64cgc5g.ap-southeast-1.rds.amazonaws.com",
  port: 3306,
  username: "root",
  password: "odf2019d",
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
  }
};
