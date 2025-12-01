// SMS Service - handles SMS notifications and communications
class SMSService {
    constructor() {
        this.apiEndpoint = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        this.isConfigured = false;
    }

    async initialize() {
        try {
            // Check if SMS service is available on backend
            const response = await fetch(`${this.apiEndpoint}/api/sms/config`);
            this.isConfigured = response.ok;
        } catch (error) {
            console.warn('SMS service not available:', error);
            this.isConfigured = false;
        }
    }

    async sendSMS(phoneNumber, message) {
        if (!this.isConfigured) {
            console.warn('SMS service not configured, skipping SMS');
            return { success: false, message: 'SMS service not available' };
        }

        try {
            const response = await fetch(`${this.apiEndpoint}/api/sms/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    phoneNumber,
                    message
                })
            });

            if (response.ok) {
                return { success: true, message: 'SMS sent successfully' };
            } else {
                const error = await response.json();
                return { success: false, message: error.message };
            }
        } catch (error) {
            console.error('Error sending SMS:', error);
            return { success: false, message: error.message };
        }
    }

    async sendBookingConfirmationSMS(phoneNumber, clientName, bookingDetails) {
        const message = `Hi ${clientName}, your booking for ${bookingDetails.serviceType} on ${new Date(bookingDetails.date).toLocaleDateString()} at ${bookingDetails.time} is confirmed. Price: $${bookingDetails.price}. Go Ham Services.`;
        return this.sendSMS(phoneNumber, message);
    }

    async sendWorkerNotificationSMS(phoneNumber, workerName, bookingDetails) {
        const message = `Hi ${workerName}, you have a new booking: ${bookingDetails.serviceType} for ${bookingDetails.clientName} on ${new Date(bookingDetails.date).toLocaleDateString()} at ${bookingDetails.time}. Please log in to accept.`;
        return this.sendSMS(phoneNumber, message);
    }

    async sendReminderSMS(phoneNumber, clientName, bookingDetails) {
        const message = `Hi ${clientName}, reminder: your ${bookingDetails.serviceType} booking is on ${new Date(bookingDetails.date).toLocaleDateString()} at ${bookingDetails.time}. Go Ham Services.`;
        return this.sendSMS(phoneNumber, message);
    }
}

export default SMSService;