// Advanced Admin Tools - Worker Performance & Customer Management
// Comprehensive dashboard tools for business analytics and management

import { DatabaseService } from './database-service.js';
import  ProductionEmailService  from './services/email-service';
import  ProductionSMSService  from './services/sms-service';
import ReportGenerator from './services/report-generator';

class WorkerPerformanceTracker {
  
    constructor() {
        this.database = new DatabaseService();
        this.analytics = new AnalyticsEngine();
        this.reportGenerator = new ReportGenerator();

        this.performanceMetrics = {
            responseTime: { weight: 0.25, target: 15 }, // minutes
            customerSatisfaction: { weight: 0.30, target: 4.5 }, // out of 5
            jobCompletion: { weight: 0.20, target: 95 }, // percentage
            punctuality: { weight: 0.15, target: 90 }, // percentage on time
            revenue: { weight: 0.10, target: 1000 } // monthly target
        };
    }

    async getWorkerPerformance(workerId, timeRange = 30) {
        try {
            const rawData = await this.gatherWorkerData(workerId, timeRange);
            const metrics = this.calculatePerformanceMetrics(rawData);
            const score = this.calculateOverallScore(metrics);
            const insights = this.generateInsights(metrics, score);
            
            return {
                workerId,
                timeRange,
                metrics,
                overallScore: score,
                grade: this.getPerformanceGrade(score),
                insights,
                recommendations: this.generateRecommendations(metrics),
                trends: this.calculateTrends(workerId, timeRange)
            };
        } catch (error) {
            console.error('Error calculating worker performance:', error);
            throw error;
        }
    }

    async gatherWorkerData(workerId, days) {
        // Simulate gathering comprehensive worker data
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
        
        return {
            bookings: await this.database.getWorkerBookings(workerId, startDate, endDate),
            responses: await this.database.getWorkerResponses(workerId, startDate, endDate),
            reviews: await this.database.getWorkerReviews(workerId, startDate, endDate),
            timeTracking: await this.database.getWorkerTimeTracking(workerId, startDate, endDate),
            earnings: await this.database.getWorkerEarnings(workerId, startDate, endDate)
        };
    }

    calculatePerformanceMetrics(data) {
        const metrics = {};

        // Response Time Metric
        const avgResponseTime = data.responses.reduce((sum, r) => sum + r.responseTimeMinutes, 0) / data.responses.length;
        metrics.responseTime = {
            value: avgResponseTime || 0,
            score: Math.max(0, Math.min(100, 100 - (avgResponseTime - this.performanceMetrics.responseTime.target) * 2)),
            trend: this.calculateTrend(data.responses.map(r => r.responseTimeMinutes))
        };

        // Customer Satisfaction Metric
        const avgRating = data.reviews.reduce((sum, r) => sum + r.rating, 0) / data.reviews.length;
        metrics.customerSatisfaction = {
            value: avgRating || 0,
            score: (avgRating / 5) * 100,
            trend: this.calculateTrend(data.reviews.map(r => r.rating)),
            reviewCount: data.reviews.length
        };

        // Job Completion Metric
        const completedJobs = data.bookings.filter(b => b.status === 'completed').length;
        const completionRate = (completedJobs / data.bookings.length) * 100;
        metrics.jobCompletion = {
            value: completionRate || 0,
            score: Math.min(100, completionRate),
            trend: this.calculateTrend(data.bookings.map(b => b.status === 'completed' ? 100 : 0)),
            totalJobs: data.bookings.length,
            completedJobs
        };

        // Punctuality Metric
        const onTimeJobs = data.timeTracking.filter(t => t.arrivalDelay <= 5).length; // 5 min tolerance
        const punctualityRate = (onTimeJobs / data.timeTracking.length) * 100;
        metrics.punctuality = {
            value: punctualityRate || 0,
            score: Math.min(100, punctualityRate),
            trend: this.calculateTrend(data.timeTracking.map(t => t.arrivalDelay <= 5 ? 100 : 0)),
            avgDelay: data.timeTracking.reduce((sum, t) => sum + t.arrivalDelay, 0) / data.timeTracking.length
        };

        // Revenue Metric
        const totalRevenue = data.earnings.reduce((sum, e) => sum + e.amount, 0);
        const monthlyRevenue = totalRevenue / (data.earnings.length / 30); // Approximate monthly
        metrics.revenue = {
            value: totalRevenue,
            monthlyAverage: monthlyRevenue,
            score: Math.min(100, (monthlyRevenue / this.performanceMetrics.revenue.target) * 100),
            trend: this.calculateTrend(data.earnings.map(e => e.amount))
        };

        return metrics;
    }

