const http = require('http');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const mysql = require('mysql');
const Keychain = require('./passwordManager');
//const keychain = Keychain.init('masterpassword');

// Create a connection to the database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'yourpassword',
    database: 'password_manager'
});

// Connect to the database
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});

// Function to serve static files
function serveStaticFile(res, filePath, contentType, responseCode = 200) {
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500);
            res.end('Error loading file');
        } else {
            res.writeHead(responseCode, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

const server = http.createServer((req, res) => {
    if (req.url === '/' && req.method === 'GET') {
        serveStaticFile(res, path.join(__dirname, 'password-manager.html'), 'text/html');
    } else if (req.url === '/submit' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const parsedData = querystring.parse(body);
            const username = parsedData.username;
            const password = parsedData.password;

            // Encrypt the password using Keychain module
            const keychain = await Keychain.init('masterpassword'); // Use a master password
            const encryptedPassword = await keychain.encrypt(password);

            // Insert data into the database
            const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
            db.query(sql, [username, encryptedPassword], (err, result) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Error inserting data');
                } else {
                    // Redirect to a success page
                    res.writeHead(302, { 'Location': '/success' });
                    res.end();
                }
            });
        });
    } else if (req.url === '/success' && req.method === 'GET') {
        serveStaticFile(res, path.join(__dirname, 'success.html'), 'text/html');
    } else if (req.url === '/verify' && req.method === 'GET') {
        serveStaticFile(res, path.join(__dirname, 'password-verify.html'), 'text/html');
    }else if (req.url === '/verifyUser' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const parsedData = querystring.parse(body);
            const username = parsedData.username;

            // Verify data in the database
            const sql = 'SELECT * FROM users WHERE username = ?';
            db.query(sql, [username], async (err, result) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Error retrieving data');
                } else if (result.length > 0) {
                    const keychain = await Keychain.init('masterpassword'); // Use the same master password
                    const decryptedPassword = await keychain.decrypt(result[0].password);
                    console.log('Decrypted password:', decryptedPassword);
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end('<p>User found </p>' + result[0].username + '<p> with password </p>' + decryptedPassword);
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<h1>User not found</h1>');
                }
            });
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>Page not found</h1>');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});