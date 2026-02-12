/**
 * TiloPay Server-to-Server (S2S) Payment Integration
 * Direct API processing via Cloud Functions
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import * as logger from "firebase-functions/logger";

// Secrets
const tilopayApiKey = defineSecret("TILOPAY_API_KEY");
const tilopayApiUser = defineSecret("TILOPAY_API_USER");
const tilopayApiPassword = defineSecret("TILOPAY_API_PASSWORD");
const tilopayEnv = defineString("TILOPAY_ENV", { default: "production" });

// Environment variables
const baseUrl = defineString("BASE_URL", { default: "https://historia-clinica-2026.web.app" });

// Types
interface TiloPayRequest {
    amount: number;
    currency: string;
    orderId: string;
    cardDetails: {
        pan: string;
        cvv: string;
        expMonth: string;
        expYear: string;
    };
    clientDetails: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        address?: string;
        city?: string;
        country?: string;
    };
    appointmentId?: string;
    patientId?: string;
}

interface TiloPayResponse {
    success: boolean;
    transactionId?: string;
    requiresAction?: boolean; // For 3DS
    redirectUrl?: string;     // For 3DS
    error?: boolean;
    message?: string;
    raw?: any;
}

// Helper to mask PAN
function maskPan(pan: string): string {
    return pan.slice(0, 6) + "******" + pan.slice(-4);
}

/**
 * Process payment directly with TiloPay using S2S
 */
export const processTiloPayPayment = onCall(
    {
        secrets: [tilopayApiKey, tilopayApiUser, tilopayApiPassword],
        cors: true
    },
    async (request): Promise<TiloPayResponse> => {
        // 1. Authentication Check
        if (!request.auth) {
            logger.warn("Unauthenticated TiloPay attempt");
            throw new HttpsError("unauthenticated", "User must be logged in");
        }

        const data = request.data as TiloPayRequest;
        const { amount, currency, orderId, cardDetails, clientDetails } = data;

        // 2. Strict Input Validation
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            throw new HttpsError("invalid-argument", "Invalid amount");
        }
        if (!currency || !/^[A-Z]{3}$/.test(currency)) {
            throw new HttpsError("invalid-argument", "Invalid currency currency code (3 letters required)");
        }
        if (!orderId || typeof orderId !== 'string') {
            throw new HttpsError("invalid-argument", "Invalid orderId");
        }

        // Card validation
        if (!cardDetails || typeof cardDetails !== 'object') {
            throw new HttpsError("invalid-argument", "Missing card details");
        }
        const pan = (cardDetails.pan || "").replace(/\s/g, "");
        if (!/^\d{13,19}$/.test(pan)) {
            throw new HttpsError("invalid-argument", "Invalid card number");
        }
        if (!/^\d{3,4}$/.test(cardDetails.cvv)) {
            throw new HttpsError("invalid-argument", "Invalid CVV");
        }

        // Client validation (basic)
        if (!clientDetails || !clientDetails.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientDetails.email)) {
            throw new HttpsError("invalid-argument", "Invalid client email");
        }

        const apiKey = tilopayApiKey.value();
        const apiUser = tilopayApiUser.value();
        const apiPassword = tilopayApiPassword.value();
        const environment = tilopayEnv.value();

        if (!apiKey || !apiUser || !apiPassword) {
            logger.error("TiloPay credentials missing");
            throw new HttpsError("failed-precondition", "Payment provider not configured");
        }

        // Format Date
        const expYear = cardDetails.expYear.length === 4 ? cardDetails.expYear.slice(-2) : cardDetails.expYear;
        const expMonth = cardDetails.expMonth.padStart(2, '0');

        // 4. Generate Hash
        // Formula: SHA256(KEY + ORDER + AMOUNT)
        const hashString = `${apiKey}${orderId}${amount}`;
        const hash = crypto.createHash('sha256').update(hashString).digest('hex');

        // 5. Construct Payload
        const payload = {
            key: apiKey,
            hash: hash,
            amount: amount,
            currency: currency,
            order_id: orderId,
            description: `Pago Consulta - Orden ${orderId}`,
            capture: true, // Auto-capture
            card: {
                number: pan,
                cvv: cardDetails.cvv,
                expire_month: expMonth,
                expire_year: expYear
            },
            bill_to: {
                first_name: clientDetails.firstName,
                last_name: clientDetails.lastName,
                email: clientDetails.email,
                address_1: clientDetails.address || "Managua",
                city: clientDetails.city || "Managua",
                country: clientDetails.country || "NI",
                phone: clientDetails.phone || "88888888"
            },
            // Return URL for 3DS - use environment variable
            return_url: `${baseUrl.value()}/app/payment/callback?orderId=${orderId}`
        };

        // 6. Send Request
        const tilopayApiUrl = environment === 'production'
            ? 'https://app.tilopay.com/api/v1/process'
            : 'https://sandbox.tilopay.com/api/v1/process';

        logger.info("Initiating TiloPay Request", {
            orderId,
            amount,
            currency,
            environment,
            userId: request.auth.uid,
            cardLast4: pan.slice(-4)
        });

        try {
            const authHeader = "Basic " + Buffer.from(`${apiUser}:${apiPassword}`).toString("base64");

            const response = await fetch(tilopayApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            logger.info("TiloPay Response", {
                orderId,
                status: result.status,
                responseCode: result.response_code,
                hasRedirect: !!result.redirect_url
            });

            // 7. Handle Response

            // Case A: Success (Direct)
            if (result.status === 'success' || result.response_code === '100') {
                if (data.appointmentId) {
                    // Idempotency Check
                    const appointmentRef = admin.firestore().collection('appointments').doc(data.appointmentId);

                    await admin.firestore().runTransaction(async (transaction) => {
                        const appointmentDoc = await transaction.get(appointmentRef);
                        if (appointmentDoc.exists && appointmentDoc.data()?.paymentStatus === 'paid') {
                            logger.info("Payment idempotency check: already paid");
                        } else {
                            transaction.update(appointmentRef, {
                                paid: true,
                                paymentStatus: 'paid',
                                paymentGateway: 'tilopay',
                                paymentTransactionId: result.transaction_id || orderId,
                                paidAt: admin.firestore.FieldValue.serverTimestamp()
                            });
                        }
                    });
                }

                return {
                    success: true,
                    transactionId: result.transaction_id,
                    message: "Pago aprobado exitosamente"
                };
            }

            // Case B: 3D Secure Redirect Required
            if (result.redirect_url || result.status === 'redirect') {
                return {
                    success: false,
                    requiresAction: true,
                    redirectUrl: result.redirect_url,
                    message: "Redirección bancaria requerida"
                };
            }

            // Case C: Error/Declined
            logger.warn("TiloPay Declined", {
                orderId,
                error: result.error_message || result.message
            });

            return {
                success: false,
                error: true,
                message: result.error_message || result.message || "La transacción fue declinada por el banco."
            };

        } catch (error: any) {
            logger.error('TiloPay Internal Error', { error: error.message, orderId });
            throw new HttpsError('internal', "Error procesando el pago con TiloPay");
        }
    }
);
