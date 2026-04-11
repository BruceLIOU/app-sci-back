interface DbConfig {
  HOST: string
  USER: string
  PASSWORD: string
  DB: string
  dialect: string
  pool: {
    max: number
    min: number
    acquire: number
    idle: number
  }
}

const dbConfig: DbConfig = {
  HOST: process.env.DATABASE_HOST || "localhost",
  USER: process.env.DATABASE_USER || "postgres",
  PASSWORD: process.env.DATABASE_PASSWORD || "21Déc1977!",
  DB: "sci",
  dialect: "postgres",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
}

module.exports = dbConfig
