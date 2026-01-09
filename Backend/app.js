import express from 'express';
import cors from 'cors';
import { getCompanies, getCompanyByEmail, createCompany, checkPassword, getProductsByCompany } from './db.js';
import { authenticateToken } from './middleware/auth.js';
import jwt from 'jsonwebtoken';

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello World!!!!');
})

app.post('/', (req, res) => {
    res.sendStatus(200);
    res.send("Got a post request!");
})


app.post('/companies', async (req, res) => {
    const { company_name, email, password } = req.body;

    if (!company_name || !email || !password) {
        return res.status(400).json({ error: "Missing required fields"})
    }

    const insertId = await createCompany(company_name, email, password);
    res.status(201).json({ 
        message: "Company created successfully",
        id: insertId
    });
})


// Login endpoint
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }

        const company = await getCompanyByEmail(email);
        
        if (!company) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const isValid = await checkPassword(company.id, password);
        
        if (!isValid) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Create JWT token (expires in 1 hour)
        const token = jwt.sign(
            { id: company.id, email: company.email, company_name: company.company_name },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ 
            message: "Login successful",
            token,
            company: {
                id: company.id,
                company_name: company.company_name,
                email: company.email
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});


// protected endpoints
app.get('/companies', authenticateToken, async (req, res) => {
    try {
        console.log("companies GET");
        const companies = await getCompanies();
        res.send(companies);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch companies'});
    }
})

// example of nested route
app.get('/companies/:id/products', authenticateToken, async (req, res) => {
    try {
        console.log("company products GET");
        const company_id = req.params.id;

        if (req.company.id != company_id) {
            return res.status(403).json({ error: 'Access denied: You can only view your own company products' });
        }

        const products = await getProductsByCompany(company_id)
        res.send(products);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve company products'});
    }
})


// example of using company ID from the JWT token
app.get('/my-products', authenticateToken, async (req, res) => {
    try {
        console.log("company products GET");
        // Use the company ID from the JWT token
        const company_id = req.company.id;
        
        const products = await getProductsByCompany(company_id);
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve company products' });
    }
})


// app.get('/users', (req, res) => {
//     res.send("users page");
// })
// app.put('/users', (req, res) => {
//     res.send("Got a PUT request at /user")
// })

// app.delete('/users', (req, res) => {
//     res.sendStatus(200);
//     res.send("Successfully deleted!")
// })


// error handler
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Something broke!')
  })

app.listen(port, () => {
    console.log(`Example app listening at ${port}`);
})


  
