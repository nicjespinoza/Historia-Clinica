"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSystemAccess = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
// Verify admin is initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
/**
 * Callable Cloud Function to check if the client's IP is allowed.
 * It reads the whitelist from Firestore: system_settings/access_control
 * Field: allowed_ips (array of strings)
 */
exports.checkSystemAccess = (0, https_1.onCall)(async (request) => {
    // 1. Get Client IP
    // In Firebase Functions v2, the raw Express request is available in request.rawRequest
    const req = request.rawRequest;
    // Get IP from headers (x-forwarded-for is standard for load balancers) or connection
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    // x-forwarded-for can be a list "client, proxy1, proxy2"
    let clientIp = (Array.isArray(rawIp) ? rawIp[0] : rawIp === null || rawIp === void 0 ? void 0 : rawIp.toString().split(',')[0]) || 'unknown';
    // Normalize IP (remove IPv6 prefix if present)
    clientIp = clientIp.trim();
    if (clientIp.startsWith('::ffff:')) {
        clientIp = clientIp.substring(7);
    }
    console.log(`[AccessControl] Checking access for IP: ${clientIp}`);
    try {
        // 2. Fetch Whitelist from Firestore
        const docRef = admin.firestore().collection('system_settings').doc('access_control');
        const doc = await docRef.get();
        if (!doc.exists) {
            console.warn(`[AccessControl] No configuration found at system_settings/access_control. Allowing ${clientIp}`);
            return {
                allowed: true,
                ip: clientIp,
                warning: 'System not configured. access_control document missing.'
            };
        }
        const data = doc.data();
        const allowedIps = (data === null || data === void 0 ? void 0 : data.allowed_ips) || [];
        // 3. Validate
        if (allowedIps.includes(clientIp)) {
            console.log(`[AccessControl] Access GRANTED for ${clientIp}`);
            return { allowed: true, ip: clientIp };
        }
        else {
            console.warn(`[AccessControl] Access DENIED for ${clientIp}`);
            return {
                allowed: false,
                ip: clientIp,
                error: 'Ubicación no autorizada. Contacte al administrador.'
            };
        }
    }
    catch (error) {
        console.error('[AccessControl] Error verifying access:', error);
        throw new https_1.HttpsError('internal', 'Error verificando permisos de acceso.');
    }
});
//# sourceMappingURL=accessControl.js.map