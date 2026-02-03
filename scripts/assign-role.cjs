/**
 * Script to assign roles to users in the new CENLAE project.
 * Usage: node scripts/assign-role.js <email> <role>
 */

const admin = require('firebase-admin');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'data', 'serviceAccountKey.json');

// Initialize Firebase Admin
try {
    const serviceAccount = require(SERVICE_ACCOUNT_PATH);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log(`✅ Connected to project: ${serviceAccount.project_id}`);
} catch (error) {
    console.error(`❌ Error loading credentials: ${error.message}`);
    process.exit(1);
}

async function assignRole(email, role) {
    try {
        const user = await admin.auth().getUserByEmail(email);

        await admin.auth().setCustomUserClaims(user.uid, { role: role });

        // Force token refresh by updating a dummy metadata field
        await admin.firestore().collection('users').doc(user.uid).set({
            role: role,
            roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`✅ Role '${role}' assigned to user ${email} (UID: ${user.uid})`);
        console.log(`⚠️  User must logout and login again for changes to take effect.`);

    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            console.error(`❌ User ${email} not found in Firebase Auth.`);
            console.log("   Please sign up the user in the app first.");
        } else {
            console.error("❌ Error assigning role:", error);
        }
    }
}

// Get args
const args = process.argv.slice(2);
const email = args[0];
const role = args[1];

if (!email || !role) {
    console.log("Usage: node scripts/assign-role.js <email> <role>");
    process.exit(1);
}

assignRole(email, role);
