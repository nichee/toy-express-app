import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] // bearer token

    if (!token) {
        return res.status(401).json({ error: "Access token required"});
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, company) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token'})
        }
        req.company = company;
        next();
    });
}
