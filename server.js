const http = require('http');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const mysql = require('mysql');
const Keychain = require('./passwordManager');

// Create a connection to the database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'password_manager'
});

// Connect to the database
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});

const server = http.createServer((req, res) => {
    if (req.url === '/' && req.method === 'GET') {
        fs.readFile(path.join(__dirname, 'password-manager.html'), (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading file');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content);
            }
        });
    } else if (req.url === '/submit' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const parsedData = querystring.parse(body);
            const username = parsedData.username;
            const password = parsedData.password;

            // Encrypt the password using Keychain module
            const encryptedPassword = Keychain.encrypt(password);

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
        fs.readFile(path.join(__dirname, 'success.html'), (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading file');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content);
            }
        });
    } else if (req.url === '/verify' && req.method === 'GET') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const parsedData = querystring.parse(body);
            const username = parsedData.username;

            // Verify data in the database
            const sql = 'SELECT * FROM users WHERE username = ?';
            db.query(sql, [username], (err, result) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Error retrieving data');
                } else if (result.length > 0) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end('<h1>User found </h1>'+result[0].username+'<h1> with password </h1>'+Keychain.decrypt(result[0].password));
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