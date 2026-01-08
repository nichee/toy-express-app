import mysql from 'mysql2'
import dotenv from 'dotenv'
dotenv.config();

console.log(process.env.MYSQL_DB)
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB
}).promise()

async function getCompanies() {
    const [rows] = await pool.query("select * from companies");
    return rows
}

async function getCompany(id) {
    const [row] = await pool.query(`
    select * 
    from companies 
    where id=?
    `, [id]);

    return row[0]
}

async function createCompany(company_name, email, password) { // TODO
    password_hash = bcrypt(password + salt)
}

const companies = await getCompanies();
console.log(companies);

const company = await getCompany(1);
console.log(company);
