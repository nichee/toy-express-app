import mysql from 'mysql2'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
dotenv.config()

console.log(process.env.MYSQL_DB)
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB
}).promise()

export async function getCompanies() {
    const [rows] = await pool.query("select * from companies");
    return rows
}

export async function getCompany(id) {
    const [row] = await pool.query(`
    select * 
    from companies 
    where id=?
    `, [id]);

    return row[0]
}

export async function createCompany(company_name, email, password) { // TODO
    const password_hash = await bcrypt.hash(password, 10);
    await pool.query(`
        INSERT INTO companies (company_name, email, password_hash)
        VALUES (?, ?, ?)
        `, [company_name, email, password_hash])
}

export async function checkPassword(company_id, password) {
    const [result] = await pool.query(`
        SELECT password_hash
        FROM companies
        WHERE id=?
        `, [company_id]);
    console.log(result);

    if (result.length === 0) {
        return false;
    }

    const password_hash = result[0].password_hash;
    return await bcrypt.compare(password, password_hash);
}
// const companies = await getCompanies();
// console.log(companies);

// const company = await getCompany(1);
// console.log(company);

createCompany("visier", "visier@tech.gov.sg", "password1")
const isValid = await checkPassword(4, "password1");
console.log(isValid);

// export {getCompanies, getCompany, createCompany} // this is a either/or situation - either named export or export at bottom
