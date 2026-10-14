const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  })

  const file = path.join(__dirname, '../src/seeds/seed.sql')
  const sql = fs.readFileSync(file, 'utf8')
  await connection.query(sql)

  await connection.end()
  console.log('Seed complete')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
