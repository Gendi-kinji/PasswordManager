const Keychain = require('./passwordManager');

async function main() {
    try {
        console.log("\n--- Initializing Password Manager ---");
        const masterPassword = 'SuperSecret123!';
        const keychain = await Keychain.init(masterPassword);

        console.log("\n--- Storing Passwords ---");
        await keychain.set("google.com", "GooglePass123");
        await keychain.set("github.com", "GitHubKey789");

        console.log("\n--- Retrieving Passwords ---");
        console.log("Password for google.com:", await keychain.get("google.com"));
        console.log("Password for github.com:", await keychain.get("github.com"));

        console.log("\n--- Dumping Keychain ---");
        const [serialized, hash] = await keychain.dump();
        console.log("Serialized:", serialized);
        console.log("Hash:", hash);

        console.log("\n--- Reloading Keychain ---");
        const loadedKeychain = await Keychain.load(masterPassword, serialized, hash);

        console.log("\n--- Verifying Reloaded Passwords ---");
        console.log("Reloaded password for google.com:", await loadedKeychain.get("google.com"));
        console.log("Reloaded password for github.com:", await loadedKeychain.get("github.com"));
    } catch (err) {
        console.error("Error:", err);
    }
}

main();