    calculateOverallScore(metrics) {
        let totalScore = 0;
        let totalWeight = 0;

        for (const [metricName, metricData] of Object.entries(metrics)) {
            if (this.performanceMetrics[metricName]) {
                const weight = this.performanceMetrics[metricName].weight;
                totalScore += metricData.score * weight;
                totalWeight += weight;
            }
        }

        return Math.round(totalScore / totalWeight);
    }

    getPerformanceGrade(score) {
        if (score >= 90) return { grade: 'A+', color: '#10b981', description: 'Exceptional' };
        if (score >= 80) return { grade: 'A', color: '#059669', description: 'Excellent' };
        if (score >= 70) return { grade: 'B', color: '#3b82f6', description: 'Good' };
        if (score >= 60) return { grade: 'C', color: '#f59e0b', description: 'Satisfactory' };
        if (score >= 50) return { grade: 'D', color: '#ef4444', description: 'Needs Improvement' };
        return { grade: 'F', color: '#dc2626', description: 'Unsatisfactory' };
    }

    generateInsights(metrics, score) {
        const insights = [];

        // Response Time Insights
        if (metrics.responseTime.value > 20) {
            insights.push({
                type: 'warning',
                category: 'Response Time',
                message: `Average response time of ${metrics.responseTime.value.toFixed(1)} minutes exceeds target of ${this.performanceMetrics.responseTime.target} minutes`,
                action: 'Consider mobile alerts and response training'
            });
        }

        // Customer Satisfaction Insights
        if (metrics.customerSatisfaction.value < 4.0) {
            insights.push({
                type: 'alert',
                category: 'Customer Satisfaction',
                message: `Customer rating of ${metrics.customerSatisfaction.value.toFixed(1)}/5 is below expectations`,
                action: 'Review customer feedback and provide additional training'
            });
        }

        // Revenue Insights
        if (metrics.revenue.trend < 0) {
            insights.push({
                type: 'info',
                category: 'Revenue',
                message: 'Revenue trend is declining',
                action: 'Investigate causes and implement improvement strategies'
            });
        }

        // Punctuality Insights
        if (metrics.punctuality.value < 85) {
            insights.push({
                type: 'warning',
                category: 'Punctuality',
                message: `On-time rate of ${metrics.punctuality.value.toFixed(1)}% needs improvement`,
                action: 'Focus on time management and route optimization'
            });
        }

        return insights;
    }

    generateRecommendations(metrics) {
        const recommendations = [];

        // Performance-based recommendations
        if (metrics.responseTime.score < 80) {
            recommendations.push({
                priority: 'high',
                title: 'Improve Response Time',
                description: 'Set up push notifications and response time goals',
                expectedImpact: '+15 points overall score'
            });
        }

        if (metrics.customerSatisfaction.score < 85) {
            recommendations.push({
                priority: 'critical',
                title: 'Customer Service Training',
                description: 'Enroll in customer service excellence program',
                expectedImpact: '+20 points overall score'
            });
        }

        if (metrics.revenue.trend < 0) {
            recommendations.push({
                priority: 'medium',
                title: 'Revenue Optimization',
                description: 'Focus on higher-value services and upselling',
                expectedImpact: '+10% monthly revenue'
            });
        }

        return recommendations;
    }

    calculateTrend(values) {
        if (values.length < 2) return 0;
        
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        return ((secondAvg - firstAvg) / firstAvg) * 100;
    }

    async generatePerformanceReport(workerId, format = 'html') {
        const performance = await this.getWorkerPerformance(workerId);
        
        if (format === 'pdf') {
            return this.reportGenerator.generatePDFReport(performance);
        } else {
            return this.generateHTMLReport(performance);
        }
    }

