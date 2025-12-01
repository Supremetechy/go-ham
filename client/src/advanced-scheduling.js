// Advanced Scheduling & Customer Follow-up System
// Handles worker availability, automatic scheduling, and customer communications
import { DatabaseService } from './database-service.js';
import EmailService from './services/email-service';
import SMSService from './services/sms-service';



class AdvancedSchedulingSystem {
    constructor() {
        this.database = new DatabaseService();
        this.emailService = new EmailService();
        this.smsService = new SMSService();
        this.calendarService = new CalendarIntegration();
        this.followUpManager = new CustomerFollowUpManager();
        
        this.schedulingRules = {
            minAdvanceHours: 4,
            maxAdvanceDays: 30,
            workingHours: { start: '07:00', end: '19:00' },
            allowWeekends: true,
            allowHolidays: false,
            bufferMinutes: 30, // Between appointments
            maxDailyBookings: 6 // Per worker
        };

        this.initialize();
    }

    async initialize() {
        await this.loadWorkerSchedules();
        this.startAutomatedTasks();
        console.log('📅 Advanced Scheduling System initialized');
    }

    async scheduleBooking(bookingData) {
        try {
            console.log('📅 Processing advanced scheduling for:', bookingData);

            // 1. Validate booking time
            const timeValidation = this.validateBookingTime(bookingData);
            if (!timeValidation.valid) {
                throw new Error(timeValidation.error);
            }

            // 2. Find available workers
            const availableWorkers = await this.findAvailableWorkers(bookingData);
            if (availableWorkers.length === 0) {
                return await this.handleNoAvailability(bookingData);
            }

            // 3. Auto-assign best worker
            const assignedWorker = this.selectBestWorker(availableWorkers, bookingData);

            // 4. Create calendar event
            const calendarEvent = await this.calendarService.createEvent({
                title: `${bookingData.serviceType} - ${bookingData.name}`,
                start: new Date(`${bookingData.date}T${bookingData.time}`),
                duration: this.getServiceDuration(bookingData.serviceType),
                workerId: assignedWorker.id,
                customerData: bookingData
            });

            // 5. Update worker schedule
            await this.updateWorkerSchedule(assignedWorker.id, calendarEvent);

            // 6. Send confirmations
            await Promise.all([
                this.sendWorkerConfirmation(assignedWorker, bookingData, calendarEvent),
                this.sendCustomerConfirmation(bookingData, assignedWorker, calendarEvent)
            ]);

            // 7. Schedule follow-ups
            await this.followUpManager.scheduleFollowUps(bookingData, assignedWorker);

            return {
                success: true,
                worker: assignedWorker,
                calendarEvent: calendarEvent,
                confirmationsSent: true
            };

        } catch (error) {
            console.error('❌ Scheduling failed:', error);
            await this.handleSchedulingError(bookingData, error);
            throw error;
        }
    }

    validateBookingTime(bookingData) {
        const now = new Date();
        const bookingDateTime = new Date(`${bookingData.date}T${bookingData.time}`);
        
        // Check minimum advance time
        const hoursDiff = (bookingDateTime - now) / (1000 * 60 * 60);
        if (hoursDiff < this.schedulingRules.minAdvanceHours) {
            return {
                valid: false,
                error: `Booking must be at least ${this.schedulingRules.minAdvanceHours} hours in advance`
            };
        }

        // Check maximum advance time
        const daysDiff = hoursDiff / 24;
        if (daysDiff > this.schedulingRules.maxAdvanceDays) {
            return {
                valid: false,
                error: `Booking cannot be more than ${this.schedulingRules.maxAdvanceDays} days in advance`
            };
        }

        // Check working hours
        const bookingTime = bookingData.time;
        if (bookingTime < this.schedulingRules.workingHours.start || 
            bookingTime > this.schedulingRules.workingHours.end) {
            return {
                valid: false,
                error: `Service hours are ${this.schedulingRules.workingHours.start} - ${this.schedulingRules.workingHours.end}`
            };
        }

        // Check weekends
        const dayOfWeek = bookingDateTime.getDay();
        if (!this.schedulingRules.allowWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
            return {
                valid: false,
                error: 'Weekend bookings are not available'
            };
        }

        // Check holidays
        if (!this.schedulingRules.allowHolidays && this.isHoliday(bookingDateTime)) {
            return {
                valid: false,
                error: 'Holiday bookings are not available'
            };
        }

        return { valid: true };
    }

