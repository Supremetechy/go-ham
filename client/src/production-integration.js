// production-integrations.js - Fixed version without process.env

class ProductionEmailService {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        console.log('Email service initialized (client-side mode)');
        this.initialized = true;
        return true;
    }

    async sendEmail(options) {
        const { to, subject, html, from = 'noreply@go-ham.com' } = options;
        
        console.log('Email would be sent:', { to, subject, from });
        
        // In production, this should call your backend API
        // For now, we'll simulate the email
        return {
            success: true,
            messageId: `email-${Date.now()}`,
            timestamp: new Date().toISOString(),
            recipient: to,
            subject: subject
        };
    }

    async sendBookingConfirmation(bookingData) {
        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                    .detail { margin: 15px 0; padding: 15px; background: white; border-left: 4px solid #667eea; border-radius: 5px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                    .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Booking Confirmed!</h1>
                        <p>GO HAM PRO Services</p>
                    </div>
                    <div class="content">
                        <p>Dear ${bookingData.name},</p>
                        <p>Thank you for choosing GO HAM PRO Services! Your booking has been confirmed.</p>
                        
                        <div class="detail">
                            <strong>📋 Booking Details</strong><br>
                            <strong>Booking ID:</strong> #${bookingData.id}<br>
                            <strong>Service:</strong> ${bookingData.serviceType}<br>
                            <strong>Date:</strong> ${bookingData.date}<br>
                            <strong>Time:</strong> ${bookingData.time}<br>
                            <strong>Address:</strong> ${bookingData.address}
                        </div>
                        
                        ${bookingData.instructions ? `
                        <div class="detail">
                            <strong>📝 Special Instructions:</strong><br>
                            ${bookingData.instructions}
                        </div>
                        ` : ''}
                        
                        <div class="detail">
                            <strong>📞 Contact Information</strong><br>
                            Phone: (720) 813-8057<br>
                            Email: dwayne@go-ham.com
                        </div>
                        
                        <p><strong>What's Next?</strong></p>
                        <ul>
                            <li>A worker will contact you within 15 minutes</li>
                            <li>We'll send a reminder 24 hours before your service</li>
                            <li>Payment will be collected after service completion</li>
                        </ul>
                        
                        <center>
                            <a href="tel:+17208138057" class="button">📞 Call Us</a>
                        </center>
                    </div>
                    <div class="footer">
                        <p>GO HAM PRO Services<br>
                        24241 E Mexico Ave, Aurora, CO 80018<br>
                        © 2025 All Rights Reserved</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail({
            to: bookingData.email,
            subject: `Booking Confirmed - ${bookingData.serviceType} on ${bookingData.date}`,
            html: emailHtml
        });
    }

    async sendWorkerAlert(bookingData, workerId) {
        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .alert-header { background: #ff6b6b; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
                    .content { background: #fff; padding: 20px; border: 2px solid #ff6b6b; border-radius: 0 0 10px 10px; }
                    .detail { margin: 10px 0; padding: 10px; background: #f8f9fa; border-left: 4px solid #667eea; }
                    .urgent { background: #fff3cd; border: 2px solid #ffc107; padding: 15px; border-radius: 5px; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="alert-header">
                        <h2>🚨 NEW BOOKING ALERT</h2>
                        <p>Action Required - Worker Assignment</p>
                    </div>
                    <div class="content">
                        <div class="urgent">
                            <strong>⚡ URGENT:</strong> New booking requires immediate attention!<br>
                            Please contact customer within 15 minutes.
                        </div>
                        
                        <div class="detail">
                            <strong>Customer:</strong> ${bookingData.name}<br>
                            <strong>Phone:</strong> ${bookingData.phone}<br>
                            <strong>Email:</strong> ${bookingData.email}
                        </div>
                        
                        <div class="detail">
                            <strong>Service:</strong> ${bookingData.serviceType}<br>
                            <strong>Date:</strong> ${bookingData.date}<br>
                            <strong>Time:</strong> ${bookingData.time}<br>
                            <strong>Address:</strong> ${bookingData.address}
                        </div>
                        
                        ${bookingData.instructions ? `
                        <div class="detail">
                            <strong>Special Instructions:</strong><br>
                            ${bookingData.instructions}
                        </div>
                        ` : ''}
                        
                        <div style="margin-top: 20px; text-align: center;">
                            <a href="tel:${bookingData.phone}" style="display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px;">
                                📞 Call Customer Now
                            </a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        // In production, send to worker's email
        const workerEmail = `worker${workerId}@go-ham.com`;
        
        return await this.sendEmail({
            to: workerEmail,
            subject: `🚨 NEW BOOKING - ${bookingData.serviceType} - ${bookingData.date}`,
            html: emailHtml
        });
    }
}

class ProductionSMSService {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        console.log('SMS service initialized (client-side mode)');
        this.initialized = true;
        return true;
    }

    async sendSMS(options) {
        const { to, body } = options;
        
        console.log('SMS would be sent:', { to, body });
        
        // In production, this should call your backend API which then uses Twilio
        return {
            success: true,
            messageId: `sms-${Date.now()}`,
            timestamp: new Date().toISOString(),
            recipient: to,
            status: 'queued'
        };
    }

    async sendBookingConfirmation(bookingData) {
        const message = `GO HAM PRO: Booking confirmed! ${bookingData.serviceType} on ${bookingData.date} at ${bookingData.time}. Booking ID: #${bookingData.id}. We'll call you within 15 mins. Questions? Call (720) 813-8057`;

        return await this.sendSMS({
            to: bookingData.phone,
            body: message
        });
    }

    async sendWorkerAlert(bookingData, workerId) {
        // In production, get worker's phone from database
        const workerPhone = '+1234567890'; // Placeholder
        
        const message = `NEW BOOKING ALERT! Customer: ${bookingData.name}, Service: ${bookingData.serviceType}, Date: ${bookingData.date}, Time: ${bookingData.time}. Contact customer at ${bookingData.phone} within 15 mins. Booking ID: #${bookingData.id}`;

        return await this.sendSMS({
            to: workerPhone,
            body: message
        });
    }

    async sendReminderSMS(bookingData) {
        const message = `GO HAM PRO Reminder: Your ${bookingData.serviceType} is scheduled for tomorrow at ${bookingData.time}. Address: ${bookingData.address}. Questions? Call (720) 813-8057`;

        return await this.sendSMS({
            to: bookingData.phone,
            body: message
        });
    }
}

class ProductionCalendarService {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        console.log('Calendar service initialized (client-side mode)');
        this.initialized = true;
        return true;
    }

    async createEvent(bookingData) {
        console.log('Calendar event would be created:', bookingData);
        
        // In production, integrate with Google Calendar API via backend
        return {
            success: true,
            eventId: `cal-${Date.now()}`,
            calendarLink: `https://calendar.google.com/calendar/event?action=TEMPLATE&text=${encodeURIComponent(bookingData.serviceType)}&dates=${bookingData.date}`,
            timestamp: new Date().toISOString()
        };
    }

    async updateEvent(eventId, updates) {
        console.log('Calendar event would be updated:', { eventId, updates });
        
        return {
            success: true,
            eventId: eventId,
            updated: true,
            timestamp: new Date().toISOString()
        };
    }

    async deleteEvent(eventId) {
        console.log('Calendar event would be deleted:', eventId);
        
        return {
            success: true,
            eventId: eventId,
            deleted: true,
            timestamp: new Date().toISOString()
        };
    }

    generateICalInvite(bookingData) {
        const startDate = new Date(bookingData.date + ' ' + bookingData.time);
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
        
        return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GO HAM PRO Services//Booking//EN
BEGIN:VEVENT
UID:${bookingData.id}@go-ham.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${bookingData.serviceType} - GO HAM PRO
DESCRIPTION:Service: ${bookingData.serviceType}\\nCustomer: ${bookingData.name}\\nPhone: ${bookingData.phone}
LOCATION:${bookingData.address}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
    }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.ProductionEmailService = ProductionEmailService;
    window.ProductionSMSService = ProductionSMSService;
    window.ProductionCalendarService = ProductionCalendarService;
}

// Node.js exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ProductionEmailService,
        ProductionSMSService,
        ProductionCalendarService
    };
}
