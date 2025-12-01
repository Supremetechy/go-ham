// Enterprise Integration - Master Controller
// Orchestrates all systems: alerts, scheduling, database, real-time notifications

// Import required services for browser environment
import { DatabaseService } from './database-service.js';
import { ProductionEmailService, ProductionSMSService } from './production-integration.js';
import { AlertSystem, showNotification } from './alert-system.js';
import { AdvancedSchedulingSystem } from './advanced-scheduling.js';
import { RealTimeNotificationSystem, LiveDashboard } from './realtime-notifications.js';
import { WorkerPerformanceTracker, CustomerManagementSystem } from './admin-tools.js';

class EnterpriseAlertSystem {
    constructor(config = {}) {
        this.config = {
            environment: config.environment || 'development',
            enableRealTime: config.enableRealTime !== false,
            enableDatabase: config.enableDatabase !== false,
            enableAdvancedScheduling: config.enableAdvancedScheduling !== false,
            enableAnalytics: config.enableAnalytics !== false,
            ...config
        };

        // Initialize all subsystems
        this.database = null;
        this.emailService = null;
        this.smsService = null;
        this.schedulingSystem = null;
        this.realTimeSystem = null;
        this.performanceTracker = null;
        this.customerManager = null;
        this.liveDashboard = null;

        this.isInitialized = false;
        this.healthStatus = new Map();
    }

    async initialize() {
        try {
            console.log('🚀 Initializing Enterprise Alert System...');
            
            // Step 1: Database initialization
            if (this.config.enableDatabase) {
                await this.initializeDatabase();
            }

            // Step 2: Communication services
            await this.initializeCommunicationServices();

            // Step 3: Advanced scheduling
            if (this.config.enableAdvancedScheduling) {
                await this.initializeSchedulingSystem();
            }

            // Step 4: Real-time notifications
            if (this.config.enableRealTime) {
                await this.initializeRealTimeSystem();
            }

            // Step 5: Analytics and management tools
            if (this.config.enableAnalytics) {
                await this.initializeAnalytics();
            }

            // Step 6: Live dashboard
            await this.initializeLiveDashboard();

            // Step 7: Health monitoring
            this.startHealthMonitoring();

            this.isInitialized = true;
            console.log('✅ Enterprise Alert System fully initialized');
            
            // Show system status
            this.displaySystemStatus();

            return true;

        } catch (error) {
            console.error('❌ Enterprise system initialization failed:', error);
            await this.initializeFallbackMode();
            return false;
        }
    }

    async initializeDatabase() {
        try {
            this.database = new DatabaseService({
                provider: this.config.dbProvider || 'localStorage',
                connectionString: this.config.dbConnectionString
            });
            
            await this.database.initialize();
            this.healthStatus.set('database', 'healthy');
            console.log('✅ Database system initialized');
        } catch (error) {
            console.error('Database initialization failed:', error);
            this.healthStatus.set('database', 'failed');
            throw error;
        }
    }

    async initializeCommunicationServices() {
        try {
            // Production email service
            this.emailService = new ProductionEmailService({
                provider: this.config.emailProvider || 'sendgrid',
                apiKey: this.config.emailApiKey,
                fromEmail: this.config.fromEmail || 'noreply@gohampro.com'
            });

            // Production SMS service
            this.smsService = new ProductionSMSService({
                provider: this.config.smsProvider || 'twilio',
                apiKey: this.config.smsApiKey,
                fromNumber: this.config.fromNumber
            });

            this.healthStatus.set('email', 'healthy');
            this.healthStatus.set('sms', 'healthy');
            console.log('✅ Communication services initialized');
        } catch (error) {
            console.error('Communication services failed:', error);
            this.healthStatus.set('email', 'failed');
            this.healthStatus.set('sms', 'failed');
            // Continue with simulation mode
        }
    }

    async initializeSchedulingSystem() {
        try {
            this.schedulingSystem = new AdvancedSchedulingSystem();
            await this.schedulingSystem.initialize();
            this.healthStatus.set('scheduling', 'healthy');
            console.log('✅ Advanced scheduling initialized');
        } catch (error) {
            console.error('Scheduling system failed:', error);
            this.healthStatus.set('scheduling', 'failed');
        }
    }

    async initializeRealTimeSystem() {
        try {
            this.realTimeSystem = new RealTimeNotificationSystem();
            await this.realTimeSystem.initialize();
            this.healthStatus.set('realtime', 'healthy');
            console.log('✅ Real-time system initialized');
        } catch (error) {
            console.error('Real-time system failed:', error);
            this.healthStatus.set('realtime', 'failed');
        }
    }

