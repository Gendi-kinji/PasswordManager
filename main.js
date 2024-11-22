const Keychain = require('./passwordManager');

async function main() {
    try {
        console.log("\n--- Initializing Password Manager ---");
        const masterPassword = 'SuperSecret123!';
        const keychain = await Keychain.init(masterPassword);
        document.getElementById("passwordForm").addEventListener("submit", async function() {
        var pass=document.getElementById("password").value;
        var user=document.getElementById("username").value;
  
        console.log("\n--- Storing Passwords ---");
        await keychain.set(user, pass);

        document.getElementById("message").innerHTML = "Password stored successfully!";
        setTimeout(function() {
        document.getElementById("passwordRetrieve").style.visibility = "visible";
        document.getElementById("passwordForm").style.visibility = "hidden";
        },5000);
        window.location.href="/";
    });
        var user2=document.getElementById("username2").value;
        document.getElementById("passwordRetrieve").addEventListener("submit", async function() {
        console.log("\n--- Retrieving Passwords ---");
        console.log("Password for"+ user2 + await keychain.get(user2));
        document.getElementById("message2").innerHTML = "Password for"+ user2 + await keychain.get(user2);
        setTimeout(function() {
            document.getElementById("passwordVerify").style.visibility = "visible";
            document.getElementById("passwordRetrieve").style.visibility = "hidden";
            },5000);

        });
        console.log("\n--- Dumping Keychain ---");
        const [serialized, hash] = await keychain.dump();
        console.log("Serialized:", serialized);
        console.log("Hash:", hash);

        console.log("\n--- Reloading Keychain ---");
        const loadedKeychain = await Keychain.load(masterPassword, serialized, hash);
        var user3=document.getElementById("username3").value;
        document.getElementById("passwordVerify").addEventListener("submit", async function() {
        console.log("\n--- Verifying Reloaded Passwords ---");
        console.log("Reloaded password for google.com:", await loadedKeychain.get(user3));
        document.getElementById("message3").innerHTML = "Reloaded password for"+user3+ await loadedKeychain.get(user3);
        setTimeout(function() {
            document.getElementById("passwordVerify").style.visibility = "hidden";
            document.getElementById("passwordForm").style.visibility = "visible";
            },5000);
        });

} catch (err) {
    console.error("Error:", err);
}   
}
main();
