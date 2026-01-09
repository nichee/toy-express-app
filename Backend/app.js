import express from 'express';
import cors from 'cors';
import { getCompanies, getCompanyByEmail, createCompany, checkPassword, getProductsByCompany, updateCompany, getProduct, deleteProduct, getProductsPaginated, getProductsCount, searchProducts } from './db.js';
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
    try {
        const { company_name, email, password } = req.body;

        if (!company_name || !email || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const insertId = await createCompany(company_name, email, password);
        res.status(201).json({ 
            message: "Company created successfully",
            id: insertId
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Email already exists' });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to create company' });
    }
});


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

        // Change != to !== for strict comparison
        if (req.company.id !== parseInt(company_id)) {
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


// Update company profile
app.put('/companies/:id', authenticateToken, async (req, res) => {
    try {
        const company_id = req.params.id;
        const { company_name } = req.body;
        
        // Check authorization
        if (req.company.id != company_id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Add updateCompany function to db.js
        await updateCompany(company_id, company_name);
        res.json({ message: 'Company updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update company' });
    }
});


// Delete a product
app.delete('/products/:id', authenticateToken, async (req, res) => {
    try {
        const product_id = req.params.id;
        
        // Add getProduct and deleteProduct functions to db.js
        const product = await getProduct(product_id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Check if user owns this product
        if (product.company_id != req.company.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        await deleteProduct(product_id);
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});


// Get products with pagination
app.get('/products', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const products = await getProductsPaginated(limit, offset);
        const total = await getProductsCount();
        
        res.json({
            products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});


// Search products by name
app.get('/products/search', authenticateToken, async (req, res) => {
    try {
        const { q } = req.query; // ?q=searchterm
        
        if (!q) {
            return res.status(400).json({ error: 'Search query required' });
        }
        
        const products = await searchProducts(q);
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Search failed' });
    }
});


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



