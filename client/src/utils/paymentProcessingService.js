// GO HAM PRO Payment Processing Integration
// Supports Stripe, PayPal, Square, and Apple Pay/Google Pay

import Stripe from '@stripe/stripe-react-native';
import { PayPalApi } from '@paypal/react-native-paypal-js';
import SquareReader from 'react-native-square-reader-sdk';
import { ApplePay, GooglePay, PaymentRequest } from 'react-native-payments';

class PaymentProcessingService {
    constructor() {
        this.stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
        this.paypalClientId = process.env.PAYPAL_CLIENT_ID;
        this.squareAppId = process.env.SQUARE_APPLICATION_ID;
        this.merchantIdentifier = process.env.APPLE_MERCHANT_ID;
        
        this.supportedMethods = [];
        this.isInitialized = false;
    }

    async initialize() {
        try {
            // Initialize Stripe
            await this.initializeStripe();
            
            // Initialize PayPal
            await this.initializePayPal();
            
            // Initialize Square
            await this.initializeSquare();
            
            // Check mobile payment availability
            await this.checkMobilePayments();
            
            this.isInitialized = true;
            console.log('✅ Payment processing initialized with methods:', this.supportedMethods);
            
            return {
                success: true,
                supportedMethods: this.supportedMethods
            };
        } catch (error) {
            console.error('❌ Payment initialization failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async initializeStripe() {
        try {
            await Stripe.initStripe({
                publishableKey: this.stripePublishableKey,
                merchantIdentifier: this.merchantIdentifier,
                urlScheme: 'goham-pro-payments',
                applePay: {
                    merchantCountryCode: 'US',
                    currencyCode: 'USD',
                    testEnv: process.env.NODE_ENV !== 'production'
                },
                googlePay: {
                    merchantCountryCode: 'US',
                    currencyCode: 'USD',
                    testEnv: process.env.NODE_ENV !== 'production'
                }
            });
            
            this.supportedMethods.push('stripe', 'apple_pay', 'google_pay');
            console.log('✅ Stripe initialized');
        } catch (error) {
            console.error('❌ Stripe initialization failed:', error);
        }
    }

    async initializePayPal() {
        try {
            await PayPalApi.initialize({
                clientId: this.paypalClientId,
                environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
            });
            
            this.supportedMethods.push('paypal');
            console.log('✅ PayPal initialized');
        } catch (error) {
            console.error('❌ PayPal initialization failed:', error);
        }
    }

    async initializeSquare() {
        try {
            await SquareReader.initializeReaderSDK({
                applicationId: this.squareAppId,
                locationId: process.env.SQUARE_LOCATION_ID
            });
            
            this.supportedMethods.push('square', 'square_reader');
            console.log('✅ Square initialized');
        } catch (error) {
            console.error('❌ Square initialization failed:', error);
        }
    }

    async checkMobilePayments() {
        try {
            // Check Apple Pay availability
            const applePayAvailable = await ApplePay.canMakePayments();
            if (applePayAvailable && !this.supportedMethods.includes('apple_pay')) {
                this.supportedMethods.push('apple_pay');
            }

            // Check Google Pay availability
            const googlePayAvailable = await GooglePay.isReadyToPay({
                allowedPaymentMethods: [{
                    type: 'CARD',
                    parameters: {
                        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                        allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX']
                    }
                }]
            });
            
            if (googlePayAvailable && !this.supportedMethods.includes('google_pay')) {
                this.supportedMethods.push('google_pay');
            }
        } catch (error) {
            console.error('Mobile payment check failed:', error);
        }
    }

    // Main payment processing method
    async processPayment(paymentData, method = 'stripe') {
        try {
            console.log(`💳 Processing ${method} payment:`, paymentData);

            let result;
            
            switch (method) {
                case 'stripe':
                    result = await this.processStripePayment(paymentData);
                    break;
                case 'paypal':
                    result = await this.processPayPalPayment(paymentData);
                    break;
                case 'square':
                    result = await this.processSquarePayment(paymentData);
                    break;
                case 'apple_pay':
                    result = await this.processApplePayPayment(paymentData);
                    break;
                case 'google_pay':
                    result = await this.processGooglePayPayment(paymentData);
                    break;
                case 'square_reader':
                    result = await this.processSquareReaderPayment(paymentData);
                    break;
                default:
                    throw new Error(`Unsupported payment method: ${method}`);
            }

            // Log successful payment
            await this.logPaymentTransaction({
                ...paymentData,
                method,
                result,
                timestamp: new Date().toISOString(),
                status: 'success'
            });

            return result;

        } catch (error) {
            console.error('❌ Payment processing failed:', error);
            
            // Log failed payment
            await this.logPaymentTransaction({
                ...paymentData,
                method,
                error: error.message,
                timestamp: new Date().toISOString(),
                status: 'failed'
            });

            throw error;
        }
    }

    async processStripePayment(paymentData) {
        const { amount, currency = 'usd', description, customerData, jobId } = paymentData;

        try {
            // Create payment intent on your server
            const paymentIntent = await this.createStripePaymentIntent({
                amount: Math.round(amount * 100), // Convert to cents
                currency,
                description,
                metadata: {
                    job_id: jobId,
                    customer_id: customerData.id,
                    service_type: paymentData.serviceType
                }
            });

            // Confirm payment with Stripe
            const { paymentIntent: confirmedPayment, error } = await Stripe.confirmPayment(
                paymentIntent.client_secret,
                {
                    paymentMethodType: 'Card',
                    paymentMethodData: {
                        billingDetails: {
                            email: customerData.email,
                            name: customerData.name,
                            phone: customerData.phone,
                            address: customerData.address
                        }
                    }
                }
            );

            if (error) {
                throw new Error(error.message);
            }

            return {
                success: true,
                transactionId: confirmedPayment.id,
                amount,
                currency,
                method: 'stripe',
                status: confirmedPayment.status,
                receiptUrl: confirmedPayment.charges?.data?.[0]?.receipt_url
            };

        } catch (error) {
            throw new Error(`Stripe payment failed: ${error.message}`);
        }
    }

    async processPayPalPayment(paymentData) {
        const { amount, currency = 'USD', description, jobId } = paymentData;

        try {
            const paypalPayment = await PayPalApi.requestOneTimePayment({
                intent: 'sale',
                price: amount.toString(),
                currency,
                shortDescription: description,
                userAction: 'commit',
                intent: 'sale'
            });

            if (paypalPayment.nonce) {
                // Process payment on your server
                const result = await this.processPayPalNonce({
                    nonce: paypalPayment.nonce,
                    amount,
                    jobId
                });

                return {
                    success: true,
                    transactionId: result.transactionId,
                    amount,
                    currency,
                    method: 'paypal',
                    status: 'completed',
                    paypalTransactionId: paypalPayment.payerId
                };
            }

            throw new Error('PayPal payment was not completed');

        } catch (error) {
            throw new Error(`PayPal payment failed: ${error.message}`);
        }
    }

    async processSquarePayment(paymentData) {
        const { amount, currency = 'USD', description, jobId } = paymentData;

        try {
            const cardEntry = await SquareReader.startCardEntryFlow({
                collectSignature: amount >= 25.00,
                allowSplitTender: false,
                delayCapture: false,
                tipSettings: {
                    showCustomTipField: true,
                    showSeparateTipScreen: true,
                    tipPercentages: [15, 18, 20]
                }
            });

            if (cardEntry.result) {
                // Process with Square API
                const payment = await this.processSquareCardEntry({
                    nonce: cardEntry.result.nonce,
                    amount: Math.round(amount * 100), // Convert to cents
                    currency,
                    jobId,
                    description
                });

                return {
                    success: true,
                    transactionId: payment.id,
                    amount,
                    currency,
                    method: 'square',
                    status: payment.status,
                    cardDetails: cardEntry.result.card
                };
            }

            throw new Error('Square payment was cancelled');

        } catch (error) {
            throw new Error(`Square payment failed: ${error.message}`);
        }
    }

    async processApplePayPayment(paymentData) {
        const { amount, currency = 'USD', description, customerData } = paymentData;

        try {
            const paymentRequest = {
                id: 'goham-pro-payment',
                displayItems: [{
                    label: description,
                    amount: { currency, value: amount.toString() }
                }],
                total: {
                    label: 'GO HAM PRO Services',
                    amount: { currency, value: amount.toString() }
                },
                merchantInfo: {
                    merchantName: 'GO HAM PRO Services',
                    merchantIdentifier: this.merchantIdentifier
                },
                methodData: [{
                    supportedMethods: ['apple-pay'],
                    data: {
                        version: 3,
                        merchantIdentifier: this.merchantIdentifier,
                        merchantCapabilities: ['3DS', 'debit', 'credit'],
                        supportedNetworks: ['visa', 'mastercard', 'amex'],
                        countryCode: 'US',
                        currencyCode: currency
                    }
                }],
                shippingOptions: []
            };

            const paymentResponse = await new PaymentRequest(
                paymentRequest.methodData,
                paymentRequest
            ).show();

            if (paymentResponse) {
                // Process Apple Pay token with Stripe
                const { paymentIntent, error } = await Stripe.confirmApplePayPayment(
                    paymentResponse.details.paymentToken
                );

                if (error) {
                    throw new Error(error.message);
                }

                await paymentResponse.complete('success');

                return {
                    success: true,
                    transactionId: paymentIntent.id,
                    amount,
                    currency,
                    method: 'apple_pay',
                    status: paymentIntent.status
                };
            }

            throw new Error('Apple Pay payment was cancelled');

        } catch (error) {
            throw new Error(`Apple Pay failed: ${error.message}`);
        }
    }

    async processGooglePayPayment(paymentData) {
        const { amount, currency = 'USD', description } = paymentData;

        try {
            const paymentDataRequest = {
                allowedPaymentMethods: [{
                    type: 'CARD',
                    parameters: {
                        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                        allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX']
                    },
                    tokenizationSpecification: {
                        type: 'PAYMENT_GATEWAY',
                        parameters: {
                            gateway: 'stripe',
                            gatewayMerchantId: process.env.STRIPE_MERCHANT_ID
                        }
                    }
                }],
                transactionInfo: {
                    totalPrice: amount.toString(),
                    totalPriceStatus: 'FINAL',
                    currencyCode: currency
                },
                merchantInfo: {
                    merchantName: 'GO HAM PRO Services'
                }
            };

            const paymentData = await GooglePay.requestPayment(paymentDataRequest);

            if (paymentData) {
                // Process Google Pay token with Stripe
                const { paymentIntent, error } = await Stripe.confirmGooglePayPayment(
                    paymentData.paymentMethodData.tokenizationData.token
                );

                if (error) {
                    throw new Error(error.message);
                }

                return {
                    success: true,
                    transactionId: paymentIntent.id,
                    amount,
                    currency,
                    method: 'google_pay',
                    status: paymentIntent.status
                };
            }

            throw new Error('Google Pay payment was cancelled');

        } catch (error) {
            throw new Error(`Google Pay failed: ${error.message}`);
        }
    }

    async processSquareReaderPayment(paymentData) {
        const { amount, description, tipAmount = 0 } = paymentData;

        try {
            // Start Square Reader checkout
            const checkoutParams = {
                amountMoney: {
                    amount: Math.round(amount * 100), // Convert to cents
                    currency: 'USD'
                },
                tipMoney: tipAmount ? {
                    amount: Math.round(tipAmount * 100),
                    currency: 'USD'
                } : null,
                note: description,
                skipReceipt: false,
                collectSignature: amount >= 25.00
            };

            const checkoutResult = await SquareReader.startCheckout(checkoutParams);

            if (checkoutResult.result) {
                const checkout = checkoutResult.result;
                
                return {
                    success: true,
                    transactionId: checkout.transactionId,
                    amount: checkout.totalMoney.amount / 100,
                    tip: checkout.tipMoney ? checkout.tipMoney.amount / 100 : 0,
                    currency: 'USD',
                    method: 'square_reader',
                    status: 'completed',
                    receiptUrl: checkout.receiptUrl
                };
            }

            throw new Error('Square Reader payment was cancelled');

        } catch (error) {
            throw new Error(`Square Reader payment failed: ${error.message}`);
        }
    }

    // Invoice and recurring payment support
    async createInvoice(invoiceData) {
        const { customerId, jobId, lineItems, dueDate, description } = invoiceData;

        try {
            // Create Stripe invoice
            const invoice = await this.createStripeInvoice({
                customer: customerId,
                description,
                metadata: {
                    job_id: jobId,
                    created_by: 'goham_pro_mobile'
                },
                due_date: Math.floor(new Date(dueDate).getTime() / 1000),
                collection_method: 'send_invoice',
                days_until_due: 30
            });

            // Add line items
            for (const item of lineItems) {
                await this.addInvoiceLineItem(invoice.id, item);
            }

            // Finalize and send invoice
            const finalizedInvoice = await this.finalizeStripeInvoice(invoice.id);
            await this.sendStripeInvoice(finalizedInvoice.id);

            return {
                success: true,
                invoiceId: finalizedInvoice.id,
                invoiceUrl: finalizedInvoice.hosted_invoice_url,
                invoicePdf: finalizedInvoice.invoice_pdf,
                status: finalizedInvoice.status
            };

        } catch (error) {
            throw new Error(`Invoice creation failed: ${error.message}`);
        }
    }

    async setupRecurringPayment(subscriptionData) {
        const { customerId, planId, trialDays = 0, metadata } = subscriptionData;

        try {
            const subscription = await this.createStripeSubscription({
                customer: customerId,
                items: [{ plan: planId }],
                trial_period_days: trialDays,
                metadata: {
                    ...metadata,
                    created_by: 'goham_pro_mobile'
                }
            });

            return {
                success: true,
                subscriptionId: subscription.id,
                status: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                nextPaymentDate: new Date(subscription.current_period_end * 1000)
            };

        } catch (error) {
            throw new Error(`Subscription setup failed: ${error.message}`);
        }
    }

    // Payment analytics and reporting
    async getPaymentAnalytics(timeRange = 30) {
        try {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - timeRange * 24 * 60 * 60 * 1000);

            const analytics = await fetch('/api/payments/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startDate, endDate })
            });

            const data = await analytics.json();

            return {
                totalRevenue: data.totalRevenue,
                transactionCount: data.transactionCount,
                averageTransaction: data.averageTransaction,
                paymentMethodBreakdown: data.methodBreakdown,
                topServices: data.topServices,
                refundRate: data.refundRate,
                chargebackRate: data.chargebackRate,
                trends: data.trends
            };

        } catch (error) {
            console.error('Failed to get payment analytics:', error);
            return null;
        }
    }

