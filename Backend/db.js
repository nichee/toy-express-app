import mysql from 'mysql2'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
dotenv.config()

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

export async function getCompanyByEmail(email) {
    const [row] = await pool.query(`
    SELECT * 
    FROM companies 
    WHERE email=?
    `, [email]);

    return row[0]
}

export async function createCompany(company_name, email, password) {
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(`
        INSERT INTO companies (company_name, email, password_hash)
        VALUES (?, ?, ?)
        `, [company_name, email, password_hash]);
    return result.insertId;
}

export async function checkPassword(company_id, password) {
    const [result] = await pool.query(`
        SELECT password_hash
        FROM companies
        WHERE id=?
        `, [company_id]);

    if (result.length === 0) {
        return false;
    }

    const password_hash = result[0].password_hash;
    return await bcrypt.compare(password, password_hash);
}

export async function getProductsByCompany(company_id) {
    const [result] = await pool.query(`
        SELECT products.id, product_name, price
        FROM products
        WHERE products.company_id = ?
        `, [company_id]);
    
    return result;
}

export async function loginCompany(email, password) {
    const [rows] = await pool.query(`
        SELECT id, company_name, email, password_hash
        FROM companies
        WHERE email = ?
        `, [email]);
    
    if (rows.length == 0) {
        return false;
    }

    const company = rows[0];
    const isValid = await bcrypt.compare(password, company.password_hash);

    if (!isValid) {
        return null
    }

    return {
        id: company.id,
        company_name: company.company_name,
        email: company.email
    };
}


// export {getCompanies, getCompany, createCompany} // this is a either/or situation - either named export or export at bottom
// createCompany("apple", "apple@gmail.com", "password");
