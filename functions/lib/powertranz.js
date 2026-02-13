"use strict";
/**
 * PowerTranz Payment Processing Module
 * 3DS Simplified API Integration for Latin America/Caribbean
 *
 * Staging URL: https://staging.ptranz.com
 * Production URL: https://gateway.ptranz.com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.powertranzCallback = exports.verifyPowerTranzPayment = exports.processPowerTranzPayment = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
// Define secrets for PowerTranz credentials
const powertranzId = (0, params_1.defineSecret)("POWERTRANZ_ID");
const powertranzPassword = (0, params_1.defineSecret)("POWERTRANZ_PASSWORD");
// ============================================================
// POWERTRANZ API CONFIGURATION
// ============================================================
const POWERTRANZ_CONFIG = {
    staging: {
        baseUrl: "https://staging.ptranz.com",
        saleEndpoint: "/api/spi/sale",
        authEndpoint: "/api/spi/auth",
        captureEndpoint: "/api/spi/capture",
    },
    production: {
        baseUrl: "https://gateway.ptranz.com",
        saleEndpoint: "/api/spi/sale",
        authEndpoint: "/api/spi/auth",
        captureEndpoint: "/api/spi/capture",
    }
};
// Use staging for now (change to production when ready)
const API_CONFIG = POWERTRANZ_CONFIG.staging; // TODO: Switch to production via environment variable
// ============================================================
// VALIDATION HELPERS
// ============================================================
function isValidCardDetails(card) {
    if (!card || typeof card !== 'object')
        return false;
    // Basic format checks (length, type)
    const panValid = typeof card.pan === 'string' && /^\d{13,19}$/.test(card.pan.replace(/\s/g, ''));
    const cvvValid = typeof card.cvv === 'string' && /^\d{3,4}$/.test(card.cvv);
    const expMonthValid = typeof card.expMonth === 'string' && /^(0[1-9]|1[0-2])$/.test(card.expMonth);
    const expYearValid = typeof card.expYear === 'string' && /^\d{2}(\d{2})?$/.test(card.expYear);
    const holderValid = typeof card.cardHolder === 'string' && card.cardHolder.length > 2;
    return panValid && cvvValid && expMonthValid && expYearValid && holderValid;
}
function maskPan(pan) {
    return pan.slice(0, 6) + "******" + pan.slice(-4);
}
// ============================================================
// MAIN CLOUD FUNCTION: processPowerTranzPayment
// ============================================================
exports.processPowerTranzPayment = (0, https_1.onCall)({
    secrets: [powertranzId, powertranzPassword],
    cors: true,
}, async (request) => {
    var _a, _b;
    // 1. Authentication Check
    if (!request.auth) {
        logger.warn("Unauthenticated payment attempt");
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión para realizar un pago.");
    }
    const data = request.data;
    const { amount, currencyCode, orderId, cardDetails, appointmentId, patientId, customerEmail, customerIp, userAgent } = data;
    // 2. Strict Input Validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new https_1.HttpsError("invalid-argument", "El monto debe ser un número mayor a 0.");
    }
    if (!orderId || typeof orderId !== 'string' || orderId.length < 5) {
        throw new https_1.HttpsError("invalid-argument", "Identificador de orden inválido.");
    }
    if (!isValidCardDetails(cardDetails)) {
        logger.warn(`Invalid card details provided by user ${request.auth.uid}`);
        throw new https_1.HttpsError("invalid-argument", "Datos de tarjeta incompletos o inválidos.");
    }
    // Email validation (basic)
    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
        throw new https_1.HttpsError("invalid-argument", "Email de cliente inválido.");
    }
    // 3. Credential Check
    const ptrzId = powertranzId.value();
    const ptrzPassword = powertranzPassword.value();
    if (!ptrzId || !ptrzPassword) {
        logger.error("PowerTranz credentials missing");
        throw new https_1.HttpsError("failed-precondition", "Error en configuración de pagos. Contacte al soporte.");
    }
    // Format expiry date as YYMM (PowerTranz format)
    // Ensure year is 2 digits
    const expYearTwoDigits = cardDetails.expYear.length === 4 ? cardDetails.expYear.slice(-2) : cardDetails.expYear;
    const expiryDate = `${expYearTwoDigits}${cardDetails.expMonth.padStart(2, '0')}`;
    // 4. Construct Payload
    const payload = {
        TransactionIdentifier: orderId,
        TotalAmount: amount, // Must be string or number depending on API, usually number is fine for JSON
        CurrencyCode: currencyCode || "558", // Default to NIO
        ThreeDSecure: true,
        Source: {
            CardPan: cardDetails.pan.replace(/\s/g, ''),
            CardCvv: cardDetails.cvv,
            CardExpiration: expiryDate,
            CardholderName: cardDetails.cardHolder || "CARDHOLDER",
        },
        OrderIdentifier: orderId,
        ExtendedData: {
            ThreeDSecure: {
                ChallengeWindowSize: "02", // 400x600
            },
            MerchantResponseUrl: `https://historia-clinica-2026.web.app/app/payment/callback?orderId=${orderId}`,
        },
        BillingAddress: {
            FirstName: ((_a = cardDetails.cardHolder) === null || _a === void 0 ? void 0 : _a.split(' ')[0]) || "Customer",
            LastName: ((_b = cardDetails.cardHolder) === null || _b === void 0 ? void 0 : _b.split(' ').slice(1).join(' ')) || "Name",
            Line1: "Address Line 1",
            City: "Managua",
            State: "MN",
            PostalCode: "00000",
            CountryCode: "558", // Nicaragua
            EmailAddress: customerEmail || "customer@example.com",
            PhoneNumber: "50588888888",
        },
        RiskManagement: {
            TransactionSource: "INTERNET",
            BrowserUserAgentString: userAgent || "Mozilla/5.0 MediRecord Pro Payment",
            IPAddress: customerIp || "0.0.0.0",
        },
        AddressMatch: false,
    };
    // Secure Login
    logger.info("Initiating PowerTranz Payment", {
        orderId,
        amount,
        currencyCode,
        userId: request.auth.uid,
        cardHolder: cardDetails.cardHolder, // Safe to log name
        maskedPan: maskPan(cardDetails.pan)
    });
    try {
        const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.saleEndpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "PowerTranz-PowerTranzId": ptrzId,
                "PowerTranz-PowerTranzPassword": ptrzPassword,
            },
            body: JSON.stringify(payload),
        });
        const responseData = await response.json();
        logger.info("PowerTranz Response Received", {
            status: response.status,
            approved: responseData.Approved,
            orderId,
            responseMessage: responseData.ResponseMessage,
            hasRedirect: !!responseData.RedirectUrl
        });
        // If transaction needs 3DS, save pending status
        if (responseData.RedirectUrl && responseData.SpiToken) {
            const batch = admin.firestore().batch();
            if (appointmentId) {
                const aptRef = admin.firestore().collection("appointments").doc(appointmentId);
                batch.update(aptRef, {
                    paymentStatus: "pending_3ds",
                    paymentTransactionId: orderId,
                    paymentGateway: "powertranz",
                    paymentSpiToken: responseData.SpiToken,
                    paymentUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
            const paymentRef = admin.firestore().collection("payments").doc(orderId);
            batch.set(paymentRef, {
                orderId,
                appointmentId,
                patientId,
                userId: request.auth.uid,
                amount,
                currencyCode,
                status: "pending_3ds",
                gateway: "powertranz",
                spiToken: responseData.SpiToken,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            await batch.commit();
        }
        // If approved directly
        if (responseData.Approved && appointmentId) {
            await admin.firestore().collection("appointments").doc(appointmentId).update({
                paid: true,
                paymentStatus: "paid",
                paymentTransactionId: responseData.TransactionIdentifier,
                paymentAuthCode: responseData.AuthorizationCode,
                paymentGateway: "powertranz",
                paidAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        return responseData;
    }
    catch (error) {
        logger.error("PowerTranz API Execution Error", {
            error: error.message,
            orderId,
            userId: request.auth.uid
        });
        throw new https_1.HttpsError("internal", "Error procesando el pago. Por favor intente nuevamente.");
    }
});
// ============================================================
// VERIFY 3DS CALLBACK
// ============================================================
exports.verifyPowerTranzPayment = (0, https_1.onCall)({ secrets: [powertranzId, powertranzPassword] }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Usuario no autenticado.");
    }
    const { orderId } = request.data;
    if (!orderId || typeof orderId !== 'string') {
        throw new https_1.HttpsError("invalid-argument", "Identificador de orden requerido.");
    }
    try {
        // Get the payment record
        const paymentDoc = await admin.firestore().collection("payments").doc(orderId).get();
        if (!paymentDoc.exists) {
            logger.warn(`Payment not found for verification: ${orderId}`);
            throw new https_1.HttpsError("not-found", "Pago no encontrado.");
        }
        const paymentData = paymentDoc.data();
        if ((paymentData === null || paymentData === void 0 ? void 0 : paymentData.userId) !== request.auth.uid && !request.auth.token.admin) {
            logger.warn(`Unauthorized payment verification attempt by ${request.auth.uid} for order ${orderId}`);
            throw new https_1.HttpsError("permission-denied", "No tiene permiso para verificar este pago.");
        }
        if ((paymentData === null || paymentData === void 0 ? void 0 : paymentData.status) === "paid" || (paymentData === null || paymentData === void 0 ? void 0 : paymentData.status) === "approved") {
            return {
                success: true,
                message: "Pago verificado exitosamente",
                transactionId: paymentData.transactionId,
            };
        }
        return {
            success: false,
            message: "El pago no ha sido confirmado aún",
        };
    }
    catch (error) {
        logger.error("Verify Payment Error", { error: error.message, orderId });
        throw new https_1.HttpsError("internal", "Error verificando estado del pago.");
    }
});
// ============================================================
// WEBHOOK FOR 3DS CALLBACK (HTTP Trigger)
// ============================================================
const https_2 = require("firebase-functions/v2/https");
exports.powertranzCallback = (0, https_2.onRequest)({ cors: true }, async (req, res) => {
    // Secure logging of receipt (mask sensitive data if present in body) 
    logger.info("PowerTranz Webhook Received", {
        method: req.method,
        query: req.query,
        // Be careful verifying body content before logging
        hasBody: !!req.body
    });
    const { TransactionIdentifier, Approved, AuthorizationCode, ResponseMessage, IsoResponseCode, } = req.body;
    const orderId = req.query.orderId || TransactionIdentifier;
    try {
        if (orderId && typeof orderId === 'string') {
            const paymentRef = admin.firestore().collection("payments").doc(orderId);
            const paymentDoc = await paymentRef.get();
            if (paymentDoc.exists) {
                const paymentData = paymentDoc.data();
                const appointmentId = paymentData === null || paymentData === void 0 ? void 0 : paymentData.appointmentId;
                // Strict check
                const isApproved = String(Approved) === "true" || Approved === true;
                const newStatus = isApproved ? "paid" : "failed";
                const batch = admin.firestore().batch();
                // Update payment record
                batch.update(paymentRef, {
                    status: newStatus,
                    approved: isApproved,
                    authorizationCode: AuthorizationCode || null,
                    responseMessage: ResponseMessage || null,
                    isoResponseCode: IsoResponseCode || null,
                    completedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                // Update appointment if exists
                if (appointmentId && isApproved) {
                    const apptRef = admin.firestore().collection("appointments").doc(appointmentId);
                    batch.update(apptRef, {
                        paid: true,
                        paymentStatus: "paid",
                        paymentTransactionId: TransactionIdentifier,
                        paymentAuthCode: AuthorizationCode,
                        paidAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
                await batch.commit();
                logger.info(`Payment ${orderId} processed via webhook. Status: ${newStatus}`);
            }
            else {
                logger.warn(`Webhook received for unknown order: ${orderId}`);
            }
        }
        // Redirect user based on status
        const redirectStatus = (String(Approved) === "true" || Approved === true) ? "success" : "failed";
        const message = ResponseMessage ? encodeURIComponent(ResponseMessage) : "Transaction processed";
        const redirectUrl = `https://historia-clinica-2026.web.app/app/payment/callback?status=${redirectStatus}&orderId=${orderId}&message=${message}`;
        res.redirect(302, redirectUrl);
    }
    catch (error) {
        logger.error("Webhook Processing Error", { error: error.message });
        res.redirect(302, `https://historia-clinica-2026.web.app/app/payment/callback?status=error&message=SystemError`);
    }
});
//# sourceMappingURL=powertranz.js.map