    async findAvailableWorkers(bookingData) {
        const potentialWorkers = this.getWorkersByService(bookingData.serviceType);
        const availableWorkers = [];

        for (const worker of potentialWorkers) {
            const isAvailable = await this.checkWorkerAvailability(
                worker.id, 
                bookingData.date, 
                bookingData.time,
                this.getServiceDuration(bookingData.serviceType)
            );

            if (isAvailable) {
                const workload = await this.getWorkerDailyWorkload(worker.id, bookingData.date);
                if (workload < this.schedulingRules.maxDailyBookings) {
                    availableWorkers.push({
                        ...worker,
                        currentWorkload: workload,
                        distance: this.calculateDistance(worker.location, bookingData.address)
                    });
                }
            }
        }

        return availableWorkers;
    }

    selectBestWorker(availableWorkers, bookingData) {
        // Scoring algorithm for worker selection
        return availableWorkers.sort((a, b) => {
            let scoreA = 0;
            let scoreB = 0;

            // Prefer workers with less workload (10 points max)
            scoreA += (this.schedulingRules.maxDailyBookings - a.currentWorkload) * 10 / this.schedulingRules.maxDailyBookings;
            scoreB += (this.schedulingRules.maxDailyBookings - b.currentWorkload) * 10 / this.schedulingRules.maxDailyBookings;

            // Prefer closer workers (15 points max)
            const maxDistance = 50; // miles
            scoreA += Math.max(0, (maxDistance - a.distance) * 15 / maxDistance);
            scoreB += Math.max(0, (maxDistance - b.distance) * 15 / maxDistance);

            // Prefer more experienced workers (5 points max)
            scoreA += Math.min(5, a.experienceYears);
            scoreB += Math.min(5, b.experienceYears);

            // Prefer higher rated workers (10 points max)
            scoreA += (a.rating || 4.0) * 2;
            scoreB += (b.rating || 4.0) * 2;

            return scoreB - scoreA;
        })[0];
    }

    async checkWorkerAvailability(workerId, date, time, durationMinutes) {
        try {
            const schedule = await this.database.getWorkerSchedule(workerId, date);
            const requestedStart = new Date(`${date}T${time}`);
            const requestedEnd = new Date(requestedStart.getTime() + durationMinutes * 60000);

            // Check for conflicts
            for (const appointment of schedule) {
                const appointmentStart = new Date(appointment.startTime);
                const appointmentEnd = new Date(appointment.endTime);

                // Add buffer time
                appointmentStart.setMinutes(appointmentStart.getMinutes() - this.schedulingRules.bufferMinutes);
                appointmentEnd.setMinutes(appointmentEnd.getMinutes() + this.schedulingRules.bufferMinutes);

                if (requestedStart < appointmentEnd && requestedEnd > appointmentStart) {
                    return false; // Conflict found
                }
            }

            return true;
        } catch (error) {
            console.error('Error checking worker availability:', error);
            return false;
        }
    }

    async handleNoAvailability(bookingData) {
        console.log('⚠️ No workers available, finding alternatives');

        // Find next available slots
        const alternatives = await this.findAlternativeSlots(bookingData);

        // Send customer options
        await this.sendAlternativeOptions(bookingData, alternatives);

        // Alert admin
        await this.alertAdminNoAvailability(bookingData, alternatives);

        return {
            success: false,
            reason: 'no_availability',
            alternatives: alternatives
        };
    }

    async findAlternativeSlots(bookingData, days = 7) {
        const alternatives = [];
        const startDate = new Date(bookingData.date);
        
        for (let i = 0; i < days; i++) {
            const checkDate = new Date(startDate);
            checkDate.setDate(startDate.getDate() + i);
            
            if (checkDate.toISOString().split('T')[0] === bookingData.date && i === 0) {
                continue; // Skip the originally requested date
            }

            const dayAlternatives = await this.findDayAlternatives(
                checkDate.toISOString().split('T')[0], 
                bookingData
            );
            
            alternatives.push(...dayAlternatives);
        }

        return alternatives.slice(0, 5); // Return top 5 alternatives
    }

    async findDayAlternatives(date, bookingData) {
        const timeSlots = this.generateTimeSlots();
        const alternatives = [];

        for (const timeSlot of timeSlots) {
            const testBooking = { ...bookingData, date, time: timeSlot };
            const validation = this.validateBookingTime(testBooking);
            
            if (validation.valid) {
                const availableWorkers = await this.findAvailableWorkers(testBooking);
                
                if (availableWorkers.length > 0) {
                    const bestWorker = this.selectBestWorker(availableWorkers, testBooking);
                    alternatives.push({
                        date,
                        time: timeSlot,
                        worker: bestWorker,
                        dayName: new Date(date).toLocaleDateString('en-US', { weekday: 'long' })
                    });
                }
            }
        }

        return alternatives;
    }

