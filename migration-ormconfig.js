const {
  CustomCamelNamingStrategy,
} = require('./src/utils/custom-camel-naming');

module.exports = {
  type: 'mysql',
  host: '203.150.91.218',
  port: 3306,
  username: 'dop_user',
  password: 'p@2sWord',
  database: 'dop',
  synchronize: false,
  logging: false,
  entities: ['src/entities/**/*.ts'],
  migrations: ['src/migration/**/*.ts'],
  subscribers: ['src/subscriber/**/*.ts'],
  cli: {
    entitiesDir: 'src/entities',
    migrationsDir: 'src/migration',
    subscribersDir: 'src/subscriber',
  },
  charset: 'UTF8_GENERAL_CI',
  namingStrategy: new CustomCamelNamingStrategy(),
};
