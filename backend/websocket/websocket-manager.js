/**
 * WebSocket Manager for HMIS
 * Handles real-time communication, notifications, and live updates
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { logger } = require('../config/logger');

class WebSocketManager {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.CORS_ORIGIN?.split(',') || ["http://localhost:3000", "http://localhost:3001"],
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        this.connectedUsers = new Map();
        this.rooms = new Map();
        this.emergencyAlerts = new Map();

        this.setupEventHandlers();
        this.setupPeriodicTasks();

        logger.info('WebSocket Manager initialized');
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            logger.info(`Client connected: ${socket.id}`);

            // Authentication middleware
            socket.use((packet, next) => {
                this.authenticateSocket(socket, packet, next);
            });

            // Handle user authentication
            socket.on('authenticate', (data) => {
                this.handleAuthentication(socket, data);
            });

            // Handle joining rooms
            socket.on('join_room', (room) => {
                this.handleJoinRoom(socket, room);
            });

            // Handle leaving rooms
            socket.on('leave_room', (room) => {
                this.handleLeaveRoom(socket, room);
            });

            // Handle real-time notifications
            socket.on('send_notification', (data) => {
                this.handleSendNotification(socket, data);
            });

            // Handle emergency alerts
            socket.on('emergency_alert', (data) => {
                this.handleEmergencyAlert(socket, data);
            });

            // Handle live updates
            socket.on('request_live_update', (data) => {
                this.handleLiveUpdateRequest(socket, data);
            });

            // Handle chat messages
            socket.on('send_message', (data) => {
                this.handleChatMessage(socket, data);
            });

            // Handle typing indicators
            socket.on('typing_start', (data) => {
                this.handleTypingStart(socket, data);
            });

            socket.on('typing_stop', (data) => {
                this.handleTypingStop(socket, data);
            });

            // Handle patient status updates
            socket.on('patient_status_update', (data) => {
                this.handlePatientStatusUpdate(socket, data);
            });

            // Handle appointment updates
            socket.on('appointment_update', (data) => {
                this.handleAppointmentUpdate(socket, data);
            });

            // Handle inventory updates
            socket.on('inventory_update', (data) => {
                this.handleInventoryUpdate(socket, data);
            });

            // Handle system alerts
            socket.on('system_alert', (data) => {
                this.handleSystemAlert(socket, data);
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });

            // Handle errors
            socket.on('error', (error) => {
                logger.error(`Socket error for ${socket.id}:`, error);
            });
        });
    }

    async authenticateSocket(socket, packet, next) {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return next(new Error('Authentication token required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            socket.userRole = decoded.role;
            socket.userName = decoded.name;

            next();
        } catch (error) {
            logger.error('Socket authentication failed:', error);
            next(new Error('Invalid authentication token'));
        }
    }

    handleAuthentication(socket, data) {
        try {
            const { token } = data;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            socket.userId = decoded.userId;
            socket.userRole = decoded.role;
            socket.userName = decoded.name;

            // Add user to connected users map
            this.connectedUsers.set(socket.userId, {
                socketId: socket.id,
                role: socket.userRole,
                name: socket.userName,
                connectedAt: new Date(),
                lastActivity: new Date()
            });

            // Join user-specific room
            socket.join(`user_${socket.userId}`);

            // Join role-specific room
            socket.join(`role_${socket.userRole}`);

            // Send authentication success
            socket.emit('authenticated', {
                userId: socket.userId,
                role: socket.userRole,
                name: socket.userName,
                connectedUsers: Array.from(this.connectedUsers.values())
            });

            // Notify others about new user
            socket.to(`role_${socket.userRole}`).emit('user_connected', {
                userId: socket.userId,
                name: socket.userName,
                role: socket.userRole
            });

            logger.info(`User authenticated: ${socket.userName} (${socket.userRole})`);
        } catch (error) {
            logger.error('Authentication error:', error);
            socket.emit('auth_error', { message: 'Authentication failed' });
        }
    }

    handleJoinRoom(socket, room) {
        if (!socket.userId) {
            socket.emit('error', { message: 'Authentication required' });
            return;
        }

        socket.join(room);
        this.rooms.set(room, this.rooms.get(room) || new Set());
        this.rooms.get(room).add(socket.userId);

        socket.emit('joined_room', { room });
        socket.to(room).emit('user_joined_room', {
            userId: socket.userId,
            name: socket.userName,
            room
        });

        logger.info(`User ${socket.userName} joined room: ${room}`);
    }

    handleLeaveRoom(socket, room) {
        socket.leave(room);

        if (this.rooms.has(room)) {
            this.rooms.get(room).delete(socket.userId);
            if (this.rooms.get(room).size === 0) {
                this.rooms.delete(room);
            }
        }

        socket.emit('left_room', { room });
        socket.to(room).emit('user_left_room', {
            userId: socket.userId,
            name: socket.userName,
            room
        });

        logger.info(`User ${socket.userName} left room: ${room}`);
    }

    handleSendNotification(socket, data) {
        if (!socket.userId) {
            socket.emit('error', { message: 'Authentication required' });
            return;
        }

        const { targetUsers, targetRoles, message, type, priority } = data;

        const notification = {
            id: this.generateNotificationId(),
            from: {
                userId: socket.userId,
                name: socket.userName,
                role: socket.userRole
            },
            message,
            type: type || 'info',
            priority: priority || 'normal',
            timestamp: new Date(),
            read: false
        };

        // Send to specific users
        if (targetUsers && targetUsers.length > 0) {
            targetUsers.forEach(userId => {
                this.io.to(`user_${userId}`).emit('notification', notification);
            });
        }

        // Send to specific roles
        if (targetRoles && targetRoles.length > 0) {
            targetRoles.forEach(role => {
                this.io.to(`role_${role}`).emit('notification', notification);
            });
        }

        // Broadcast to all if no specific targets
        if (!targetUsers && !targetRoles) {
            this.io.emit('notification', notification);
        }

        logger.info(`Notification sent by ${socket.userName}: ${message}`);
    }

    handleEmergencyAlert(socket, data) {
        if (!socket.userId) {
            socket.emit('error', { message: 'Authentication required' });
            return;
        }

        const { patientId, patientName, emergencyType, location, description } = data;

        const emergencyAlert = {
            id: this.generateEmergencyId(),
            patientId,
            patientName,
            emergencyType,
            location,
            description,
            reportedBy: {
                userId: socket.userId,
                name: socket.userName,
                role: socket.userRole
            },
            timestamp: new Date(),
            status: 'active',
            acknowledgedBy: []
        };

        // Store emergency alert
        this.emergencyAlerts.set(emergencyAlert.id, emergencyAlert);

        // Broadcast to all medical staff
        this.io.to('role_doctor').emit('emergency_alert', emergencyAlert);
        this.io.to('role_nurse').emit('emergency_alert', emergencyAlert);
        this.io.to('role_admin').emit('emergency_alert', emergencyAlert);

        // Send to emergency room if exists
        this.io.to('emergency_room').emit('emergency_alert', emergencyAlert);

        // Log emergency
        logger.warn(`EMERGENCY ALERT: ${emergencyType} for patient ${patientName} reported by ${socket.userName}`);

        // Auto-escalate after 5 minutes if not acknowledged
        setTimeout(() => {
            if (this.emergencyAlerts.has(emergencyAlert.id)) {
                this.escalateEmergency(emergencyAlert.id);
            }
        }, 5 * 60 * 1000);
    }

    handleLiveUpdateRequest(socket, data) {
        if (!socket.userId) {
            socket.emit('error', { message: 'Authentication required' });
            return;
        }

        const { updateType, filters } = data;

        // Start live updates for the requested type
        socket.join(`live_${updateType}_${socket.userId}`);

        // Send initial data
        this.sendLiveUpdate(socket, updateType, filters);

        logger.info(`Live updates started for ${socket.userName}: ${updateType}`);
    }

    handleChatMessage(socket, data) {
        if (!socket.userId) {
            socket.emit('error', { message: 'Authentication required' });
            return;
        }

        const { room, message, type } = data;

        const chatMessage = {
            id: this.generateMessageId(),
            from: {
                userId: socket.userId,
                name: socket.userName,
                role: socket.userRole
            },
            message,
            type: type || 'text',
            timestamp: new Date(),
            room
        };

        // Send to room
        this.io.to(room).emit('chat_message', chatMessage);

        logger.info(`Chat message in ${room} from ${socket.userName}: ${message}`);
    }

    handleTypingStart(socket, data) {
        const { room } = data;
        socket.to(room).emit('user_typing', {
            userId: socket.userId,
            name: socket.userName,
            room
        });
    }

    handleTypingStop(socket, data) {
        const { room } = data;
        socket.to(room).emit('user_stopped_typing', {
            userId: socket.userId,
            name: socket.userName,
            room
        });
    }

    handlePatientStatusUpdate(socket, data) {
        if (!socket.userId) {
            socket.emit('error', { message: 'Authentication required' });
            return;
        }

        const { patientId, status, vitalSigns, notes } = data;

        const update = {
            patientId,
            status,
            vitalSigns,
            notes,
            updatedBy: {
                userId: socket.userId,
                name: socket.userName,
                role: socket.userRole
            },
            timestamp: new Date()
        };

        // Broadcast to all medical staff
        this.io.to('role_doctor').emit('patient_status_update', update);
        this.io.to('role_nurse').emit('patient_status_update', update);

        // Send to patient's assigned staff
        this.io.to(`patient_${patientId}`).emit('patient_status_update', update);

        logger.info(`Patient status updated by ${socket.userName}: ${patientId} - ${status}`);
    }

    handleAppointmentUpdate(socket, data) {
        if (!socket.userId) {
            socket.emit('error', { message: 'Authentication required' });
            return;
        }

        const { appointmentId, status, changes } = data;

        const update = {
            appointmentId,
            status,
            changes,
            updatedBy: {
                userId: socket.userId,
                name: socket.userName,
                role: socket.userRole
            },
            timestamp: new Date()
        };

        // Broadcast to relevant staff
        this.io.to('role_receptionist').emit('appointment_update', update);
        this.io.to('role_doctor').emit('appointment_update', update);
        this.io.to('role_nurse').emit('appointment_update', update);

        logger.info(`Appointment updated by ${socket.userName}: ${appointmentId} - ${status}`);
    }

    handleInventoryUpdate(socket, data) {
        if (!socket.userId) {
            socket.emit('error', { message: 'Authentication required' });
            return;
        }

        const { itemId, quantity, action, location } = data;

        const update = {
            itemId,
            quantity,
            action,
            location,
            updatedBy: {
                userId: socket.userId,
                name: socket.userName,
                role: socket.userRole
            },
            timestamp: new Date()
        };

        // Broadcast to inventory managers
        this.io.to('role_pharmacist').emit('inventory_update', update);
        this.io.to('role_admin').emit('inventory_update', update);

        logger.info(`Inventory updated by ${socket.userName}: ${itemId} - ${action}`);
    }

    handleSystemAlert(socket, data) {
        if (!socket.userId) {
            socket.emit('error', { message: 'Authentication required' });
            return;
        }

        const { alertType, message, severity, system } = data;

        const alert = {
            id: this.generateAlertId(),
            type: alertType,
            message,
            severity: severity || 'info',
            system: system || 'hmis',
            reportedBy: {
                userId: socket.userId,
                name: socket.userName,
                role: socket.userRole
            },
            timestamp: new Date()
        };

        // Broadcast to all admin users
        this.io.to('role_admin').emit('system_alert', alert);

        // Log system alert
        logger.warn(`System alert: ${alertType} - ${message} (${severity})`);

        // Auto-resolve info alerts after 1 hour
        if (severity === 'info') {
            setTimeout(() => {
                this.io.to('role_admin').emit('system_alert_resolved', { id: alert.id });
            }, 60 * 60 * 1000);
        }
    }

    handleDisconnect(socket) {
        if (socket.userId) {
            // Remove from connected users
            this.connectedUsers.delete(socket.userId);

            // Notify others about disconnection
            this.io.emit('user_disconnected', {
                userId: socket.userId,
                name: socket.userName,
                role: socket.userRole
            });

            logger.info(`User disconnected: ${socket.userName} (${socket.userRole})`);
        }
    }

    // Utility methods
    generateNotificationId() {
        return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateEmergencyId() {
        return `emerg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    escalateEmergency(emergencyId) {
        const emergency = this.emergencyAlerts.get(emergencyId);
        if (emergency) {
            emergency.status = 'escalated';
            emergency.escalatedAt = new Date();

            // Notify all admin users
            this.io.to('role_admin').emit('emergency_escalated', emergency);

            logger.error(`EMERGENCY ESCALATED: ${emergency.emergencyType} for patient ${emergency.patientName}`);
        }
    }

    async sendLiveUpdate(socket, updateType, filters) {
        try {
            let data;

            switch (updateType) {
                case 'patients':
                    data = await this.getLivePatientData(filters);
                    break;
                case 'appointments':
                    data = await this.getLiveAppointmentData(filters);
                    break;
                case 'inventory':
                    data = await this.getLiveInventoryData(filters);
                    break;
                case 'staff':
                    data = await this.getLiveStaffData(filters);
                    break;
                default:
                    return;
            }

            socket.emit('live_update', {
                type: updateType,
                data,
                timestamp: new Date()
            });
        } catch (error) {
            logger.error('Error sending live update:', error);
            socket.emit('live_update_error', { message: 'Failed to fetch live data' });
        }
    }

    async getLivePatientData(filters) {
        // Implement live patient data fetching
        return { patients: [], total: 0, timestamp: new Date() };
    }

    async getLiveAppointmentData(filters) {
        // Implement live appointment data fetching
        return { appointments: [], total: 0, timestamp: new Date() };
    }

    async getLiveInventoryData(filters) {
        // Implement live inventory data fetching
        return { inventory: [], total: 0, timestamp: new Date() };
    }

    async getLiveStaffData(filters) {
        // Implement live staff data fetching
        return { staff: [], total: 0, timestamp: new Date() };
    }

    setupPeriodicTasks() {
        // Send heartbeat every 30 seconds
        setInterval(() => {
            this.io.emit('heartbeat', { timestamp: new Date() });
        }, 30000);

        // Clean up old emergency alerts every hour
        setInterval(() => {
            this.cleanupOldAlerts();
        }, 60 * 60 * 1000);

        // Update connected users activity
        setInterval(() => {
            this.updateUserActivity();
        }, 60 * 1000);
    }

    cleanupOldAlerts() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        for (const [id, alert] of this.emergencyAlerts) {
            if (alert.timestamp < oneHourAgo && alert.status === 'resolved') {
                this.emergencyAlerts.delete(id);
            }
        }
    }

    updateUserActivity() {
        const now = new Date();

        for (const [userId, user] of this.connectedUsers) {
            user.lastActivity = now;
        }
    }

    // Public methods for external use
    sendNotificationToUser(userId, notification) {
        this.io.to(`user_${userId}`).emit('notification', notification);
    }

    sendNotificationToRole(role, notification) {
        this.io.to(`role_${role}`).emit('notification', notification);
    }

    broadcastToAll(event, data) {
        this.io.emit(event, data);
    }

    getConnectedUsers() {
        return Array.from(this.connectedUsers.values());
    }

    getRoomMembers(room) {
        return Array.from(this.rooms.get(room) || []);
    }
}

module.exports = WebSocketManager;
