// GO HAM PRO Services - Worker Alert System
// Handles email and SMS notifications for new bookings



class AlertSystem {
    constructor() {
        this.emailService = new EmailService();
        this.smsService = new SMSService();
        this.workers = [
            {
                id: 1,
                name: 'Mike Johnson',
                email: 'mike@gohampro.com',
                phone: '+15550101',
                services: ['mobile-detailing', 'house-washing'],
                zone: 'north',
                isActive: true
            },
            {
                id: 2,
                name: 'Sarah Davis',
                email: 'sarah@gohampro.com',
                phone: '+15550102',
                services: ['gutter-cleaning', 'commercial-washing'],
                zone: 'south',
                isActive: true
            },
            {
                id: 3,
                name: 'Carlos Rodriguez',
                email: 'carlos@gohampro.com',
                phone: '+15550103',
                services: ['mobile-detailing', 'gutter-cleaning', 'house-washing'],
                zone: 'central',
                isActive: true
            }
        ];
        this.adminContacts = {
            email: 'admin@gohampro.com',
            phone: '+15550100'
        };
    }

    async processBookingAlert(bookingData) {
        try {
            console.log('🔔 Processing booking alert for:', bookingData);
            
            // Find appropriate workers
            const assignedWorkers = this.findAppropriateWorkers(bookingData);
            
            if (assignedWorkers.length === 0) {
                console.warn('⚠️ No workers found for this booking');
                await this.sendNoWorkerAlert(bookingData);
                return {
                    success: true,
                    message: 'No workers available - admin notified',
                    workersNotified: 0
                };
            }
            
            // Send alerts concurrently
            const [workerResults, adminResult] = await Promise.all([
                this.sendWorkerAlerts(assignedWorkers, bookingData),
                this.sendAdminAlert(bookingData)
            ]);
            
            // Log the alert
            this.logAlert(bookingData, assignedWorkers);
            
            return {
                success: true,
                message: 'Alerts sent successfully',
                workersNotified: assignedWorkers.length,
                workerResults,
                adminResult
            };
            
        } catch (error) {
            console.error('❌ Alert system error:', error);
            await this.sendErrorAlert(error, bookingData);
            throw error;
        }
    }

    findAppropriateWorkers(bookingData) {
        const { serviceType, address } = bookingData;
        
        return this.workers.filter(worker => {
            if (!worker.isActive) return false;
            
            // Check if worker handles this service
            const handlesService = worker.services.some(service => 
                serviceType.toLowerCase().includes(service.toLowerCase()) ||
                service.toLowerCase().includes(serviceType.toLowerCase())
            );
            
            // Check zone (simplified - in production, use GPS coordinates)
            const inZone = this.isInWorkerZone(address, worker.zone);
            
            return handlesService && inZone;
        });
    }

    isInWorkerZone(address, workerZone) {
        const addressLower = address.toLowerCase();
        
        const zoneKeywords = {
            north: ['north', 'uptown', 'highland', 'oakwood', 'summit'],
            south: ['south', 'downtown', 'riverside', 'greenfield', 'valley'],
            central: ['central', 'midtown', 'city center', 'main street', 'downtown']
        };
        
        const keywords = zoneKeywords[workerZone] || [];
        return keywords.some(keyword => addressLower.includes(keyword)) || workerZone === 'central';
    }

    async sendWorkerAlerts(workers, bookingData) {
        const alertPromises = workers.map(async (worker) => {
            try {
                // Send both email and SMS concurrently
                const [emailResult, smsResult] = await Promise.all([
                    this.emailService.sendWorkerAlert(worker, bookingData),
                    this.smsService.sendWorkerAlert(worker, bookingData)
                ]);
                
                console.log(`✅ Alert sent to ${worker.name}`);
                return { 
                    worker: worker.name, 
                    status: 'success',
                    email: emailResult,
                    sms: smsResult
                };
                
            } catch (error) {
                console.error(`❌ Failed to alert ${worker.name}:`, error);
                return { 
                    worker: worker.name, 
                    status: 'failed', 
                    error: error.message 
                };
            }
        });

        return Promise.allSettled(alertPromises);
    }

    async sendAdminAlert(bookingData) {
        try {
            await this.emailService.sendAdminAlert(this.adminContacts, bookingData);
            console.log('✅ Admin notification sent');
            return { status: 'success' };
        } catch (error) {
            console.error('❌ Failed to send admin alert:', error);
            return { status: 'failed', error: error.message };
        }
    }