    generateTimeSlots() {
        const slots = [];
        const startHour = parseInt(this.schedulingRules.workingHours.start.split(':')[0]);
        const endHour = parseInt(this.schedulingRules.workingHours.end.split(':')[0]);

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute of [0, 30]) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(time);
            }
        }

        return slots;
    }

    async sendAlternativeOptions(bookingData, alternatives) {
        const emailHtml = this.generateAlternativeOptionsEmail(bookingData, alternatives);
        
        await this.emailService.sendEmail({
            to: bookingData.email,
            subject: 'Alternative Time Slots Available - GO HAM PRO Services',
            html: emailHtml
        });

        // Also send SMS for urgent communication
        const smsMessage = `Hi ${bookingData.name}, your requested time isn't available. We found ${alternatives.length} alternative slots. Check your email for details or call (555) 123-4567.`;
        
        await this.smsService.sendSMS(bookingData.phone, smsMessage);
    }

    generateAlternativeOptionsEmail(bookingData, alternatives) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background: #f8fafc; }
                .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: white; margin: 0 20px; }
                .alternative { background: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin: 10px 0; }
                .btn { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⏰ Alternative Time Slots Available</h1>
                    <p>We found great alternatives for your ${bookingData.serviceType} service</p>
                </div>
                
                <div class="content">
                    <p>Hi ${bookingData.name},</p>
                    <p>Unfortunately, your requested time slot (${bookingData.date} at ${bookingData.time}) is not available.</p>
                    <p>However, we found these excellent alternatives:</p>
                    
                    ${alternatives.map(alt => `
                        <div class="alternative">
                            <h3>${alt.dayName}, ${new Date(alt.date).toLocaleDateString()}</h3>
                            <p><strong>Time:</strong> ${alt.time}</p>
                            <p><strong>Worker:</strong> ${alt.worker.name} (${alt.worker.rating}⭐ rating)</p>
                            <a href="mailto:info@gohampro.com?subject=Book ${alt.date} ${alt.time}" class="btn">Book This Slot</a>
                        </div>
                    `).join('')}
                    
                    <p>To book one of these slots or discuss other options, please:</p>
                    <ul>
                        <li>📧 Reply to this email with your preferred time</li>
                        <li>📞 Call us at (555) 123-4567</li>
                        <li>💬 Use our website chat</li>
                    </ul>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    getServiceDuration(serviceType) {
        const durations = {
            'house-washing': 180,      // 3 hours
            'mobile-detailing': 90,    // 1.5 hours
            'gutter-cleaning': 120,    // 2 hours
            'commercial-washing': 240,  // 4 hours
            'driveway-cleaning': 60,   // 1 hour
            'deck-cleaning': 150       // 2.5 hours
        };
        
        return durations[serviceType] || 120; // Default 2 hours
    }

    calculateDistance(workerLocation, customerAddress) {
        // Simplified distance calculation
        // In production, use Google Maps Distance Matrix API
        const zones = {
            'north': { lat: 40.7589, lng: -73.9851 },
            'south': { lat: 40.7505, lng: -73.9934 },
            'central': { lat: 40.7549, lng: -73.9840 },
            'east': { lat: 40.7614, lng: -73.9776 },
            'west': { lat: 40.7505, lng: -73.9971 }
        };

        // For demo, return random distance based on zone
        const baseDistance = Math.random() * 20 + 5; // 5-25 miles
        return Math.round(baseDistance * 100) / 100;
    }

    isHoliday(date) {
        // Simplified holiday check
        const holidays = [
            '2024-01-01', // New Year's Day
            '2024-07-04', // Independence Day
            '2024-12-25'  // Christmas
            // Add more holidays as needed
        ];
        
        return holidays.includes(date.toISOString().split('T')[0]);
    }

    getWorkersByService(serviceType) {
        // This would come from AlertConfig.workers in a real implementation
        return [
            {
                id: 1,
                name: 'Mike Johnson',
                services: ['mobile-detailing', 'house-washing'],
                zone: 'north',
                experienceYears: 5,
                rating: 4.9,
                location: 'north'
            },
            {
                id: 2,
                name: 'Sarah Davis',
                services: ['gutter-cleaning', 'commercial-washing'],
                zone: 'south',
                experienceYears: 7,
                rating: 4.8,
                location: 'south'
            }
        ].filter(worker => 
            worker.services.some(service => 
                serviceType.toLowerCase().includes(service.toLowerCase())
            )
        );
    }

    async loadWorkerSchedules() {
        // Initialize worker schedules in database
        console.log('📅 Loading worker schedules...');
    }

    startAutomatedTasks() {
        // Start reminder system
        setInterval(() => {
            this.followUpManager.processReminders();
        }, 60000); // Check every minute

        // Start daily schedule optimization
        setInterval(() => {
            this.optimizeDailySchedules();
        }, 24 * 60 * 60 * 1000); // Once per day
    }

    async optimizeDailySchedules() {
        console.log('🔄 Running daily schedule optimization...');
        // Implement schedule optimization logic
    }
}