    generateHTMLReport(performance) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Worker Performance Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 20px; border-radius: 10px; }
                .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
                .metric-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .score { font-size: 2em; font-weight: bold; color: ${performance.grade.color}; }
                .trend { color: ${performance.metrics.revenue.trend >= 0 ? '#10b981' : '#ef4444'}; }
                .insights { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .recommendation { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Worker Performance Report</h1>
                <p>Worker ID: ${performance.workerId} | Period: Last ${performance.timeRange} days</p>
                <div class="score">Overall Score: ${performance.overallScore}/100 (${performance.grade.grade})</div>
            </div>

            <div class="metrics-grid">
                ${Object.entries(performance.metrics).map(([key, metric]) => `
                    <div class="metric-card">
                        <h3>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
                        <div class="score">${metric.score.toFixed(1)}</div>
                        <p>Value: ${metric.value.toFixed(1)}</p>
                        <p class="trend">Trend: ${metric.trend >= 0 ? '↗️' : '↘️'} ${metric.trend.toFixed(1)}%</p>
                    </div>
                `).join('')}
            </div>

            <div class="insights">
                <h2>Performance Insights</h2>
                ${performance.insights.map(insight => `
                    <div class="insight-item">
                        <strong>${insight.category}:</strong> ${insight.message}
                        <br><em>Action: ${insight.action}</em>
                    </div>
                `).join('')}
            </div>

            <div class="recommendations">
                <h2>Recommendations</h2>
                ${performance.recommendations.map(rec => `
                    <div class="recommendation">
                        <strong>${rec.title}</strong> (${rec.priority} priority)
                        <br>${rec.description}
                        <br><em>Expected Impact: ${rec.expectedImpact}</em>
                    </div>
                `).join('')}
            </div>
        </body>
        </html>
        `;
    }
}

class CustomerManagementSystem {
    constructor() {
        this.database = new DatabaseService();
        this.emailService = new ProductionEmailService();
        this.smsService = new ProductionSMSService();
        this.segmentation = new CustomerSegmentation();
    }

    async getCustomerProfile(customerId) {
        const customer = await this.database.getCustomer(customerId);
        const bookings = await this.database.getCustomerBookings(customerId);
        const payments = await this.database.getCustomerPayments(customerId);
        const communications = await this.database.getCustomerCommunications(customerId);

        return {
            ...customer,
            stats: this.calculateCustomerStats(bookings, payments),
            bookingHistory: bookings,
            paymentHistory: payments,
            communicationHistory: communications,
            segment: this.segmentation.classifyCustomer(customer, bookings),
            riskFactors: this.analyzeRiskFactors(customer, bookings, payments),
            opportunities: this.identifyOpportunities(customer, bookings)
        };
    }

    calculateCustomerStats(bookings, payments) {
        return {
            totalBookings: bookings.length,
            totalSpent: payments.reduce((sum, p) => sum + p.amount, 0),
            averageBookingValue: payments.reduce((sum, p) => sum + p.amount, 0) / payments.length || 0,
            lastBookingDate: bookings.length > 0 ? Math.max(...bookings.map(b => new Date(b.date))) : null,
            favoriteServices: this.getMostUsedServices(bookings),
            cancelationRate: (bookings.filter(b => b.status === 'cancelled').length / bookings.length) * 100 || 0,
            customerSince: bookings.length > 0 ? Math.min(...bookings.map(b => new Date(b.date))) : null
        };
    }

    getMostUsedServices(bookings) {
        const serviceCount = {};
        bookings.forEach(booking => {
            serviceCount[booking.serviceType] = (serviceCount[booking.serviceType] || 0) + 1;
        });
        
        return Object.entries(serviceCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([service, count]) => ({ service, count }));
    }

    analyzeRiskFactors(customer, bookings, payments) {
        const risks = [];

        // Payment delays
        const latePayments = payments.filter(p => p.daysPastDue > 0);
        if (latePayments.length > 0) {
            risks.push({
                type: 'payment',
                severity: 'medium',
                description: `${latePayments.length} late payments`,
                recommendation: 'Setup payment reminders'
            });
        }

        // High cancellation rate
        const cancelRate = (bookings.filter(b => b.status === 'cancelled').length / bookings.length) * 100;
        if (cancelRate > 20) {
            risks.push({
                type: 'retention',
                severity: 'high',
                description: `${cancelRate.toFixed(1)}% cancellation rate`,
                recommendation: 'Investigate satisfaction issues'
            });
        }

        // Long time since last booking
        const daysSinceLastBooking = bookings.length > 0 ? 
            (new Date() - Math.max(...bookings.map(b => new Date(b.date)))) / (1000 * 60 * 60 * 24) : 0;
        
        if (daysSinceLastBooking > 90) {
            risks.push({
                type: 'churn',
                severity: 'high',
                description: `${Math.round(daysSinceLastBooking)} days since last booking`,
                recommendation: 'Send re-engagement campaign'
            });
        }

        return risks;
    }

    identifyOpportunities(customer, bookings) {
        const opportunities = [];

        // Upselling opportunities
        const usedServices = [...new Set(bookings.map(b => b.serviceType))];
        const allServices = ['house-washing', 'mobile-detailing', 'gutter-cleaning', 'commercial-washing'];
        const unusedServices = allServices.filter(s => !usedServices.includes(s));

        if (unusedServices.length > 0) {
            opportunities.push({
                type: 'upsell',
                value: 'medium',
                description: `Hasn't tried: ${unusedServices.join(', ')}`,
                action: 'Send targeted service promotions'
            });
        }

        // Seasonal opportunities
        const currentMonth = new Date().getMonth();
        if (currentMonth >= 2 && currentMonth <= 5) { // Spring
            opportunities.push({
                type: 'seasonal',
                value: 'high',
                description: 'Spring cleaning season',
                action: 'Promote house washing and gutter cleaning'
            });
        }

        // Loyalty program
        if (bookings.length >= 5) {
            opportunities.push({
                type: 'loyalty',
                value: 'high',
                description: 'Eligible for VIP program',
                action: 'Invite to loyalty program with benefits'
            });
        }

        return opportunities;
    }

    async generateCustomerCampaign(segmentCriteria, campaignType) {
        const customers = await this.database.getCustomersBySegment(segmentCriteria);
        const campaign = {
            id: 'camp_' + Date.now(),
            type: campaignType,
            targetCustomers: customers.length,
            createdAt: new Date(),
            status: 'draft'
        };

        switch (campaignType ) { 
            case 'retention':
                campaign.subject = 'We Miss You! Special Offer Inside';
                campaign.content = this.generateRetentionEmail();
                break;
            case 'upsell':
                campaign.subject = 'New Services Perfect For Your Property';
                campaign.content = this.generateUpsellEmail();
                break;
            case 'loyalty':
                campaign.subject = 'Welcome to GO HAM PRO VIP Program!';
                break;

            case 'seasonal':
                campaign.subject = 'Spring is Here! Time for Deep Cleaning';
                campaign.content = this.generateSeasonalEmail();
                break;

            default:
                campaign.subject = 'Untitled Campaign';
                campaign.content = 'No content provided';
                break;
        }
        await this.database.saveCampaign(campaign);
        await this.sendBulkCampaign(campaign.id);

        return campaign;
    }

    generateRetentionEmail() {
        return `
        <h2>We Miss You! 💙</h2>
        <p>Hi [CUSTOMER_NAME],</p>
        <p>It's been a while since your last GO HAM PRO service, and we wanted to reach out!</p>
        <p>As a valued customer, we'd love to welcome you back with a special offer:</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
            <h3 style="color: #10b981;">25% OFF Your Next Service!</h3>
            <p>Use code: <strong>WELCOME_BACK</strong></p>
            <p>Valid for any service • Expires in 30 days</p>
        </div>
        
        <p>Book now and let us make your property shine again!</p>
        `;
    }

    generateUpsellEmail() {
        return `
        <h2>Perfect Services for Your Property 🏠</h2>
        <p>Hi [CUSTOMER_NAME],</p>
        <p>Based on your previous [PREVIOUS_SERVICES], we thought you might be interested in these complementary services:</p>
        
        <div style="display: grid; gap: 15px; margin: 20px 0;">
            <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
                <h4>Gutter Cleaning - $149</h4>
                <p>Complete cleaning and inspection to protect your home</p>
            </div>
            <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
                <h4>Driveway Cleaning - $119</h4>
                <p>Remove stains and restore your driveway's appearance</p>
            </div>
        </div>
        
        <p><strong>Bundle Discount:</strong> Save 15% when you book 2 or more services!</p>
        `;
    }

    async sendBulkCampaign(campaignId) {
        const campaign = await this.database.getCampaign(campaignId);
        const customers = await this.database.getCampaignCustomers(campaignId);
        
        const results = {
            sent: 0,
            failed: 0,
            errors: []
        };

        for (const customer of customers) {
            try {
                const personalizedContent = this.personalizeContent(campaign.content, customer);
                
                await this.emailService.sendEmail({
                    to: customer.email,
                    subject: campaign.subject,
                    html: personalizedContent
                });

                results.sent++;
                
                // Optional SMS for high-value customers
                if (customer.segment === 'vip') {
                    const smsContent = this.generateSMSVersion(campaign.subject);
                    await this.smsService.sendSMS(customer.phone, smsContent);
                }

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                results.failed++;
                results.errors.push(`${customer.email}: ${error.message}`);
            }
        }

        await this.database.updateCampaignResults(campaignId, results);
        return results;
    }

    personalizeContent(content, customer) {
        return content
            .replace(/\[CUSTOMER_NAME\]/g, customer.name)
            .replace(/\[PREVIOUS_SERVICES\]/g, customer.favoriteServices?.join(', ') || 'services');
    }

    generateSMSVersion(subject) {
        return `${subject} Check your email for exclusive offers! - GO HAM PRO`;
    }
}

