const fs = require('fs');
const readline = require('readline-sync');

// Check if SubtleCrypto is available in Node.js
const crypto = require('crypto').webcrypto;

// Constants
const PASSWORD_FILE = 'passwords.json';
const ENCODING = 'utf-8';

// Helper function to derive a key using PBKDF2
async function deriveKey(masterPassword, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt data using AES-GCM
async function encryptData(data, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization vector
  const enc = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    enc.encode(data)
  );
  return { ciphertext: Buffer.from(encrypted).toString('base64'), iv: Buffer.from(iv).toString('base64') };
}

// Decrypt data using AES-GCM
async function decryptData(ciphertext, iv, key) {
  const dec = new TextDecoder();
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: Buffer.from(iv, 'base64') },
    key,
    Buffer.from(ciphertext, 'base64')
  );
  return dec.decode(decrypted);
}

// Save passwords to a JSON file
function savePasswords(passwords) {
  fs.writeFileSync(PASSWORD_FILE, JSON.stringify(passwords), ENCODING);
}

// Load passwords from the JSON file
function loadPasswords() {
  if (!fs.existsSync(PASSWORD_FILE)) return {};
  const data = fs.readFileSync(PASSWORD_FILE, ENCODING);
  return JSON.parse(data);
}
module.exports = {
  deriveKey,
  encryptData,
  decryptData,
  savePasswords,
  loadPasswords
};