class CustomerFollowUpManager {
    constructor() {
        this.emailService = new EmailService();
        this.smsService = new SMSService();
        this.followUpSchedule = new Map();
    }

    async scheduleFollowUps(bookingData, assignedWorker) {
        const followUps = [
            {
                type: 'reminder_24h',
                delay: 24 * 60 * 60 * 1000, // 24 hours before
                method: 'email_sms'
            },
            {
                type: 'reminder_2h',
                delay: 2 * 60 * 60 * 1000, // 2 hours before
                method: 'sms'
            },
            {
                type: 'satisfaction_4h',
                delay: 4 * 60 * 60 * 1000, // 4 hours after
                method: 'email'
            },
            {
                type: 'review_request_24h',
                delay: 24 * 60 * 60 * 1000, // 24 hours after
                method: 'email_sms'
            }
        ];

        const serviceDateTime = new Date(`${bookingData.date}T${bookingData.time}`);

        for (const followUp of followUps) {
            let triggerTime;
            
            if (followUp.type.includes('reminder')) {
                triggerTime = new Date(serviceDateTime.getTime() - followUp.delay);
            } else {
                triggerTime = new Date(serviceDateTime.getTime() + followUp.delay);
            }

            // Only schedule future follow-ups
            if (triggerTime > new Date()) {
                setTimeout(() => {
                    this.executeFollowUp(followUp.type, bookingData, assignedWorker);
                }, triggerTime - new Date());

                this.followUpSchedule.set(`${bookingData.id}_${followUp.type}`, {
                    bookingData,
                    assignedWorker,
                    triggerTime,
                    type: followUp.type,
                    method: followUp.method
                });
            }
        }

        console.log(`📋 Scheduled ${followUps.length} follow-ups for booking ${bookingData.id}`);
    }

    async executeFollowUp(type, bookingData, worker) {
        try {
            console.log(`📞 Executing follow-up: ${type} for booking ${bookingData.id}`);

            switch (type) {
                case 'reminder_24h':
                    await this.send24HourReminder(bookingData, worker);
                    break;
                case 'reminder_2h':
                    await this.send2HourReminder(bookingData, worker);
                    break;
                case 'satisfaction_4h':
                    await this.sendSatisfactionSurvey(bookingData, worker);
                    break;
                case 'review_request_24h':
                    await this.sendReviewRequest(bookingData, worker);
                    break;

                default:
                    console.error(`❌ Invalid follow-up type: ${type}`);
                    break;
            }
        } catch (error) {
            console.error(`❌ Follow-up execution failed for ${type}:`, error);
        }
    }

    async send24HourReminder(bookingData, worker) {
        const emailHtml = `
        <h2>🔔 Service Reminder - Tomorrow!</h2>
        <p>Hi ${bookingData.name},</p>
        <p>This is a friendly reminder that your ${bookingData.serviceType} service is scheduled for tomorrow:</p>
        <ul>
            <li><strong>Date:</strong> ${new Date(bookingData.date).toLocaleDateString()}</li>
            <li><strong>Time:</strong> ${bookingData.time}</li>
            <li><strong>Worker:</strong> ${worker.name}</li>
            <li><strong>Contact:</strong> ${worker.phone}</li>
        </ul>
        <p>Please ensure someone is available at the property. If you need to reschedule, call us at (555) 123-4567.</p>
        `;

        await Promise.all([
            this.emailService.sendEmail({
                to: bookingData.email,
                subject: '🔔 Service Reminder - Tomorrow at ' + bookingData.time,
                html: emailHtml
            }),
            this.smsService.sendSMS(
                bookingData.phone,
                `Reminder: ${bookingData.serviceType} service tomorrow at ${bookingData.time} with ${worker.name}. Questions? Call (555) 123-4567`
            )
        ]);
    }

    async send2HourReminder(bookingData, worker) {
        const message = `⏰ Final reminder: Your ${bookingData.serviceType} service with ${worker.name} is in 2 hours. We'll be there at ${bookingData.time}! - GO HAM PRO`;
        
        await this.smsService.sendSMS(bookingData.phone, message);
    }