class CustomerSegmentation {
    classifyCustomer(customer, bookings) {
        const totalSpent = bookings.reduce((sum, b) => sum + (b.totalCost || 0), 0);
        const bookingCount = bookings.length;
        const avgBookingValue = totalSpent / bookingCount || 0;
        const daysSinceLastBooking = bookings.length > 0 ? 
            (new Date() - Math.max(...bookings.map(b => new Date(b.date)))) / (1000 * 60 * 60 * 24) : 999;

        // VIP Customers
        if (totalSpent > 1000 || bookingCount > 10) {
            return {
                segment: 'vip',
                description: 'High-value loyal customer',
                color: '#10b981',
                benefits: ['Priority scheduling', '15% discount', 'Dedicated support']
            };
        }

        // Frequent Customers
        if (bookingCount >= 5 && daysSinceLastBooking < 90) {
            return {
                segment: 'frequent',
                description: 'Regular customer',
                color: '#3b82f6',
                benefits: ['10% discount', 'Priority booking']
            };
        }

        // At-Risk Customers
        if (bookingCount >= 3 && daysSinceLastBooking > 180) {
            return {
                segment: 'at-risk',
                description: 'May churn without intervention',
                color: '#f59e0b',
                benefits: ['Win-back offers', 'Special attention']
            };
        }

        // New Customers
        if (bookingCount <= 2) {
            return {
                segment: 'new',
                description: 'New or trial customer',
                color: '#8b5cf6',
                benefits: ['Welcome discount', 'Onboarding support']
            };
        }

        // Standard Customers
        return {
            segment: 'standard',
            description: 'Regular customer',
            color: '#6b7280',
            benefits: ['Standard pricing', 'Regular service']
        };
    }
}