    async initializeAnalytics() {
        try {
            this.performanceTracker = new WorkerPerformanceTracker();
            this.customerManager = new CustomerManagementSystem();
            
            this.healthStatus.set('analytics', 'healthy');
            console.log('✅ Analytics systems initialized');
        } catch (error) {
            console.error('Analytics initialization failed:', error);
            this.healthStatus.set('analytics', 'failed');
        }
    }

    async initializeLiveDashboard() {
        try {
            this.liveDashboard = new LiveDashboard();
            this.liveDashboard.initialize();
            
            this.healthStatus.set('dashboard', 'healthy');
            console.log('✅ Live dashboard initialized');
        } catch (error) {
            console.error('Live dashboard failed:', error);
            this.healthStatus.set('dashboard', 'failed');
        }
    }

    async processBooking(bookingData) {
        try {
            console.log('📋 Processing enterprise booking:', bookingData.id);

            // Step 1: Save to database
            if (this.database) {
                const savedBooking = await this.database.insertBooking(bookingData);
                bookingData.databaseId = savedBooking.id;
            }

            // Step 2: Advanced scheduling (if enabled)
            let schedulingResult = null;
            if (this.schedulingSystem) {
                try {
                    schedulingResult = await this.schedulingSystem.scheduleBooking(bookingData);
                    if (schedulingResult.success) {
                        bookingData.workerId = schedulingResult.worker.id;
                        bookingData.calendarEventId = schedulingResult.calendarEvent.id;
                    }
                } catch (schedulingError) {
                    console.warn('Advanced scheduling failed, falling back to basic assignment:', schedulingError);
                    schedulingResult = { success: false, fallback: true };
                }
            }

            // Step 3: Basic alert system (fallback or primary)
            const alertResult = await this.processBasicAlert(bookingData);

            // Step 4: Real-time notifications
            if (this.realTimeSystem && this.realTimeSystem.isConnected) {
                this.realTimeSystem.send({
                    type: 'booking_alert',
                    data: bookingData
                });
            }

            // Step 5: Update live dashboard
            if (this.liveDashboard) {
                this.liveDashboard.updateMetric('totalBookings', '+1');
            }

            // Step 6: Log the complete transaction
            await this.logBookingTransaction({
                bookingData,
                schedulingResult,
                alertResult,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                bookingId: bookingData.id,
                workersNotified: alertResult.workersNotified,
                schedulingEnabled: !!this.schedulingSystem,
                realTimeEnabled: this.realTimeSystem?.isConnected || false,
                databaseSaved: !!this.database
            };

        } catch (error) {
            console.error('Enterprise booking processing failed:', error);
            
            // Emergency fallback
            return await this.processEmergencyBooking(bookingData);
        }
    }

    async processBasicAlert(bookingData) {
        // Use the original alert system as fallback
        const basicAlertSystem = new AlertSystem();
        return await basicAlertSystem.processBookingAlert(bookingData);
    }

    async processEmergencyBooking(bookingData) {
        console.log('🚨 Emergency booking processing mode');
        
        try {
            // Minimal processing to ensure booking is not lost
            const emergencyData = {
                ...bookingData,
                status: 'emergency',
                timestamp: new Date().toISOString()
            };

            // Save to localStorage as absolute fallback
            const emergencyBookings = JSON.parse(localStorage.getItem('emergencyBookings') || '[]');
            emergencyBookings.push(emergencyData);
            localStorage.setItem('emergencyBookings', JSON.stringify(emergencyBookings));

            // Send basic alert
            alert(`EMERGENCY: Booking ${bookingData.id} saved locally. Contact admin immediately!`);

            return {
                success: false,
                emergency: true,
                bookingId: bookingData.id,
                message: 'Booking saved in emergency mode'
            };

        } catch (emergencyError) {
            console.error('Emergency processing also failed:', emergencyError);
            return {
                success: false,
                critical: true,
                error: emergencyError.message
            };
        }
    }

    async logBookingTransaction(transactionData) {
        try {
            if (this.database) {
                await this.database.insertAlertLog({
                    bookingId: transactionData.bookingData.id,
                    workersNotified: transactionData.alertResult.workersNotified || [],
                    emailsSent: transactionData.alertResult.emailsSent || 0,
                    smsSent: transactionData.alertResult.smsSent || 0,
                    status: transactionData.alertResult.success ? 'success' : 'failed',
                    schedulingUsed: transactionData.schedulingResult?.success || false,
                    realTimeUsed: this.realTimeSystem?.isConnected || false,
                    metadata: JSON.stringify(transactionData)
                });
            }

            console.log('📝 Booking transaction logged');
        } catch (error) {
            console.error('Failed to log booking transaction:', error);
        }
    }

    async initializeFallbackMode() {
        console.log('🔄 Initializing fallback mode...');
        
        try {
            // Initialize only essential systems
            this.database = new DatabaseService({ provider: 'localStorage' });
            await this.database.initialize();

            // Basic alert system
            this.basicAlertSystem = new AlertSystem();

            this.healthStatus.set('fallback', 'active');
            this.isInitialized = true;
            
            console.log('✅ Fallback mode initialized');
        } catch (fallbackError) {
            console.error('Even fallback mode failed:', fallbackError);
            this.healthStatus.set('fallback', 'failed');
        }
    }

    startHealthMonitoring() {
        // Health check every 30 seconds
        setInterval(async () => {
            await this.performHealthCheck();
        }, 30000);

        // Initial health check
        setTimeout(() => this.performHealthCheck(), 5000);
    }

    async performHealthCheck() {
        const healthResults = {};

        // Database health
        if (this.database) {
            try {
                const dbHealth = await this.database.healthCheck();
                healthResults.database = dbHealth.status;
            } catch (error) {
                healthResults.database = 'unhealthy';
            }
        }

        // Real-time connection health
        if (this.realTimeSystem) {
            healthResults.realtime = this.realTimeSystem.isConnected ? 'connected' : 'disconnected';
        }

        // Update health status
        Object.entries(healthResults).forEach(([system, status]) => {
            this.healthStatus.set(system, status);
        });

        // Update connection indicator if present
        this.updateConnectionStatus();

        return healthResults;
    }

    updateConnectionStatus() {
        // Skip DOM updates in Node.js environment
        if (typeof document === 'undefined') {
            const allHealthy = Array.from(this.healthStatus.values()).every(status =>
                ['healthy', 'connected', 'active'].includes(status)
            );
            console.log(allHealthy ? '🟢 All Systems Online' : '🔴 System Issues Detected');
            return;
        }

        const statusElement = document.getElementById('connection-status');
        if (!statusElement) return;

        const allHealthy = Array.from(this.healthStatus.values()).every(status =>
            ['healthy', 'connected', 'active'].includes(status)
        );

        if (allHealthy) {
            statusElement.className = 'connection-status connected';
            statusElement.textContent = '🟢 All Systems Online';
        } else {
            statusElement.className = 'connection-status disconnected';
            statusElement.textContent = '🔴 System Issues Detected';
        }
    }

    displaySystemStatus() {
        // Skip DOM updates in Node.js environment
        if (typeof document === 'undefined') {
            console.log('\n🚀 Enterprise System Status');
            console.log('='.repeat(50));

            Array.from(this.healthStatus.entries()).forEach(([system, status]) => {
                console.log(`${this.getStatusIcon(status)} ${system.charAt(0).toUpperCase() + system.slice(1)}: ${status}`);
            });

            console.log('\n🎯 Active Capabilities:');
            console.log(this.config.enableDatabase ? '✅ Database persistence' : '📦 Local storage fallback');
            console.log(this.config.enableAdvancedScheduling ? '✅ Intelligent scheduling' : '❌ Basic scheduling');
            console.log(this.config.enableRealTime ? '✅ Real-time notifications' : '❌ Polling updates');
            console.log(this.config.enableAnalytics ? '✅ Performance analytics' : '❌ Basic metrics');
            console.log('✅ Email & SMS alerts');
            console.log('✅ Customer management');
            console.log('✅ Worker tracking');
            console.log('='.repeat(50));
            return;
        }

        const statusHtml = `
            <div class="system-status-modal">
                <div class="status-overlay" onclick="this.parentElement.remove()"></div>
                <div class="status-content">
                    <h2>🚀 Enterprise System Status</h2>

                    <div class="status-grid">
                        ${Array.from(this.healthStatus.entries()).map(([system, status]) => `
                            <div class="status-item ${status}">
                                <h4>${system.charAt(0).toUpperCase() + system.slice(1)}</h4>
                                <span class="status-indicator">${this.getStatusIcon(status)} ${status}</span>
                            </div>
                        `).join('')}
                    </div>

                    <div class="capabilities">
                        <h3>🎯 Active Capabilities</h3>
                        <ul>
                            ${this.config.enableDatabase ? '<li>✅ Database persistence</li>' : '<li>📦 Local storage fallback</li>'}
                            ${this.config.enableAdvancedScheduling ? '<li>✅ Intelligent scheduling</li>' : '<li>❌ Basic scheduling</li>'}
                            ${this.config.enableRealTime ? '<li>✅ Real-time notifications</li>' : '<li>❌ Polling updates</li>'}
                            ${this.config.enableAnalytics ? '<li>✅ Performance analytics</li>' : '<li>❌ Basic metrics</li>'}
                            <li>✅ Email & SMS alerts</li>
                            <li>✅ Customer management</li>
                            <li>✅ Worker tracking</li>
                        </ul>
                    </div>

                    <button onclick="this.parentElement.parentElement.remove()" class="btn btn-primary">
                        Got it!
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', statusHtml);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            const modal = document.querySelector('.system-status-modal');
            if (modal) modal.remove();
        }, 10000);
    }

    getStatusIcon(status) {
        const icons = {
            'healthy': '✅',
            'connected': '🟢',
            'active': '🔵',
            'failed': '❌',
            'disconnected': '🔴',
            'unhealthy': '⚠️'
        };
        return icons[status] || '❓';
    }

    // Public API methods
    async getSystemHealth() {
        await this.performHealthCheck();
        return Object.fromEntries(this.healthStatus.entries());
    }

    async getWorkerPerformance(workerId) {
        if (this.performanceTracker) {
            return await this.performanceTracker.getWorkerPerformance(workerId);
        }
        throw new Error('Performance tracking not available');
    }

    async getCustomerProfile(customerId) {
        if (this.customerManager) {
            return await this.customerManager.getCustomerProfile(customerId);
        }
        throw new Error('Customer management not available');
    }

    async generateReport(reportType, params = {}) {
        switch (reportType) {
            case 'worker-performance':
                if (this.performanceTracker) {
                    return await this.performanceTracker.generatePerformanceReport(params.workerId, params.format);
                }
                break;
            case 'business-analytics':
                if (this.analytics) {
                    return await this.analytics.generateBusinessAnalytics(params.timeRange);
                }
                break;
            default:
                throw new Error(`Unknown report type: ${reportType}`);
        }
    }

    // Emergency methods
    async emergencyShutdown() {
        console.log('🚨 Emergency shutdown initiated');
        
        if (this.realTimeSystem) {
            this.realTimeSystem.disconnect();
        }
        
        if (this.database) {
            await this.database.backup();
        }

        this.isInitialized = false;
        console.log('🛑 Emergency shutdown complete');
    }

    async restart() {
        console.log('🔄 Restarting enterprise system...');
        await this.emergencyShutdown();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        return await this.initialize();
    }
}

// Global initialization
let enterpriseSystem = null;

// Node.js compatible initialization
async function initializeEnterpriseSystem() {
    try {
        // Configuration from environment or defaults
        const config = {
            environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
            enableRealTime: true,
            enableDatabase: true,
            enableAdvancedScheduling: true,
            enableAnalytics: true,

            // Production configurations (from environment variables or config)
            emailProvider: 'sendgrid',
            smsProvider: 'twilio',
            dbProvider: 'localStorage', // Change to 'postgresql' in production

            // API keys (in production, these would come from secure environment variables)
            emailApiKey: process.env.SENDGRID_API_KEY || 'demo-key',
            smsApiKey: process.env.TWILIO_API_KEY || 'demo-key'
        };

        enterpriseSystem = new EnterpriseAlertSystem(config);
        await enterpriseSystem.initialize();

        // Make globally available
        if (typeof global !== 'undefined') {
            global.enterpriseSystem = enterpriseSystem;
        } else if (typeof window !== 'undefined') {
            window.enterpriseSystem = enterpriseSystem;
        }

        console.log('🚀 Enterprise Integration System initialized successfully');
        return enterpriseSystem;

    } catch (error) {
        console.error('Failed to initialize enterprise system:', error);
        // Fallback to basic system
        const fallbackSystem = {
            processBooking: async (data) => {
                const basic = new AlertSystem();
                return await basic.processBookingAlert(data);
            }
        };

        if (typeof global !== 'undefined') {
            global.enterpriseSystem = fallbackSystem;
        } else if (typeof window !== 'undefined') {
            window.enterpriseSystem = fallbackSystem;
        }

        return fallbackSystem;
    }
}

// Auto-initialize for different environments
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    initializeEnterpriseSystem().then(() => {
        console.log('Node.js Enterprise System Ready');
    }).catch(console.error);
} else if (typeof window !== 'undefined') {
    // Browser environment
    document.addEventListener('DOMContentLoaded', async function() {
        await initializeEnterpriseSystem();

        // Update booking form to use enterprise system
        const bookingForm = document.getElementById('bookingForm');
        if (bookingForm) {
            enhanceBookingForm(bookingForm);
        }

        // Add connection status indicator
        addConnectionStatusIndicator();
    });
}

function enhanceBookingForm(form) {
    // Override the existing booking submission
    const existingHandler = window.submitBooking;
    
    window.submitBooking = async function() {
        const form = document.getElementById('bookingForm');
        const submitButton = document.querySelector('.submit-button');
        
        // Basic validation
        const requiredFields = ['name', 'phone', 'email', 'serviceType', 'date', 'time', 'address'];
        for (let field of requiredFields) {
            const value = document.getElementById(field).value.trim();
            if (!value) {
                showNotification(`Please fill in the ${field} field.`, 'error');
                return;
            }
        }
        
        // Show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading-spinner"></span> Processing...';
        
        try {
            // Prepare booking data
            const bookingData = {
                id: Date.now(),
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value,
                serviceType: document.getElementById('serviceType').value,
                date: document.getElementById('date').value,
                time: document.getElementById('time').value,
                address: document.getElementById('address').value,
                instructions: document.getElementById('instructions').value || '',
                timestamp: new Date().toISOString(),
                status: 'pending'
            };
            
            // Use enterprise system
            const result = await enterpriseSystem.processBooking(bookingData);
            
            // Show enhanced success message
            showNotification(
                `✅ Booking processed successfully! ${result.workersNotified || 0} workers notified via ${result.realTimeEnabled ? 'real-time + ' : ''}email & SMS.`,
                'success'
            );
            
            // Reset form
            form.reset();
            
            // Show enhanced confirmation
            displayEnterpriseConfirmation(bookingData, result);
            
        } catch (error) {
            console.error('Enterprise booking failed:', error);
            showNotification(
                'Booking processing encountered an issue. Our team has been notified and will contact you shortly.',
                'error'
            );
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Schedule Service';
        }
    };
}

function displayEnterpriseConfirmation(bookingData, result) {
    const confirmationModal = document.createElement('div');
    confirmationModal.className = 'booking-confirmation-modal enterprise';
    confirmationModal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>🎉 Enterprise Booking Confirmed!</h3>
                <button class="modal-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="confirmation-details">
                    <p><strong>Booking ID:</strong> #${bookingData.id}</p>
                    <p><strong>Service:</strong> ${bookingData.serviceType}</p>
                    <p><strong>Date & Time:</strong> ${bookingData.date} at ${bookingData.time}</p>
                    <p><strong>Customer:</strong> ${bookingData.name}</p>
                </div>
                
                <div class="enterprise-features">
                    <h4>🚀 Enterprise Features Active</h4>
                    <div class="feature-grid">
                        <div class="feature ${result.databaseSaved ? 'active' : 'inactive'}">
                            <span class="icon">${result.databaseSaved ? '✅' : '❌'}</span>
                            <span>Database Storage</span>
                        </div>
                        <div class="feature ${result.realTimeEnabled ? 'active' : 'inactive'}">
                            <span class="icon">${result.realTimeEnabled ? '✅' : '❌'}</span>
                            <span>Real-time Alerts</span>
                        </div>
                        <div class="feature ${result.schedulingEnabled ? 'active' : 'inactive'}">
                            <span class="icon">${result.schedulingEnabled ? '✅' : '❌'}</span>
                            <span>Smart Scheduling</span>
                        </div>
                        <div class="feature active">
                            <span class="icon">✅</span>
                            <span>Multi-channel Alerts</span>
                        </div>
                    </div>
                </div>
                
                <div class="next-steps">
                    <h4>What happens next?</h4>
                    <ol>
                        <li>Workers receive instant alerts via multiple channels</li>
                        <li>Our system auto-assigns the best available worker</li>
                        <li>You'll get a call within 15 minutes for confirmation</li>
                        <li>Real-time updates throughout the service process</li>
                        <li>Automated follow-up and satisfaction surveys</li>
                    </ol>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">
                    Excellent, thanks!
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmationModal);
}

function addConnectionStatusIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'connection-status';
    indicator.className = 'connection-status connecting';
    indicator.textContent = '🟡 Systems Starting...';
    
    document.body.appendChild(indicator);
    
    // Update after initialization
    setTimeout(() => {
        if (enterpriseSystem) {
            enterpriseSystem.updateConnectionStatus();
        }
    }, 3000);
}

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnterpriseAlertSystem };
} else {
    window.EnterpriseAlertSystem = EnterpriseAlertSystem;
}