    async sendNoWorkerAlert(bookingData) {
        const alertData = {
            ...bookingData,
            issue: 'No workers available for this service/location'
        };
        
        try {
            await Promise.all([
                this.emailService.sendUrgentAlert(this.adminContacts, alertData),
                this.smsService.sendUrgentAlert(this.adminContacts, alertData)
            ]);
        } catch (error) {
            console.error('❌ Failed to send no-worker alert:', error);
        }
    }

    async sendErrorAlert(error, bookingData) {
        const errorData = {
            error: error.message,
            booking: bookingData,
            timestamp: new Date().toISOString()
        };
        
        try {
            await Promise.all([
                this.emailService.sendErrorAlert(this.adminContacts, errorData),
                this.smsService.sendErrorAlert(this.adminContacts, errorData)
            ]);
        } catch (alertError) {
            console.error('🚨 Critical: Failed to send error alerts:', alertError);
        }
    }

    logAlert(bookingData, workers) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            bookingId: bookingData.id || Date.now(),
            service: bookingData.serviceType,
            customer: bookingData.name,
            workersNotified: workers.map(w => ({ name: w.name, email: w.email, phone: w.phone })),
            status: 'sent'
        };
        
        // Save to localStorage for demo (use database in production)
        const logs = JSON.parse(localStorage.getItem('alertLogs') || '[]');
        logs.push(logEntry);
        localStorage.setItem('alertLogs', JSON.stringify(logs.slice(-100)));
        
        console.log('📝 Alert logged:', logEntry);
    }

    // Admin methods
    addWorker(workerData) {
        const newWorker = {
            id: Date.now(),
            isActive: true,
            ...workerData
        };
        this.workers.push(newWorker);
        return newWorker;
    }

    updateWorker(workerId, updates) {
        const workerIndex = this.workers.findIndex(w => w.id === workerId);
        if (workerIndex !== -1) {
            this.workers[workerIndex] = { ...this.workers[workerIndex], ...updates };
            return this.workers[workerIndex];
        }
        return null;
    }

    getAlertLogs() {
        return JSON.parse(localStorage.getItem('alertLogs') || '[]');
    }
}

// Email Service Implementation
class EmailService {
    constructor() {
        this.fromEmail = 'noreply@gohampro.com';
        this.companyName = 'GO HAM PRO Services';
    }

    async sendWorkerAlert(worker, bookingData) {
        const emailData = {
            to: worker.email,
            subject: `🔔 URGENT: New ${bookingData.serviceType} Booking`,
            html: this.generateWorkerEmailTemplate(worker, bookingData)
        };

        return this.sendEmail(emailData);
    }

    async sendAdminAlert(admin, bookingData) {
        const emailData = {
            to: admin.email,
            subject: `📋 New Booking: ${bookingData.serviceType} - ${bookingData.name}`,
            html: this.generateAdminEmailTemplate(bookingData)
        };

        return this.sendEmail(emailData);
    }

    async sendUrgentAlert(admin, alertData) {
        const emailData = {
            to: admin.email,
            subject: '🚨 URGENT: No Workers Available for Booking',
            html: this.generateUrgentAlertTemplate(alertData)
        };

        return this.sendEmail(emailData);
    }

    async sendErrorAlert(admin, errorData) {
        const emailData = {
            to: admin.email,
            subject: '🚨 Alert System Error - Immediate Attention Required',
            html: this.generateErrorEmailTemplate(errorData)
        };

        return this.sendEmail(emailData);
    }

