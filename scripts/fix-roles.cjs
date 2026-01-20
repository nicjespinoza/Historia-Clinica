const appPath = '../functions/node_modules/firebase-admin';
let admin;
try {
    admin = require('firebase-admin');
} catch (e) {
    admin = require(appPath);
}
const serviceAccount = require('./data/serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("✅ Firebase Admin initialized successfully");
    } catch (error) {
        console.error("❌ Failed to initialize Firebase Admin:", error.message);
        process.exit(1);
    }
}

const db = admin.firestore();
const auth = admin.auth();

async function listUsers() {
    try {
        const listUsersResult = await auth.listUsers(10);
        console.log("\n--- Registered Users ---");
        listUsersResult.users.forEach((userRecord) => {
            console.log(`- ${userRecord.email} (UID: ${userRecord.uid})`);
        });
        console.log("------------------------\n");
        return listUsersResult.users;
    } catch (error) {
        console.log('Error listing users:', error);
        return [];
    }
}

async function setDoctorRole(email) {
    try {
        const user = await auth.getUserByEmail(email);
        const uid = user.uid;

        console.log(`Targeting user: ${email} (${uid})`);

        // 1. Set Custom Claims (Wait 5 min to propagate or force refresh token)
        await auth.setCustomUserClaims(uid, { role: 'doctor' });
        console.log("✅ Custom claims set to { role: 'doctor' }");

        // 2. Create/Update User Document in Firestore (Immediate effect for rules using exists())
        const userRef = db.collection('users').doc(uid);
        await userRef.set({
            email: email,
            name: user.displayName || email.split('@')[0],
            role: 'doctor',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log("✅ Firestore document set/updated with role: 'doctor'");
        console.log("\n🎉 SUCCESS! Please refresh your browser app.");

    } catch (error) {
        console.error("❌ Error setting role:", error.message);
    }
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log("Usage: node fix-roles.cjs <email>");
        console.log("Listing available users to help you choose:\n");
        await listUsers();
    } else {
        const email = args[0];
        await setDoctorRole(email);
    }
}

main();
