// GO HAM PRO Calendar Sync Integration
// Supports Google Calendar, Outlook, Apple Calendar, and CalDAV

import { GoogleCalendarAPI } from 'react-native-google-calendar';
import { OutlookAPI } from '@azure/msal-react-native';
import CalendarManager from 'react-native-calendar-events';
import CalDAVClient from 'react-native-caldav';

class CalendarSyncService {
    constructor() {
        this.providers = {
            google: null,
            outlook: null,
            apple: null,
            caldav: null
        };
        this.isInitialized = false;
        this.syncInterval = null;
        this.lastSyncTime = null;
    }

    async initialize() {
        try {
            console.log('📅 Initializing calendar sync service...');

            // Initialize each provider
            await this.initializeGoogleCalendar();
            await this.initializeOutlook();
            await this.initializeAppleCalendar();
            await this.initializeCalDAV();

            // Start automatic sync
            this.startAutoSync();

            this.isInitialized = true;
            console.log('✅ Calendar sync service initialized');

            return {
                success: true,
                availableProviders: Object.keys(this.providers).filter(key => this.providers[key] !== null)
            };

        } catch (error) {
            console.error('❌ Calendar sync initialization failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async initializeGoogleCalendar() {
        try {
            this.providers.google = new GoogleCalendarAPI({
                clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID,
                scopes: [
                    'https://www.googleapis.com/auth/calendar',
                    'https://www.googleapis.com/auth/calendar.events'
                ],
                redirectUrl: 'com.gohampro.worker://oauth'
            });

            console.log('✅ Google Calendar initialized');
        } catch (error) {
            console.error('❌ Google Calendar initialization failed:', error);
        }
    }

    async initializeOutlook() {
        try {
            this.providers.outlook = new OutlookAPI({
                clientId: process.env.OUTLOOK_CLIENT_ID,
                authority: 'https://login.microsoftonline.com/common',
                redirectUri: 'msauth.com.gohampro.worker://auth',
                scopes: [
                    'https://graph.microsoft.com/calendars.readwrite',
                    'https://graph.microsoft.com/calendars.readwrite.shared'
                ]
            });

            console.log('✅ Outlook Calendar initialized');
        } catch (error) {
            console.error('❌ Outlook Calendar initialization failed:', error);
        }
    }

    async initializeAppleCalendar() {
        try {
            // Request calendar permissions for iOS
            const authStatus = await CalendarManager.requestPermissions();
            
            if (authStatus === 'authorized') {
                this.providers.apple = CalendarManager;
                console.log('✅ Apple Calendar initialized');
            } else {
                console.warn('⚠️ Apple Calendar permission denied');
            }
        } catch (error) {
            console.error('❌ Apple Calendar initialization failed:', error);
        }
    }

    async initializeCalDAV() {
        try {
            // CalDAV setup for custom calendar servers
            this.providers.caldav = new CalDAVClient({
                serverUrl: process.env.CALDAV_SERVER_URL,
                credentials: {
                    username: process.env.CALDAV_USERNAME,
                    password: process.env.CALDAV_PASSWORD
                }
            });

            console.log('✅ CalDAV initialized');
        } catch (error) {
            console.error('❌ CalDAV initialization failed:', error);
        }
    }

    // Main sync method
    async syncJobToCalendars(jobData, action = 'create') {
        try {
            console.log(`📅 Syncing job to calendars: ${action}`, jobData);

            const calendarEvent = this.createCalendarEvent(jobData);
            const results = {};

            // Sync to all available providers
            const syncPromises = Object.entries(this.providers).map(async ([provider, client]) => {
                if (!client) return;

                try {
                    let result;
                    
                    switch (action) {
                        case 'create':
                            result = await this.createEvent(provider, calendarEvent);
                            break;
                        case 'update':
                            result = await this.updateEvent(provider, jobData.calendarEventId, calendarEvent);
                            break;
                        case 'delete':
                            result = await this.deleteEvent(provider, jobData.calendarEventId);
                            break;
                    }

                    results[provider] = {
                        success: true,
                        eventId: result?.id || result?.eventId,
                        url: result?.htmlLink || result?.webLink
                    };

                } catch (error) {
                    console.error(`${provider} sync failed:`, error);
                    results[provider] = {
                        success: false,
                        error: error.message
                    };
                }
            });

            await Promise.allSettled(syncPromises);

            // Update job with calendar event IDs
            if (action === 'create') {
                await this.updateJobWithCalendarIds(jobData.id, results);
            }

            return {
                success: true,
                results,
                syncedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Calendar sync failed:', error);
            throw error;
        }
    }

    createCalendarEvent(jobData) {
        const startTime = new Date(`${jobData.date}T${jobData.time}`);
        const endTime = new Date(startTime.getTime() + this.getServiceDuration(jobData.serviceType) * 60000);

        return {
            title: `${jobData.serviceType} - ${jobData.customerName}`,
            description: this.generateEventDescription(jobData),
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            location: jobData.address,
            attendees: [
                {
                    email: jobData.customerEmail,
                    name: jobData.customerName,
                    role: 'customer'
                },
                {
                    email: jobData.workerEmail,
                    name: jobData.workerName,
                    role: 'worker'
                }
            ],
            reminders: [
                { method: 'notification', minutes: 60 },
                { method: 'notification', minutes: 15 },
                { method: 'email', minutes: 24 * 60 }
            ],
            metadata: {
                jobId: jobData.id,
                serviceType: jobData.serviceType,
                bookingId: jobData.bookingId,
                source: 'goham_pro_mobile'
            }
        };
    }

    generateEventDescription(jobData) {
        return `
🏠 Service: ${jobData.serviceType}
👤 Customer: ${jobData.customerName}
📞 Phone: ${jobData.customerPhone}
📧 Email: ${jobData.customerEmail}
📍 Address: ${jobData.address}

${jobData.instructions ? `📝 Instructions:\n${jobData.instructions}\n\n` : ''}

💰 Estimated Cost: ${jobData.estimatedCost || 'TBD'}
⏱️ Duration: ${this.getServiceDuration(jobData.serviceType)} minutes

🔗 Job Details: https://app.gohampro.com/jobs/${jobData.id}

Generated by GO HAM PRO Services
        `.trim();
    }

    // Provider-specific event creation
    async createEvent(provider, eventData) {
        switch (provider) {
            case 'google':
                return await this.createGoogleEvent(eventData);
            case 'outlook':
                return await this.createOutlookEvent(eventData);
            case 'apple':
                return await this.createAppleEvent(eventData);
            case 'caldav':
                return await this.createCalDAVEvent(eventData);
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    async createGoogleEvent(eventData) {
        if (!this.providers.google) {
            throw new Error('Google Calendar not initialized');
        }

        try {
            const event = {
                summary: eventData.title,
                description: eventData.description,
                location: eventData.location,
                start: {
                    dateTime: eventData.startTime,
                    timeZone: 'America/New_York'
                },
                end: {
                    dateTime: eventData.endTime,
                    timeZone: 'America/New_York'
                },
                attendees: eventData.attendees.map(attendee => ({
                    email: attendee.email,
                    displayName: attendee.name
                })),
                reminders: {
                    useDefault: false,
                    overrides: eventData.reminders.map(reminder => ({
                        method: reminder.method === 'notification' ? 'popup' : 'email',
                        minutes: reminder.minutes
                    }))
                },
                extendedProperties: {
                    private: eventData.metadata
                }
            };

            const result = await this.providers.google.events.insert({
                calendarId: 'primary',
                resource: event
            });

            return {
                id: result.id,
                htmlLink: result.htmlLink,
                status: result.status
            };

        } catch (error) {
            throw new Error(`Google Calendar event creation failed: ${error.message}`);
        }
    }

    async createOutlookEvent(eventData) {
        if (!this.providers.outlook) {
            throw new Error('Outlook Calendar not initialized');
        }

        try {
            const event = {
                subject: eventData.title,
                body: {
                    contentType: 'text',
                    content: eventData.description
                },
                location: {
                    displayName: eventData.location
                },
                start: {
                    dateTime: eventData.startTime,
                    timeZone: 'America/New_York'
                },
                end: {
                    dateTime: eventData.endTime,
                    timeZone: 'America/New_York'
                },
                attendees: eventData.attendees.map(attendee => ({
                    type: 'required',
                    emailAddress: {
                        address: attendee.email,
                        name: attendee.name
                    }
                })),
                reminderMinutesBeforeStart: 60,
                isReminderOn: true
            };

            const result = await this.providers.outlook.api('/me/events').post(event);

            return {
                id: result.id,
                webLink: result.webLink,
                status: 'confirmed'
            };

        } catch (error) {
            throw new Error(`Outlook Calendar event creation failed: ${error.message}`);
        }
    }

    async createAppleEvent(eventData) {
        if (!this.providers.apple) {
            throw new Error('Apple Calendar not initialized');
        }

        try {
            const event = {
                title: eventData.title,
                notes: eventData.description,
                location: eventData.location,
                startDate: eventData.startTime,
                endDate: eventData.endTime,
                alarms: eventData.reminders.map(reminder => ({
                    date: new Date(new Date(eventData.startTime).getTime() - reminder.minutes * 60000).toISOString()
                }))
            };

            const eventId = await this.providers.apple.saveEvent(event);

            return {
                eventId,
                status: 'confirmed'
            };

        } catch (error) {
            throw new Error(`Apple Calendar event creation failed: ${error.message}`);
        }
    }

    async createCalDAVEvent(eventData) {
        if (!this.providers.caldav) {
            throw new Error('CalDAV not initialized');
        }

        try {
            const icalEvent = this.createICalEvent(eventData);
            const result = await this.providers.caldav.createEvent(icalEvent);

            return {
                id: result.uid,
                url: result.url,
                status: 'confirmed'
            };

        } catch (error) {
            throw new Error(`CalDAV event creation failed: ${error.message}`);
        }
    }

    // Event update methods
    async updateEvent(provider, eventId, eventData) {
        switch (provider) {
            case 'google':
                return await this.updateGoogleEvent(eventId, eventData);
            case 'outlook':
                return await this.updateOutlookEvent(eventId, eventData);
            case 'apple':
                return await this.updateAppleEvent(eventId, eventData);
            case 'caldav':
                return await this.updateCalDAVEvent(eventId, eventData);
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    // Event deletion methods
    async deleteEvent(provider, eventId) {
        switch (provider) {
            case 'google':
                return await this.providers.google.events.delete({
                    calendarId: 'primary',
                    eventId
                });
            case 'outlook':
                return await this.providers.outlook.api(`/me/events/${eventId}`).delete();
            case 'apple':
                return await this.providers.apple.removeEvent(eventId);
            case 'caldav':
                return await this.providers.caldav.deleteEvent(eventId);
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    // Bulk sync operations
    async syncAllJobs(jobs) {
        console.log(`📅 Starting bulk sync of ${jobs.length} jobs`);
        const results = [];

        for (const job of jobs) {
            try {
                const result = await this.syncJobToCalendars(job, 'create');
                results.push({
                    jobId: job.id,
                    success: true,
                    result
                });
            } catch (error) {
                console.error(`Failed to sync job ${job.id}:`, error);
                results.push({
                    jobId: job.id,
                    success: false,
                    error: error.message
                });
            }
        }

        console.log(`📅 Bulk sync completed: ${results.filter(r => r.success).length}/${results.length} successful`);
        return results;
    }

    // Worker availability sync
    async syncWorkerAvailability(workerId, availability) {
        try {
            const availabilityEvents = availability.map(slot => ({
                title: `Available - GO HAM PRO`,
                description: `Available for pressure washing services\nWorker: ${slot.workerName}`,
                startTime: slot.startTime,
                endTime: slot.endTime,
                location: slot.zone || 'Service Area',
                metadata: {
                    type: 'availability',
                    workerId,
                    source: 'goham_pro_availability'
                }
            }));

            const results = [];
            for (const event of availabilityEvents) {
                const result = await this.syncToAllProviders(event, 'create');
                results.push(result);
            }

            return {
                success: true,
                syncedSlots: results.length,
                results
            };

        } catch (error) {
            throw new Error(`Availability sync failed: ${error.message}`);
        }
    }

    // Recurring appointment management
    async createRecurringJob(recurringJobData) {
        const { pattern, endDate, jobTemplate } = recurringJobData;

        try {
            const occurrences = this.generateRecurringDates(pattern, endDate);
            const events = [];

            for (const date of occurrences) {
                const jobData = {
                    ...jobTemplate,
                    date: date.toISOString().split('T')[0],
                    id: `${jobTemplate.id}_${date.getTime()}`
                };

                const calendarEvent = this.createCalendarEvent(jobData);
                calendarEvent.recurrence = pattern;
                
                events.push(calendarEvent);
            }

            // Create recurring events in all providers
            const results = await Promise.all(
                events.map(event => this.syncToAllProviders(event, 'create'))
            );

            return {
                success: true,
                recurringJobId: recurringJobData.id,
                occurrences: events.length,
                results
            };

        } catch (error) {
            throw new Error(`Recurring job creation failed: ${error.message}`);
        }
    }

    // Calendar conflict detection
    async checkScheduleConflicts(jobData) {
        try {
            const startTime = new Date(`${jobData.date}T${jobData.time}`);
            const endTime = new Date(startTime.getTime() + this.getServiceDuration(jobData.serviceType) * 60000);

            const conflicts = {};

            // Check conflicts in each provider
            for (const [provider, client] of Object.entries(this.providers)) {
                if (!client) continue;

                try {
                    const events = await this.getEventsInTimeRange(provider, startTime, endTime);
                    const conflictingEvents = events.filter(event => 
                        this.eventsOverlap(event, { start: startTime, end: endTime })
                    );

                    conflicts[provider] = conflictingEvents;
                } catch (error) {
                    console.error(`Conflict check failed for ${provider}:`, error);
                    conflicts[provider] = [];
                }
            }

            const hasConflicts = Object.values(conflicts).some(providerConflicts => 
                providerConflicts.length > 0
            );

            return {
                hasConflicts,
                conflicts,
                suggestions: hasConflicts ? this.generateAlternativeSlots(jobData) : []
            };

        } catch (error) {
            throw new Error(`Conflict detection failed: ${error.message}`);
        }
    }

    // Automatic sync management
    startAutoSync(intervalMinutes = 15) {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(async () => {
            try {
                await this.performIncrementalSync();
            } catch (error) {
                console.error('Auto sync failed:', error);
            }
        }, intervalMinutes * 60 * 1000);

        console.log(`🔄 Auto sync started (every ${intervalMinutes} minutes)`);
    }

    async performIncrementalSync() {
        try {
            const lastSync = this.lastSyncTime || new Date(Date.now() - 24 * 60 * 60 * 1000);
            const changedJobs = await this.getJobsChangedSince(lastSync);

            if (changedJobs.length === 0) {
                console.log('📅 No changes detected, sync skipped');
                return;
            }

            console.log(`📅 Syncing ${changedJobs.length} changed jobs`);

            for (const job of changedJobs) {
                const action = job.status === 'cancelled' ? 'delete' : 
                              job.calendarEventId ? 'update' : 'create';
                
                await this.syncJobToCalendars(job, action);
            }

            this.lastSyncTime = new Date();
            console.log('✅ Incremental sync completed');

        } catch (error) {
            console.error('❌ Incremental sync failed:', error);
        }
    }

    // Utility methods
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

    createICalEvent(eventData) {
        return `BEGIN:VEVENT
UID:${eventData.metadata.jobId}@gohampro.com
DTSTART:${this.formatICalDate(eventData.startTime)}
DTEND:${this.formatICalDate(eventData.endTime)}
SUMMARY:${eventData.title}
DESCRIPTION:${eventData.description}
LOCATION:${eventData.location}
STATUS:CONFIRMED
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Job reminder
TRIGGER:-PT60M
END:VALARM
END:VEVENT`;
    }

    formatICalDate(dateString) {
        return new Date(dateString).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    eventsOverlap(event1, event2) {
        const start1 = new Date(event1.start);
        const end1 = new Date(event1.end);
        const start2 = new Date(event2.start);
        const end2 = new Date(event2.end);

        return start1 < end2 && start2 < end1;
    }

    generateRecurringDates(pattern, endDate) {
        const dates = [];
        const start = new Date(pattern.startDate);
        const end = new Date(endDate);

        let current = new Date(start);
        while (current <= end) {
            dates.push(new Date(current));
            
            switch (pattern.frequency) {
                case 'daily':
                    current.setDate(current.getDate() + pattern.interval);
                    break;
                case 'weekly':
                    current.setDate(current.getDate() + (7 * pattern.interval));
                    break;
                case 'monthly':
                    current.setMonth(current.getMonth() + pattern.interval);
                    break;
            }
        }

        return dates;
    }

    // Cleanup and management
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('🛑 Auto sync stopped');
        }
    }

    async cleanup() {
        this.stopAutoSync();
        
        // Disconnect from all providers
        for (const [provider, client] of Object.entries(this.providers)) {
            if (client && client.disconnect) {
                await client.disconnect();
            }
        }

        console.log('🧹 Calendar sync service cleaned up');
    }

    // Server communication methods
    async updateJobWithCalendarIds(jobId, calendarResults) {
        try {
            await fetch(`/api/jobs/${jobId}/calendar-ids`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ calendarResults })
            });
        } catch (error) {
            console.error('Failed to update job with calendar IDs:', error);
        }
    }

    async getJobsChangedSince(timestamp) {
        try {
            const response = await fetch(`/api/jobs/changed?since=${timestamp.toISOString()}`);
            return await response.json();
        } catch (error) {
            console.error('Failed to get changed jobs:', error);
            return [];
        }
    }
}

export default CalendarSyncService;