const admin = require('firebase-admin');
const serviceAccount = require('./data/serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addIp(ip) {
    if (!ip) {
        console.error('❌ Please provide an IP address.');
        console.log('Usage: node scripts/allow-ip.js <IP_ADDRESS>');
        process.exit(1);
    }

    const docRef = db.collection('system_settings').doc('access_control');

    try {
        const doc = await docRef.get();
        let currentIps = [];

        if (doc.exists) {
            currentIps = doc.data().allowed_ips || [];
        }

        if (currentIps.includes(ip)) {
            console.log(`⚠️ IP ${ip} is already allowed.`);
            process.exit(0);
        }

        currentIps.push(ip);

        await docRef.set({
            allowed_ips: currentIps,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`✅ Automatically added ${ip} to access_control whitelist.`);
        console.log(`Current allowed IPs: [${currentIps.join(', ')}]`);

    } catch (error) {
        console.error('❌ Error updating whitelist:', error);
    }
}

// Get IP from command line args
const ipToAdd = process.argv[2];
addIp(ipToAdd);
