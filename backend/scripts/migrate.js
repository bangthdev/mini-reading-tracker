const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  })

  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  const dir = path.join(__dirname, '../src/migrations')
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()

  const [applied] = await connection.query('SELECT filename FROM schema_migrations')
  const appliedSet = new Set(applied.map((row) => row.filename))

  for (const file of files) {
    if (appliedSet.has(file)) continue
    const sql = fs.readFileSync(path.join(dir, file), 'utf8')
    await connection.query(sql)
    await connection.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file])
    console.log(`Applied ${file}`)
  }

  await connection.end()
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
