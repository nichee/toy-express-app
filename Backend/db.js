import mysql from 'mysql2'

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'password',
    database: 'test_schema'
}).promise()

async function getCompanies(){
    const [rows] = await pool.query("select * from companies");
    return rows
}

const companies = getCompanies();