class AnalyticsEngine {
    constructor() {
        this.database = new DatabaseService();
    }

    async generateBusinessAnalytics(timeRange = 30) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - timeRange * 24 * 60 * 60 * 1000);
        
        const [bookings, workers, customers, revenue] = await Promise.all([
            this.database.getBookingsInRange(startDate, endDate),
            this.database.getAllWorkers(),
            this.database.getAllCustomers(),
            this.database.getRevenueInRange(startDate, endDate)
        ]);

        return {
            overview: this.calculateOverviewMetrics(bookings, workers, customers, revenue),
            serviceAnalysis: this.analyzeServices(bookings),
            workerAnalysis: this.analyzeWorkerPerformance(workers, bookings),
            customerAnalysis: this.analyzeCustomers(customers, bookings),
            revenueAnalysis: this.analyzeRevenue(revenue),
            trends: this.calculateTrends(bookings, timeRange)
        };
    }

    calculateOverviewMetrics(bookings, workers, customers, revenue) {
        return {
            totalBookings: bookings.length,
            totalRevenue: revenue.reduce((sum, r) => sum + r.amount, 0),
            activeWorkers: workers.filter(w => w.isActive).length,
            totalCustomers: customers.length,
            averageBookingValue: revenue.reduce((sum, r) => sum + r.amount, 0) / bookings.length || 0,
            completionRate: (bookings.filter(b => b.status === 'completed').length / bookings.length) * 100 || 0,
            customerSatisfaction: bookings.reduce((sum, b) => sum + (b.rating || 0), 0) / bookings.length || 0
        };
    }

    analyzeServices(bookings) {
        const serviceStats = {};
        
        bookings.forEach(booking => {
            const service = booking.serviceType;
            if (!serviceStats[service]) {
                serviceStats[service] = {
                    count: 0,
                    revenue: 0,
                    avgRating: 0,
                    completionRate: 0
                };
            }
            
            serviceStats[service].count++;
            serviceStats[service].revenue += booking.totalCost || 0;
            serviceStats[service].avgRating += booking.rating || 0;
            if (booking.status === 'completed') {
                serviceStats[service].completionRate++;
            }
        });

        // Calculate percentages and averages
        Object.keys(serviceStats).forEach(service => {
            const stats = serviceStats[service];
            stats.avgRating = stats.avgRating / stats.count;
            stats.completionRate = (stats.completionRate / stats.count) * 100;
            stats.avgValue = stats.revenue / stats.count;
        });

        return serviceStats;
    }
}

// ES6 exports for React/browser environment
export { WorkerPerformanceTracker, CustomerManagementSystem, CustomerSegmentation, AnalyticsEngine };

// CommonJS exports for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WorkerPerformanceTracker,
        CustomerManagementSystem,
        CustomerSegmentation,
        AnalyticsEngine
    };
} else {
    window.WorkerPerformanceTracker = WorkerPerformanceTracker;
    window.CustomerManagementSystem = CustomerManagementSystem;
    window.CustomerSegmentation = CustomerSegmentation;
    window.AnalyticsEngine = AnalyticsEngine;
}
