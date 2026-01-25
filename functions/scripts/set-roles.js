const admin = require('firebase-admin');

// Initialize Firebase Admin
// This requires GOOGLE_APPLICATION_CREDENTIALS to be set or
// running in an environment with default credentials (e.g. valid 'gcloud auth application-default login')
// OR running against the emulator.

try {
    admin.initializeApp();
    console.log("Firebase Admin Initialized");
} catch (e) {
    console.error("Error initializing Firebase Admin:", e);
    process.exit(1);
}

const setRole = async (email, role) => {
    try {
        const user = await admin.auth().getUserByEmail(email);
        // Add role to existing claims (preserving others if any)
        const currentClaims = user.customClaims || {};
        const newClaims = { ...currentClaims, role };

        await admin.auth().setCustomUserClaims(user.uid, newClaims);
        console.log(`✅ Success: User ${email} (UID: ${user.uid}) now has role '${role}'`);

        // Optional: Verify
        const updatedUser = await admin.auth().getUser(user.uid);
        console.log(`   Current Claims:`, updatedUser.customClaims);

    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            console.error(`❌ Error: User ${email} NOT FOUND. Please create this user first.`);
        } else {
            console.error(`❌ Error setting role for ${email}:`, error.message);
        }
    }
};

const run = async () => {
    console.log("Setting up Roles...");

    // 1. Doctor
    await setRole('dr@cenlae.com', 'doctor');

    // 2. Assistant
    await setRole('asistente@cenlae.com', 'assistant');

    // 3. Admin (if needed)
    // await setRole('admin@webdesignje.com', 'admin');

    console.log("Done. Please refresh your frontend session (logout/login) to update the ID Token.");
    process.exit();
};

run();