    async sendSatisfactionSurvey(bookingData, worker) {
        const surveyHtml = `
        <h2>💙 How was your service experience?</h2>
        <p>Hi ${bookingData.name},</p>
        <p>Thank you for choosing GO HAM PRO Services! We hope you're satisfied with the ${bookingData.serviceType} service provided by ${worker.name}.</p>
        
        <div style="text-align: center; margin: 20px 0;">
            <p><strong>Rate your experience:</strong></p>
            <a href="mailto:feedback@gohampro.com?subject=Excellent Service - ${bookingData.id}" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; margin: 5px; border-radius: 5px;">⭐⭐⭐⭐⭐ Excellent</a><br>
            <a href="mailto:feedback@gohampro.com?subject=Good Service - ${bookingData.id}" style="background: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; margin: 5px; border-radius: 5px;">⭐⭐⭐⭐ Good</a><br>
            <a href="mailto:feedback@gohampro.com?subject=Needs Improvement - ${bookingData.id}" style="background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; margin: 5px; border-radius: 5px;">⭐⭐⭐ Needs Improvement</a>
        </div>
        
        <p>Your feedback helps us maintain our high standards!</p>
        `;

        await this.emailService.sendEmail({
            to: bookingData.email,
            subject: '💙 How was your GO HAM PRO service?',
            html: surveyHtml
        });
    }

    async sendReviewRequest(bookingData, worker) {
        const reviewHtml = `
        <h2>🌟 Share your experience!</h2>
        <p>Hi ${bookingData.name},</p>
        <p>We're grateful you chose GO HAM PRO Services for your ${bookingData.serviceType} needs!</p>
        <p>If you were satisfied with ${worker.name}'s service, would you mind sharing your experience with others?</p>
        
        <div style="text-align: center; margin: 20px 0;">
            <a href="https://google.com/business/reviews" style="background: #4285f4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 10px; display: inline-block;">⭐ Review on Google</a><br>
            <a href="https://facebook.com/gohampro" style="background: #1877f2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 10px; display: inline-block;">👍 Review on Facebook</a>
        </div>
        
        <p>As a thank you, mention this email for 10% off your next service!</p>
        `;

        await Promise.all([
            this.emailService.sendEmail({
                to: bookingData.email,
                subject: '🌟 Share your GO HAM PRO experience + 10% off next service!',
                html: reviewHtml
            }),
            this.smsService.sendSMS(
                bookingData.phone,
                `Thanks for choosing GO HAM PRO! If you loved ${worker.name}'s service, please leave us a review for 10% off next time: https://google.com/business/reviews`
            )
        ]);
    }

    processReminders() {
        // Process any pending reminders
        const now = new Date();
        
        for (const [key, followUp] of this.followUpSchedule.entries()) {
            if (followUp.triggerTime <= now) {
                this.executeFollowUp(followUp.type, followUp.bookingData, followUp.assignedWorker);
                this.followUpSchedule.delete(key);
            }
        }
    }
}

// Calendar Integration Service
class CalendarIntegration {
    constructor() {
        this.provider = 'google'; // or 'outlook', 'apple'
        this.apiKey = process.env.CALENDAR_API_KEY;
    }

    async createEvent(eventData) {
        // Simulate calendar event creation
        console.log('📅 Creating calendar event:', eventData.title);
        
        const event = {
            id: 'cal_' + Date.now(),
            title: eventData.title,
            startTime: eventData.start,
            endTime: new Date(eventData.start.getTime() + eventData.duration * 60000),
            workerId: eventData.workerId,
            customerData: eventData.customerData,
            location: eventData.customerData.address
        };

        // In production, integrate with Google Calendar API, Outlook, etc.
        
        return event;
    }

    async updateEvent(eventId, updates) {
        console.log('📅 Updating calendar event:', eventId);
        // Implement event updates
        return { success: true };
    }

    async deleteEvent(eventId) {
        console.log('📅 Deleting calendar event:', eventId);
        // Implement event deletion
        return { success: true };
    }
}

// Export classes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        AdvancedSchedulingSystem, 
        CustomerFollowUpManager, 
        CalendarIntegration 
    };
} else {
    window.AdvancedSchedulingSystem = AdvancedSchedulingSystem;
    window.CustomerFollowUpManager = CustomerFollowUpManager;
    window.CalendarIntegration = CalendarIntegration;
}

export { AdvancedSchedulingSystem, CustomerFollowUpManager, CalendarIntegration };