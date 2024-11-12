const fs = require('fs');
const readline = require('readline-sync');


const { encryptData, decryptData, deriveKey, loadPasswords, savePasswords } = require('./passwordManager.js');
// Constants


async function main() {
    console.log('--- Welcome to the Password Manager ---');
    
    const masterPassword = readline.question('Enter your master password: ', { hideEchoBack: true });
  
    // Generate or retrieve the encryption key
    const salt = 'fixed-salt-for-demo'; // Use a unique salt per user in a real implementation
    const key = await deriveKey(masterPassword, salt);
  
    let passwords = loadPasswords();
  
    while (true) {
      console.log('\nOptions:');
      console.log('1. Add a new password');
      console.log('2. Retrieve a password');
      console.log('3. Exit');
      const choice = readline.question('Choose an option: ');
  
      if (choice === '1') {
        const account = readline.question('Enter account name: ');
        const password = readline.question('Enter password: ', { hideEchoBack: true });
  
        // Encrypt the password
        const { ciphertext, iv } = await encryptData(password, key);
        passwords[account] = { ciphertext, iv };
        savePasswords(passwords);
        console.log('Password saved successfully!');
  
      } else if (choice === '2') {
        const account = readline.question('Enter account name to retrieve: ');
  
        if (!passwords[account]) {
          console.log('Account not found!');
          continue;
        }
  
        const { ciphertext, iv } = passwords[account];
        try {
          const decryptedPassword = await decryptData(ciphertext, iv, key);
          console.log(`Password for ${account}: ${decryptedPassword}`);
        } catch (err) {
          console.log('Failed to decrypt password. Incorrect master password?');
        }
  
      } else if (choice === '3') {
        console.log('Exiting...');
        break;
      } else {
        console.log('Invalid option. Try again.');
      }
    }
  }
  
  main().catch(console.error);
  
