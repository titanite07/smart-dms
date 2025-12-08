const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const dotenv = require('dotenv');
dotenv.config();
const clerkAuth = ClerkExpressRequireAuth({
    onError: (err, req, res) => {
        console.error('Clerk Auth Error:', err);
        res.status(401).json({ message: 'Unauthenticated' });
    }
});
module.exports = clerkAuth;
