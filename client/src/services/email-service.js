// Email Service - handles email notifications and communications
class EmailService {
    constructor() {
        this.apiEndpoint = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        this.isConfigured = false;
    }

    async initialize() {
        try {
            // Check if email service is available on backend
            const response = await fetch(`${this.apiEndpoint}/api/email/config`);
            this.isConfigured = response.ok;
        } catch (error) {
            console.warn('Email service not available:', error);
            this.isConfigured = false;
        }
    }

    async sendEmail(to, subject, htmlContent) {
        if (!this.isConfigured) {
            console.warn('Email service not configured, skipping email');
            return { success: false, message: 'Email service not available' };
        }

        try {
            const response = await fetch(`${this.apiEndpoint}/api/email/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    to,
                    subject,
                    htmlContent
                })
            });

            if (response.ok) {
                return { success: true, message: 'Email sent successfully' };
            } else {
                const error = await response.json();
                return { success: false, message: error.message };
            }
        } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, message: error.message };
        }
    }

    async sendBookingConfirmation(clientEmail, clientName, bookingDetails) {
        const subject = 'Booking Confirmation - Go Ham Services';
        const htmlContent = `
            <h2>Booking Confirmation</h2>
            <p>Hi ${clientName},</p>
            <p>Your booking has been confirmed!</p>
            <ul>
                <li>Service: ${bookingDetails.serviceType}</li>
                <li>Date: ${new Date(bookingDetails.date).toLocaleDateString()}</li>
                <li>Time: ${bookingDetails.time}</li>
                <li>Price: $${bookingDetails.price}</li>
            </ul>
            <p>Our team will be in touch shortly!</p>
        `;
        return this.sendEmail(clientEmail, subject, htmlContent);
    }

    async sendWorkerNotification(workerEmail, workerName, bookingDetails) {
        const subject = 'New Booking Assignment - Go Ham Services';
        const htmlContent = `
            <h2>New Booking Assignment</h2>
            <p>Hi ${workerName},</p>
            <p>You have been assigned a new booking!</p>
            <ul>
                <li>Service: ${bookingDetails.serviceType}</li>
                <li>Client: ${bookingDetails.clientName}</li>
                <li>Date: ${new Date(bookingDetails.date).toLocaleDateString()}</li>
                <li>Time: ${bookingDetails.time}</li>
                <li>Location: ${bookingDetails.location}</li>
            </ul>
            <p>Please log in to accept or decline this booking.</p>
        `;
        return this.sendEmail(workerEmail, subject, htmlContent);
    }
}

export default EmailService;