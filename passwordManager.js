const subtle = require("crypto").subtle;
const { stringToBuffer, bufferToString, encodeBuffer, decodeBuffer, getRandomBytes } = require('./lib');
const PBKDF2_ITERATIONS = 100000; 
class Keychain {
    constructor(hmacKey, aesKey, kvs = {}) {
        this.hmacKey = hmacKey;
        this.aesKey = aesKey;
        this.kvs = kvs;
    }

    // Helper function to derive keys from a master password using PBKDF2
    static async deriveKeys(password, salt) {
        const passwordBuffer = stringToBuffer(password);
        const keyMaterial = await subtle.importKey(
            "raw",
            passwordBuffer,
            "PBKDF2",
            false,
            ["deriveBits", "deriveKey"]
        );

        // Derive 512 bits (64 bytes) to split into two keys (HMAC & AES)
        const derivedBits = await subtle.deriveBits(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: PBKDF2_ITERATIONS,
                hash: "SHA-256"
            },
            keyMaterial,
            512
        );

        const keyBuffer = new Uint8Array(derivedBits);
        const hmacKey = await subtle.importKey(
            "raw",
            keyBuffer.slice(0, 32),
            {
                name: "HMAC",
                hash: { name: "SHA-256" }
            },
            false,
            ["sign", "verify"]
        );
        const aesKey = await subtle.importKey(
            "raw",
            keyBuffer.slice(32),
            "AES-GCM",
            false,
            ["encrypt", "decrypt"]
        );

        return { hmacKey, aesKey };
    }

    // Initialize a new keychain
    static async init(password) {
        const salt = getRandomBytes(16);
        const { hmacKey, aesKey } = await this.deriveKeys(password, salt);
        return new Keychain(hmacKey, aesKey, { salt: encodeBuffer(salt) });
    }

    // Load an existing keychain from a serialized representation
    static async load(password, representation, trustedDataCheck) {
        try {
            console.log("\n[Load] Representation:", representation);
            const data = JSON.parse(representation);
            const salt = decodeBuffer(data.salt);

            const { hmacKey, aesKey } = await this.deriveKeys(password, salt);

            // Verify the integrity if a trusted hash is provided
            if (trustedDataCheck) {
                const kvsHash = await subtle.digest("SHA-256", stringToBuffer(data.kvs));
                if (bufferToString(kvsHash) !== trustedDataCheck) {
                    throw new Error("Data integrity check failed");
                }
            }

            console.log("[Load] Successfully loaded keychain.");
            return new Keychain(hmacKey, aesKey, JSON.parse(data.kvs));
        } catch (err) {
            console.error("Failed to load keychain:", err);
            throw err;
        }
    }

    async encrypt(value) {
        const iv = getRandomBytes(12);
        const encrypted = await subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            this.aesKey,
            stringToBuffer(value)
        );
        return encodeBuffer(iv) + ':' + encodeBuffer(encrypted);
    }

    async decrypt(value) {
        const [iv, encrypted] = value.split(':').map(decodeBuffer);
        const decrypted = await subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            this.aesKey,
            encrypted
        );
        return bufferToString(decrypted);
    }

    async hashDomain(domain) {
        const domainBuffer = stringToBuffer(domain);
        const hmac = await subtle.sign("HMAC", this.hmacKey, domainBuffer);
        return encodeBuffer(hmac);
    }

    async set(domain, password) {
        const domainHash = await this.hashDomain(domain);
        const encryptedPassword = await this.encrypt(password);
        this.kvs[domainHash] = encryptedPassword;
    }

    async get(domain) {
        const domainHash = await this.hashDomain(domain);
        const encryptedPassword = this.kvs[domainHash];
        if (!encryptedPassword) return null;
        return await this.decrypt(encryptedPassword);
    }

    async dump() {
        const kvsSerialized = JSON.stringify(this.kvs);
        const hashBuffer = await subtle.digest("SHA-256", stringToBuffer(kvsSerialized));
        const hash = bufferToString(hashBuffer);
        return [JSON.stringify({ salt: this.kvs.salt, kvs: kvsSerialized }), hash];
    }
}

module.exports = Keychain;