    // Refund and dispute handling
    async processRefund(refundData) {
        const { transactionId, amount, reason, method } = refundData;

        try {
            let refund;
            
            switch (method) {
                case 'stripe':
                    refund = await this.processStripeRefund(transactionId, amount, reason);
                    break;
                case 'paypal':
                    refund = await this.processPayPalRefund(transactionId, amount, reason);
                    break;
                case 'square':
                    refund = await this.processSquareRefund(transactionId, amount, reason);
                    break;
                default:
                    throw new Error(`Refunds not supported for method: ${method}`);
            }

            await this.logPaymentTransaction({
                originalTransactionId: transactionId,
                refundId: refund.id,
                amount: -amount,
                type: 'refund',
                reason,
                timestamp: new Date().toISOString(),
                status: 'success'
            });

            return {
                success: true,
                refundId: refund.id,
                amount: refund.amount,
                status: refund.status
            };

        } catch (error) {
            throw new Error(`Refund failed: ${error.message}`);
        }
    }

    // Server communication methods (implement these on your backend)
    async createStripePaymentIntent(params) {
        const response = await fetch('/api/payments/stripe/create-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        return response.json();
    }

    async processPayPalNonce(params) {
        const response = await fetch('/api/payments/paypal/process-nonce', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        return response.json();
    }

    async processSquareCardEntry(params) {
        const response = await fetch('/api/payments/square/process-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        return response.json();
    }

    async logPaymentTransaction(transaction) {
        try {
            await fetch('/api/payments/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transaction)
            });
        } catch (error) {
            console.error('Failed to log payment transaction:', error);
        }
    }
}

export default PaymentProcessingService;