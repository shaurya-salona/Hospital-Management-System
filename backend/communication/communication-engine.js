/**
 * Communication Engine for HMIS
 * Provides messaging, email, SMS, and video call capabilities
 */

const nodemailer = require('nodemailer');
const twilio = require('twilio');

class CommunicationEngine {
    constructor() {
        this.messages = new Map();
        this.conversations = new Map();
        this.emailTemplates = new Map();
        this.smsTemplates = new Map();
        this.videoSessions = new Map();
        this.notifications = new Map();

        this.init();
    }

    async init() {
        console.log('Initializing Communication Engine...');

        // Initialize email transporter
        await this.initializeEmail();

        // Initialize SMS service
        await this.initializeSMS();

        // Initialize video service
        await this.initializeVideo();

        // Load templates
        await this.loadTemplates();

        console.log('Communication Engine initialized successfully');
    }

    // Email Management
    async initializeEmail() {
        try {
            this.emailTransporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT || 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            console.log('Email service initialized');
        } catch (error) {
            console.error('Error initializing email service:', error);
        }
    }

    async sendEmail(emailData) {
        try {
            const email = {
                id: this.generateEmailId(),
                to: emailData.to,
                cc: emailData.cc || [],
                bcc: emailData.bcc || [],
                subject: emailData.subject,
                body: emailData.body,
                html: emailData.html || emailData.body,
                attachments: emailData.attachments || [],
                priority: emailData.priority || 'normal',
                status: 'pending',
                sentDate: null,
                createdDate: new Date().toISOString(),
                templateId: emailData.templateId,
                metadata: emailData.metadata || {}
            };

            // Send email
            const result = await this.emailTransporter.sendMail({
                from: process.env.SMTP_FROM || 'noreply@hmis.com',
                to: email.to,
                cc: email.cc,
                bcc: email.bcc,
                subject: email.subject,
                text: email.body,
                html: email.html,
                attachments: email.attachments
            });

            email.status = 'sent';
            email.sentDate = new Date().toISOString();
            email.messageId = result.messageId;

            this.messages.set(email.id, email);

            // Create audit log
            await this.createAuditLog('email_sent', {
                emailId: email.id,
                to: email.to,
                subject: email.subject,
                userId: emailData.userId
            });

            return email;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    async sendBulkEmail(emails) {
        try {
            const results = [];

            for (const emailData of emails) {
                try {
                    const result = await this.sendEmail(emailData);
                    results.push({ success: true, email: result });
                } catch (error) {
                    results.push({ success: false, error: error.message, email: emailData });
                }
            }

            return results;
        } catch (error) {
            console.error('Error sending bulk email:', error);
            throw error;
        }
    }

    // SMS Management
    async initializeSMS() {
        try {
            if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
                this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                console.log('SMS service initialized');
            } else {
                console.log('SMS service not configured');
            }
        } catch (error) {
            console.error('Error initializing SMS service:', error);
        }
    }

    async sendSMS(smsData) {
        try {
            if (!this.twilioClient) {
                throw new Error('SMS service not configured');
            }

            const sms = {
                id: this.generateSMSId(),
                to: smsData.to,
                from: process.env.TWILIO_PHONE_NUMBER,
                message: smsData.message,
                status: 'pending',
                sentDate: null,
                createdDate: new Date().toISOString(),
                templateId: smsData.templateId,
                metadata: smsData.metadata || {}
            };

            // Send SMS
            const result = await this.twilioClient.messages.create({
                body: sms.message,
                from: sms.from,
                to: sms.to
            });

            sms.status = 'sent';
            sms.sentDate = new Date().toISOString();
            sms.messageSid = result.sid;

            this.messages.set(sms.id, sms);

            // Create audit log
            await this.createAuditLog('sms_sent', {
                smsId: sms.id,
                to: sms.to,
                message: sms.message,
                userId: smsData.userId
            });

            return sms;
        } catch (error) {
            console.error('Error sending SMS:', error);
            throw error;
        }
    }

    async sendBulkSMS(smsList) {
        try {
            const results = [];

            for (const smsData of smsList) {
                try {
                    const result = await this.sendSMS(smsData);
                    results.push({ success: true, sms: result });
                } catch (error) {
                    results.push({ success: false, error: error.message, sms: smsData });
                }
            }

            return results;
        } catch (error) {
            console.error('Error sending bulk SMS:', error);
            throw error;
        }
    }

    // Video Call Management
    async initializeVideo() {
        try {
            // Initialize video service (e.g., WebRTC, Zoom, etc.)
            this.videoService = {
                provider: process.env.VIDEO_PROVIDER || 'webrtc',
                apiKey: process.env.VIDEO_API_KEY,
                apiSecret: process.env.VIDEO_API_SECRET
            };

            console.log('Video service initialized');
        } catch (error) {
            console.error('Error initializing video service:', error);
        }
    }

    async createVideoSession(sessionData) {
        try {
            const session = {
                id: this.generateVideoSessionId(),
                title: sessionData.title,
                participants: sessionData.participants || [],
                host: sessionData.host,
                startTime: sessionData.startTime || new Date().toISOString(),
                duration: sessionData.duration || 60,
                status: 'scheduled',
                meetingUrl: null,
                meetingId: null,
                password: null,
                recording: sessionData.recording || false,
                metadata: sessionData.metadata || {}
            };

            // Create video session
            if (this.videoService.provider === 'zoom') {
                // Zoom integration
                session.meetingUrl = `https://zoom.us/j/${this.generateMeetingId()}`;
                session.meetingId = this.generateMeetingId();
                session.password = this.generatePassword();
            } else {
                // WebRTC integration
                session.meetingUrl = `https://hmis.com/video/${session.id}`;
                session.meetingId = session.id;
            }

            this.videoSessions.set(session.id, session);

            // Create audit log
            await this.createAuditLog('video_session_created', {
                sessionId: session.id,
                host: sessionData.host,
                participants: sessionData.participants,
                userId: sessionData.userId
            });

            return session;
        } catch (error) {
            console.error('Error creating video session:', error);
            throw error;
        }
    }

    async joinVideoSession(sessionId, participantData) {
        try {
            const session = this.videoSessions.get(sessionId);
            if (!session) {
                throw new Error('Video session not found');
            }

            const participant = {
                id: this.generateParticipantId(),
                name: participantData.name,
                email: participantData.email,
                role: participantData.role || 'participant',
                joinTime: new Date().toISOString(),
                status: 'joined'
            };

            session.participants.push(participant);
            session.status = 'active';

            this.videoSessions.set(sessionId, session);

            // Create audit log
            await this.createAuditLog('video_session_joined', {
                sessionId: sessionId,
                participantId: participant.id,
                participantName: participantData.name,
                userId: participantData.userId
            });

            return { session, participant };
        } catch (error) {
            console.error('Error joining video session:', error);
            throw error;
        }
    }

    // Messaging System
    async sendMessage(messageData) {
        try {
            const message = {
                id: this.generateMessageId(),
                conversationId: messageData.conversationId,
                senderId: messageData.senderId,
                senderName: messageData.senderName,
                recipientId: messageData.recipientId,
                recipientName: messageData.recipientName,
                content: messageData.content,
                type: messageData.type || 'text',
                attachments: messageData.attachments || [],
                timestamp: new Date().toISOString(),
                status: 'sent',
                read: false,
                readAt: null,
                metadata: messageData.metadata || {}
            };

            this.messages.set(message.id, message);

            // Update conversation
            await this.updateConversation(message.conversationId, message);

            // Create audit log
            await this.createAuditLog('message_sent', {
                messageId: message.id,
                conversationId: message.conversationId,
                senderId: messageData.senderId,
                recipientId: messageData.recipientId,
                userId: messageData.userId
            });

            return message;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    async getMessages(conversationId, filters = {}) {
        try {
            let messages = Array.from(this.messages.values())
                .filter(message => message.conversationId === conversationId);

            // Apply filters
            if (filters.senderId) {
                messages = messages.filter(message => message.senderId === filters.senderId);
            }

            if (filters.type) {
                messages = messages.filter(message => message.type === filters.type);
            }

            if (filters.dateFrom) {
                messages = messages.filter(message =>
                    new Date(message.timestamp) >= new Date(filters.dateFrom)
                );
            }

            if (filters.dateTo) {
                messages = messages.filter(message =>
                    new Date(message.timestamp) <= new Date(filters.dateTo)
                );
            }

            return messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        } catch (error) {
            console.error('Error getting messages:', error);
            throw error;
        }
    }

    async createConversation(conversationData) {
        try {
            const conversation = {
                id: this.generateConversationId(),
                title: conversationData.title,
                participants: conversationData.participants || [],
                type: conversationData.type || 'direct',
                status: 'active',
                createdDate: new Date().toISOString(),
                lastMessage: null,
                lastMessageDate: null,
                metadata: conversationData.metadata || {}
            };

            this.conversations.set(conversation.id, conversation);

            // Create audit log
            await this.createAuditLog('conversation_created', {
                conversationId: conversation.id,
                participants: conversationData.participants,
                userId: conversationData.userId
            });

            return conversation;
        } catch (error) {
            console.error('Error creating conversation:', error);
            throw error;
        }
    }

    async getConversations(userId, filters = {}) {
        try {
            let conversations = Array.from(this.conversations.values())
                .filter(conversation =>
                    conversation.participants.some(p => p.id === userId)
                );

            // Apply filters
            if (filters.type) {
                conversations = conversations.filter(conversation => conversation.type === filters.type);
            }

            if (filters.status) {
                conversations = conversations.filter(conversation => conversation.status === filters.status);
            }

            return conversations.sort((a, b) =>
                new Date(b.lastMessageDate || b.createdDate) - new Date(a.lastMessageDate || a.createdDate)
            );
        } catch (error) {
            console.error('Error getting conversations:', error);
            throw error;
        }
    }

    // Notification System
    async sendNotification(notificationData) {
        try {
            const notification = {
                id: this.generateNotificationId(),
                userId: notificationData.userId,
                title: notificationData.title,
                message: notificationData.message,
                type: notificationData.type || 'info',
                priority: notificationData.priority || 'normal',
                channel: notificationData.channel || 'in-app',
                status: 'pending',
                sentDate: null,
                createdDate: new Date().toISOString(),
                read: false,
                readAt: null,
                metadata: notificationData.metadata || {}
            };

            // Send notification based on channel
            switch (notification.channel) {
                case 'email':
                    await this.sendEmail({
                        to: notificationData.email,
                        subject: notification.title,
                        body: notification.message,
                        userId: notificationData.userId
                    });
                    break;
                case 'sms':
                    await this.sendSMS({
                        to: notificationData.phone,
                        message: notification.message,
                        userId: notificationData.userId
                    });
                    break;
                case 'push':
                    await this.sendPushNotification(notification);
                    break;
                default:
                    // In-app notification
                    break;
            }

            notification.status = 'sent';
            notification.sentDate = new Date().toISOString();

            this.notifications.set(notification.id, notification);

            // Create audit log
            await this.createAuditLog('notification_sent', {
                notificationId: notification.id,
                userId: notificationData.userId,
                type: notification.type,
                channel: notification.channel
            });

            return notification;
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    }

    async getNotifications(userId, filters = {}) {
        try {
            let notifications = Array.from(this.notifications.values())
                .filter(notification => notification.userId === userId);

            // Apply filters
            if (filters.type) {
                notifications = notifications.filter(notification => notification.type === filters.type);
            }

            if (filters.channel) {
                notifications = notifications.filter(notification => notification.channel === filters.channel);
            }

            if (filters.read !== undefined) {
                notifications = notifications.filter(notification => notification.read === filters.read);
            }

            return notifications.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
        } catch (error) {
            console.error('Error getting notifications:', error);
            throw error;
        }
    }

    // Template Management
    async loadTemplates() {
        try {
            // Load email templates
            this.emailTemplates.set('appointment_reminder', {
                subject: 'Appointment Reminder - {{patientName}}',
                body: 'Dear {{patientName}}, this is a reminder for your appointment on {{appointmentDate}} at {{appointmentTime}}.',
                html: '<p>Dear {{patientName}}, this is a reminder for your appointment on {{appointmentDate}} at {{appointmentTime}}.</p>'
            });

            this.emailTemplates.set('lab_results', {
                subject: 'Lab Results Available - {{patientName}}',
                body: 'Dear {{patientName}}, your lab results are now available. Please log in to view them.',
                html: '<p>Dear {{patientName}}, your lab results are now available. Please log in to view them.</p>'
            });

            // Load SMS templates
            this.smsTemplates.set('appointment_reminder', 'Reminder: You have an appointment on {{appointmentDate}} at {{appointmentTime}}. Reply STOP to opt out.');

            this.smsTemplates.set('lab_results', 'Your lab results are ready. Log in to view them. Reply STOP to opt out.');

            console.log('Templates loaded successfully');
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    }

    async sendTemplateEmail(templateId, recipientData, variables = {}) {
        try {
            const template = this.emailTemplates.get(templateId);
            if (!template) {
                throw new Error('Template not found');
            }

            // Replace variables in template
            let subject = template.subject;
            let body = template.body;
            let html = template.html;

            for (const [key, value] of Object.entries(variables)) {
                const placeholder = `{{${key}}}`;
                subject = subject.replace(new RegExp(placeholder, 'g'), value);
                body = body.replace(new RegExp(placeholder, 'g'), value);
                html = html.replace(new RegExp(placeholder, 'g'), value);
            }

            return await this.sendEmail({
                to: recipientData.email,
                subject: subject,
                body: body,
                html: html,
                templateId: templateId,
                userId: recipientData.userId
            });
        } catch (error) {
            console.error('Error sending template email:', error);
            throw error;
        }
    }

    async sendTemplateSMS(templateId, recipientData, variables = {}) {
        try {
            const template = this.smsTemplates.get(templateId);
            if (!template) {
                throw new Error('Template not found');
            }

            // Replace variables in template
            let message = template;
            for (const [key, value] of Object.entries(variables)) {
                const placeholder = `{{${key}}}`;
                message = message.replace(new RegExp(placeholder, 'g'), value);
            }

            return await this.sendSMS({
                to: recipientData.phone,
                message: message,
                templateId: templateId,
                userId: recipientData.userId
            });
        } catch (error) {
            console.error('Error sending template SMS:', error);
            throw error;
        }
    }

    // Helper Methods
    async updateConversation(conversationId, message) {
        const conversation = this.conversations.get(conversationId);
        if (conversation) {
            conversation.lastMessage = message.content;
            conversation.lastMessageDate = message.timestamp;
            this.conversations.set(conversationId, conversation);
        }
    }

    async sendPushNotification(notification) {
        // Implement push notification logic
        console.log('Push notification sent:', notification);
    }

    // Utility Methods
    generateEmailId() {
        return 'EMAIL_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateSMSId() {
        return 'SMS_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateMessageId() {
        return 'MSG_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateConversationId() {
        return 'CONV_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateVideoSessionId() {
        return 'VIDEO_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateNotificationId() {
        return 'NOTIF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateParticipantId() {
        return 'PART_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateMeetingId() {
        return Math.random().toString(36).substr(2, 9);
    }

    generatePassword() {
        return Math.random().toString(36).substr(2, 8);
    }

    async createAuditLog(action, data) {
        // This would typically save to an audit log database
        console.log(`Communication Audit: ${action}`, data);
    }
}

module.exports = CommunicationEngine;