    async sendEmail(emailData) {
        // Simulate email sending (replace with actual service in production)
        console.log('📧 Email sent:', emailData.subject, 'to', emailData.to);
        
        // For production, integrate with services like:
        // - SendGrid: https://sendgrid.com/
        // - Mailgun: https://www.mailgun.com/
        // - AWS SES: https://aws.amazon.com/ses/
        
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ 
                    success: true, 
                    messageId: 'msg_' + Date.now(),
                    timestamp: new Date().toISOString()
                });
            }, 100);
        });
    }

    generateWorkerEmailTemplate(worker, bookingData) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background: #f8fafc; }
                .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 20px; text-align: center; }
                .urgent-banner { background: #fbbf24; color: #92400e; padding: 15px; text-align: center; font-weight: bold; }
                .content { padding: 20px; background: white; margin: 0 20px; }
                .booking-card { border: 2px solid #10b981; border-radius: 10px; padding: 20px; margin: 15px 0; background: #f0fdf4; }
                .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
                .detail-item { background: #e2e8f0; padding: 12px; border-radius: 6px; }
                .actions { text-align: center; margin: 20px 0; }
                .btn { display: inline-block; padding: 12px 24px; margin: 8px; border-radius: 6px; text-decoration: none; font-weight: bold; }
                .btn-primary { background: #10b981; color: white; }
                .btn-secondary { background: #6366f1; color: white; }
                .footer { background: #1f2937; color: white; padding: 20px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔔 NEW BOOKING ALERT</h1>
                    <p>Hi ${worker.name}! You have a new service request.</p>
                </div>
                
                <div class="urgent-banner">
                    ⏰ RESPOND WITHIN 15 MINUTES TO SECURE THIS JOB
                </div>
                
                <div class="content">
                    <div class="booking-card">
                        <h2>📋 Booking Details</h2>
                        <div class="details-grid">
                            <div class="detail-item">
                                <strong>🏠 Service:</strong><br>
                                ${bookingData.serviceType}
                            </div>
                            <div class="detail-item">
                                <strong>👤 Customer:</strong><br>
                                ${bookingData.name}
                            </div>
                            <div class="detail-item">
                                <strong>📅 Date:</strong><br>
                                ${bookingData.date}
                            </div>
                            <div class="detail-item">
                                <strong>🕐 Time:</strong><br>
                                ${bookingData.time}
                            </div>
                            <div class="detail-item">
                                <strong>📞 Phone:</strong><br>
                                <a href="tel:${bookingData.phone}">${bookingData.phone}</a>
                            </div>
                            <div class="detail-item">
                                <strong>📧 Email:</strong><br>
                                <a href="mailto:${bookingData.email}">${bookingData.email}</a>
                            </div>
                        </div>
                        
                        <div style="margin: 15px 0; padding: 15px; background: #dbeafe; border-radius: 6px;">
                            <strong>📍 Address:</strong><br>
                            <span style="font-size: 16px;">${bookingData.address}</span>
                        </div>
                        
                        ${bookingData.instructions ? `
                        <div style="margin: 15px 0; padding: 15px; background: #fef3c7; border-radius: 6px;">
                            <strong>📝 Special Instructions:</strong><br>
                            <em>${bookingData.instructions}</em>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="actions">
                        <a href="tel:${bookingData.phone}" class="btn btn-primary">📞 Call Customer Now</a>
                        <a href="mailto:${bookingData.email}?subject=Re: Your ${bookingData.serviceType} Service" class="btn btn-secondary">📧 Send Email</a>
                    </div>
                    
                    <div style="background: #fef2f2; padding: 15px; border-radius: 6px; border-left: 4px solid #ef4444;">
                        <strong>⚠️ IMPORTANT:</strong>
                        <ul style="margin: 10px 0;">
                            <li>Contact the customer within 15 minutes</li>
                            <li>Confirm your availability for this job</li>
                            <li>If unavailable, notify admin immediately</li>
                            <li>Provide estimated arrival time to customer</li>
                        </ul>
                    </div>
                </div>
                
                <div class="footer">
                    <p>💧 ${this.companyName}</p>
                    <p>Professional Pressure Washing Services</p>
                    <small>Booking ID: #${bookingData.id} | ${new Date().toLocaleString()}</small>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    generateAdminEmailTemplate(bookingData) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; }
                .container { max-width: 600px; margin: 0 auto; background: #f8fafc; }
                .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: white; margin: 0 20px; }
                .summary { background: #f0fdf4; padding: 20px; border-radius: 10px; border-left: 4px solid #10b981; }
                .status { background: #dbeafe; padding: 15px; border-radius: 6px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📋 New Booking Received</h1>
                    <p>Booking #${bookingData.id}</p>
                </div>
                
                <div class="content">
                    <div class="summary">
                        <h2>Booking Summary</h2>
                        <p><strong>Service:</strong> ${bookingData.serviceType}</p>
                        <p><strong>Customer:</strong> ${bookingData.name}</p>
                        <p><strong>Contact:</strong> ${bookingData.phone} | ${bookingData.email}</p>
                        <p><strong>Date & Time:</strong> ${bookingData.date} at ${bookingData.time}</p>
                        <p><strong>Address:</strong> ${bookingData.address}</p>
                        <p><strong>Submitted:</strong> ${new Date(bookingData.timestamp).toLocaleString()}</p>
                    </div>
                    
                    <div class="status">
                        <h3>✅ Automatic Actions Completed:</h3>
                        <ul>
                            <li>Worker notifications sent (Email + SMS)</li>
                            <li>Booking logged in system</li>
                            <li>Customer confirmation pending worker response</li>
                        </ul>
                        
                        <h3>📋 Required Follow-up:</h3>
                        <ul>
                            <li>Monitor worker response (15-minute window)</li>
                            <li>Assign backup worker if needed</li>
                            <li>Send customer confirmation once worker assigned</li>
                        </ul>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    generateUrgentAlertTemplate(alertData) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background: #fef2f2; border: 2px solid #ef4444; }
                .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .alert-box { background: #fee2e2; padding: 15px; border-radius: 6px; border-left: 4px solid #ef4444; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚨 URGENT: No Workers Available</h1>
                    <p>Immediate manual assignment required</p>
                </div>
                <div class="content">
                    <div class="alert-box">
                        <h3>Issue: ${alertData.issue}</h3>
                        <p><strong>Customer:</strong> ${alertData.name}</p>
                        <p><strong>Service:</strong> ${alertData.serviceType}</p>
                        <p><strong>Date:</strong> ${alertData.date} at ${alertData.time}</p>
                        <p><strong>Location:</strong> ${alertData.address}</p>
                    </div>
                    <p><strong>⚠️ ACTION REQUIRED:</strong> Manually assign a worker or contact customer to reschedule.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    generateErrorEmailTemplate(errorData) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: monospace; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background: #fef2f2; border: 2px solid #ef4444; }
                .header { background: #ef4444; color: white; padding: 20px; }
                .error { background: #fee2e2; padding: 15px; margin: 10px; border-radius: 6px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚨 Alert System Error</h1>
                    <p>Critical system failure - immediate attention required</p>
                </div>
                <div class="error">
                    <p><strong>Error Time:</strong> ${errorData.timestamp}</p>
                    <p><strong>Error:</strong> ${errorData.error}</p>
                    <p><strong>Affected Booking:</strong> ${errorData.booking?.name || 'Unknown'}</p>
                    <p><strong>Service:</strong> ${errorData.booking?.serviceType || 'Unknown'}</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }
}

// SMS Service Implementation
class SMSService {
    constructor() {
        this.fromNumber = '+15559GOHAM';
        this.companyName = 'GO HAM PRO';
    }

    async sendWorkerAlert(worker, bookingData) {
        const message = this.generateWorkerSMSMessage(worker, bookingData);
        return this.sendSMS(worker.phone, message);
    }

    async sendUrgentAlert(admin, alertData) {
        const message = `🚨 URGENT: No workers available for ${alertData.serviceType} booking. Customer: ${alertData.name} (${alertData.phone}). Manual assignment needed ASAP.`;
        return this.sendSMS(admin.phone, message);
    }

    async sendErrorAlert(admin, errorData) {
        const message = `🚨 ALERT SYSTEM ERROR: Failed to process booking notification. Booking: ${errorData.booking?.name} - ${errorData.booking?.serviceType}. Check email immediately.`;
        return this.sendSMS(admin.phone, message);
    }

    async sendSMS(phoneNumber, message) {
        console.log('📱 SMS sent to', phoneNumber, ':', message);
        
        // For production, integrate with services like:
        // - Twilio: https://www.twilio.com/
        // - AWS SNS: https://aws.amazon.com/sns/
        // - MessageBird: https://www.messagebird.com/
        
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ 
                    success: true, 
                    messageId: 'sms_' + Date.now(),
                    timestamp: new Date().toISOString()
                });
            }, 50);
        });
    }

    generateWorkerSMSMessage(worker, bookingData) {
        return `🔔 NEW JOB ALERT! Hi ${worker.name}, you have a new ${bookingData.serviceType} booking.

Customer: ${bookingData.name}
Date: ${bookingData.date} at ${bookingData.time}
Location: ${bookingData.address}
Phone: ${bookingData.phone}

⏰ RESPOND IN 15 MIN! Call customer to confirm.

- ${this.companyName}`;
    }
}

// Simple notification function for browser alerts
function showNotification(message, type = 'info') {
    // Use browser alert for now, can be enhanced with toast notifications later
    const prefix = {
        'success': '✅ SUCCESS',
        'error': '❌ ERROR',
        'warning': '⚠️ WARNING',
        'info': 'ℹ️ INFO'
    }[type] || 'ℹ️ INFO';

    alert(`${prefix}: ${message}`);
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AlertSystem, EmailService, SMSService, showNotification };
} else {
    window.AlertSystem = AlertSystem;
    window.EmailService = EmailService;
    window.SMSService = SMSService;
    window.showNotification = showNotification;
}

export { AlertSystem, EmailService, SMSService, showNotification };
