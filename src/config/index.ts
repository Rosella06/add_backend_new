import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: process.env.SERVER_PORT || 3000,
  tcpPort: Number(process.env.TCP_PORT) || 2004,
  databaseUrl: process.env.DATABASE_URL,
  rabbit: {
    host: process.env.RABBIT_HOST || 'localhost',
    port: Number(process.env.RABBIT_PORT) || 5672,
    user: process.env.RABBIT_USER || 'guest',
    pass: process.env.RABBIT_PASS || 'guest'
  },
  pharmacyApiUrl: process.env.PHARMACY_API_URL
}
