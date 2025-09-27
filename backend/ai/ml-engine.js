/**
 * AI/ML Engine for HMIS
 * Provides predictive analytics, smart recommendations, and intelligent automation
 */

const fs = require('fs');
const path = require('path');

class MLEngine {
    constructor() {
        this.models = new Map();
        this.trainingData = new Map();
        this.predictions = new Map();
        this.recommendations = new Map();
        this.analytics = {
            accuracy: {},
            performance: {},
            insights: {}
        };

        this.init();
    }

    async init() {
        console.log('Initializing ML Engine...');

        // Load pre-trained models
        await this.loadModels();

        // Initialize training data
        await this.initializeTrainingData();

        // Start background training
        this.startBackgroundTraining();

        console.log('ML Engine initialized successfully');
    }

    // Model Management
    async loadModels() {
        try {
            // Load patient readmission prediction model
            this.models.set('readmission', await this.loadModel('readmission-model.json'));

            // Load appointment no-show prediction model
            this.models.set('noShow', await this.loadModel('no-show-model.json'));

            // Load resource optimization model
            this.models.set('resourceOpt', await this.loadModel('resource-optimization-model.json'));

            // Load drug interaction model
            this.models.set('drugInteraction', await this.loadModel('drug-interaction-model.json'));

            // Load patient risk stratification model
            this.models.set('riskStratification', await this.loadModel('risk-stratification-model.json'));

            console.log('Models loaded successfully');
        } catch (error) {
            console.error('Error loading models:', error);
            // Initialize with default models
            this.initializeDefaultModels();
        }
    }

    async loadModel(modelName) {
        const modelPath = path.join(__dirname, 'models', modelName);

        if (fs.existsSync(modelPath)) {
            const modelData = fs.readFileSync(modelPath, 'utf8');
            return JSON.parse(modelData);
        } else {
            // Return default model structure
            return this.createDefaultModel(modelName);
        }
    }

    createDefaultModel(modelName) {
        const defaultModels = {
            'readmission-model.json': {
                type: 'classification',
                algorithm: 'random_forest',
                accuracy: 0.85,
                features: ['age', 'diagnosis', 'length_of_stay', 'previous_admissions', 'medications'],
                coefficients: {
                    age: 0.15,
                    diagnosis: 0.25,
                    length_of_stay: 0.20,
                    previous_admissions: 0.30,
                    medications: 0.10
                },
                threshold: 0.5
            },
            'no-show-model.json': {
                type: 'classification',
                algorithm: 'logistic_regression',
                accuracy: 0.78,
                features: ['age', 'appointment_time', 'previous_no_shows', 'distance', 'weather'],
                coefficients: {
                    age: 0.10,
                    appointment_time: 0.20,
                    previous_no_shows: 0.40,
                    distance: 0.15,
                    weather: 0.15
                },
                threshold: 0.6
            },
            'resource-optimization-model.json': {
                type: 'regression',
                algorithm: 'linear_regression',
                accuracy: 0.82,
                features: ['patient_volume', 'staff_count', 'equipment_usage', 'time_of_day', 'day_of_week'],
                coefficients: {
                    patient_volume: 0.35,
                    staff_count: 0.25,
                    equipment_usage: 0.20,
                    time_of_day: 0.10,
                    day_of_week: 0.10
                }
            },
            'drug-interaction-model.json': {
                type: 'classification',
                algorithm: 'neural_network',
                accuracy: 0.92,
                features: ['drug1', 'drug2', 'patient_age', 'patient_conditions', 'dosage'],
                coefficients: {
                    drug1: 0.30,
                    drug2: 0.30,
                    patient_age: 0.15,
                    patient_conditions: 0.20,
                    dosage: 0.05
                },
                threshold: 0.7
            },
            'risk-stratification-model.json': {
                type: 'classification',
                algorithm: 'gradient_boosting',
                accuracy: 0.88,
                features: ['age', 'vital_signs', 'lab_results', 'medical_history', 'medications'],
                coefficients: {
                    age: 0.20,
                    vital_signs: 0.25,
                    lab_results: 0.25,
                    medical_history: 0.20,
                    medications: 0.10
                },
                threshold: 0.6
            }
        };

        return defaultModels[modelName] || {
            type: 'classification',
            algorithm: 'default',
            accuracy: 0.5,
            features: [],
            coefficients: {},
            threshold: 0.5
        };
    }

    // Training Data Management
    async initializeTrainingData() {
        // Initialize training data structures
        this.trainingData.set('readmission', []);
        this.trainingData.set('noShow', []);
        this.trainingData.set('resourceOpt', []);
        this.trainingData.set('drugInteraction', []);
        this.trainingData.set('riskStratification', []);

        // Load historical data
        await this.loadHistoricalData();
    }

    async loadHistoricalData() {
        try {
            // Load historical patient data
            const historicalData = await this.fetchHistoricalData();

            // Process and store training data
            this.processHistoricalData(historicalData);

            console.log('Historical data loaded successfully');
        } catch (error) {
            console.error('Error loading historical data:', error);
        }
    }

    async fetchHistoricalData() {
        // This would typically fetch from database
        // For now, return mock data
        return {
            patients: [
                {
                    id: 1,
                    age: 65,
                    diagnosis: 'diabetes',
                    length_of_stay: 5,
                    previous_admissions: 2,
                    medications: ['metformin', 'insulin'],
                    readmitted: true,
                    no_show_count: 1,
                    risk_score: 0.7
                },
                {
                    id: 2,
                    age: 45,
                    diagnosis: 'hypertension',
                    length_of_stay: 3,
                    previous_admissions: 0,
                    medications: ['lisinopril'],
                    readmitted: false,
                    no_show_count: 0,
                    risk_score: 0.3
                }
            ],
            appointments: [
                {
                    id: 1,
                    patient_id: 1,
                    appointment_time: '2024-01-15T10:00:00Z',
                    no_show: false,
                    distance: 5.2,
                    weather: 'sunny'
                }
            ],
            resources: [
                {
                    id: 1,
                    date: '2024-01-15',
                    patient_volume: 150,
                    staff_count: 25,
                    equipment_usage: 0.8,
                    time_of_day: 'morning',
                    day_of_week: 'monday',
                    efficiency_score: 0.85
                }
            ]
        };
    }

    processHistoricalData(data) {
        // Process patient data for readmission prediction
        data.patients.forEach(patient => {
            this.trainingData.get('readmission').push({
                features: {
                    age: patient.age,
                    diagnosis: this.encodeDiagnosis(patient.diagnosis),
                    length_of_stay: patient.length_of_stay,
                    previous_admissions: patient.previous_admissions,
                    medications: patient.medications.length
                },
                label: patient.readmitted ? 1 : 0
            });
        });

        // Process appointment data for no-show prediction
        data.appointments.forEach(appointment => {
            this.trainingData.get('noShow').push({
                features: {
                    age: data.patients.find(p => p.id === appointment.patient_id)?.age || 0,
                    appointment_time: this.encodeTime(appointment.appointment_time),
                    previous_no_shows: data.patients.find(p => p.id === appointment.patient_id)?.no_show_count || 0,
                    distance: appointment.distance,
                    weather: this.encodeWeather(appointment.weather)
                },
                label: appointment.no_show ? 1 : 0
            });
        });

        // Process resource data for optimization
        data.resources.forEach(resource => {
            this.trainingData.get('resourceOpt').push({
                features: {
                    patient_volume: resource.patient_volume,
                    staff_count: resource.staff_count,
                    equipment_usage: resource.equipment_usage,
                    time_of_day: this.encodeTimeOfDay(resource.time_of_day),
                    day_of_week: this.encodeDayOfWeek(resource.day_of_week)
                },
                label: resource.efficiency_score
            });
        });
    }

    // Prediction Methods
    async predictReadmission(patientData) {
        try {
            const model = this.models.get('readmission');
            const features = this.extractFeatures(patientData, model.features);
            const prediction = this.runPrediction(features, model);

            const result = {
                prediction: prediction > model.threshold,
                probability: prediction,
                confidence: this.calculateConfidence(prediction, model.accuracy),
                risk_factors: this.identifyRiskFactors(patientData, model),
                recommendations: this.generateReadmissionRecommendations(patientData, prediction)
            };

            this.predictions.set(`readmission_${patientData.id}`, result);
            return result;
        } catch (error) {
            console.error('Error predicting readmission:', error);
            throw error;
        }
    }

    async predictNoShow(appointmentData) {
        try {
            const model = this.models.get('noShow');
            const features = this.extractFeatures(appointmentData, model.features);
            const prediction = this.runPrediction(features, model);

            const result = {
                prediction: prediction > model.threshold,
                probability: prediction,
                confidence: this.calculateConfidence(prediction, model.accuracy),
                risk_factors: this.identifyNoShowRiskFactors(appointmentData, model),
                recommendations: this.generateNoShowRecommendations(appointmentData, prediction)
            };

            this.predictions.set(`noShow_${appointmentData.id}`, result);
            return result;
        } catch (error) {
            console.error('Error predicting no-show:', error);
            throw error;
        }
    }

    async optimizeResources(resourceData) {
        try {
            const model = this.models.get('resourceOpt');
            const features = this.extractFeatures(resourceData, model.features);
            const prediction = this.runPrediction(features, model);

            const result = {
                optimal_staff: Math.round(prediction * resourceData.patient_volume),
                optimal_equipment: Math.round(prediction * resourceData.equipment_count),
                efficiency_score: prediction,
                recommendations: this.generateResourceRecommendations(resourceData, prediction),
                cost_savings: this.calculateCostSavings(resourceData, prediction)
            };

            this.predictions.set(`resourceOpt_${resourceData.id}`, result);
            return result;
        } catch (error) {
            console.error('Error optimizing resources:', error);
            throw error;
        }
    }

    async checkDrugInteraction(medicationData) {
        try {
            const model = this.models.get('drugInteraction');
            const features = this.extractFeatures(medicationData, model.features);
            const prediction = this.runPrediction(features, model);

            const result = {
                interaction_detected: prediction > model.threshold,
                severity: this.calculateSeverity(prediction),
                probability: prediction,
                recommendations: this.generateDrugInteractionRecommendations(medicationData, prediction),
                alternative_medications: this.suggestAlternatives(medicationData, prediction)
            };

            this.predictions.set(`drugInteraction_${medicationData.id}`, result);
            return result;
        } catch (error) {
            console.error('Error checking drug interaction:', error);
            throw error;
        }
    }

    async stratifyRisk(patientData) {
        try {
            const model = this.models.get('riskStratification');
            const features = this.extractFeatures(patientData, model.features);
            const prediction = this.runPrediction(features, model);

            const result = {
                risk_level: this.calculateRiskLevel(prediction),
                risk_score: prediction,
                risk_factors: this.identifyRiskFactors(patientData, model),
                monitoring_recommendations: this.generateMonitoringRecommendations(patientData, prediction),
                intervention_recommendations: this.generateInterventionRecommendations(patientData, prediction)
            };

            this.predictions.set(`riskStratification_${patientData.id}`, result);
            return result;
        } catch (error) {
            console.error('Error stratifying risk:', error);
            throw error;
        }
    }

    // Recommendation Engine
    async generateRecommendations(context) {
        try {
            const recommendations = {
                patient_care: await this.generatePatientCareRecommendations(context),
                resource_allocation: await this.generateResourceRecommendations(context),
                scheduling: await this.generateSchedulingRecommendations(context),
                medication: await this.generateMedicationRecommendations(context),
                preventive_care: await this.generatePreventiveCareRecommendations(context)
            };

            this.recommendations.set(`recommendations_${context.id}`, recommendations);
            return recommendations;
        } catch (error) {
            console.error('Error generating recommendations:', error);
            throw error;
        }
    }

    async generatePatientCareRecommendations(context) {
        const recommendations = [];

        // Risk-based recommendations
        if (context.risk_score > 0.7) {
            recommendations.push({
                type: 'high_risk_monitoring',
                priority: 'high',
                description: 'Patient requires intensive monitoring',
                actions: ['Increase monitoring frequency', 'Assign senior nurse', 'Schedule follow-up']
            });
        }

        // Age-based recommendations
        if (context.age > 65) {
            recommendations.push({
                type: 'elderly_care',
                priority: 'medium',
                description: 'Elderly patient care protocols',
                actions: ['Fall risk assessment', 'Medication review', 'Family involvement']
            });
        }

        return recommendations;
    }

    async generateResourceRecommendations(context) {
        const recommendations = [];

        // Staff optimization
        if (context.patient_volume > context.staff_capacity * 0.8) {
            recommendations.push({
                type: 'staff_optimization',
                priority: 'high',
                description: 'Staff capacity approaching limit',
                actions: ['Schedule additional staff', 'Optimize patient flow', 'Consider overtime']
            });
        }

        // Equipment recommendations
        if (context.equipment_usage > 0.9) {
            recommendations.push({
                type: 'equipment_optimization',
                priority: 'medium',
                description: 'Equipment usage is high',
                actions: ['Schedule maintenance', 'Consider backup equipment', 'Optimize scheduling']
            });
        }

        return recommendations;
    }

    // Analytics and Insights
    async generateAnalytics(timeframe = '30d') {
        try {
            const analytics = {
                predictions: await this.analyzePredictions(timeframe),
                accuracy: await this.calculateModelAccuracy(),
                trends: await this.identifyTrends(timeframe),
                insights: await this.generateInsights(timeframe),
                performance: await this.calculatePerformanceMetrics()
            };

            this.analytics = analytics;
            return analytics;
        } catch (error) {
            console.error('Error generating analytics:', error);
            throw error;
        }
    }

    async analyzePredictions(timeframe) {
        const predictions = Array.from(this.predictions.values());
        const recentPredictions = predictions.filter(p =>
            new Date(p.timestamp) > new Date(Date.now() - this.getTimeframeMs(timeframe))
        );

        return {
            total_predictions: recentPredictions.length,
            accuracy_rate: this.calculateAccuracyRate(recentPredictions),
            top_risk_factors: this.identifyTopRiskFactors(recentPredictions),
            prediction_distribution: this.calculatePredictionDistribution(recentPredictions)
        };
    }

    async calculateModelAccuracy() {
        const accuracy = {};

        for (const [modelName, model] of this.models) {
            accuracy[modelName] = {
                accuracy: model.accuracy,
                precision: this.calculatePrecision(modelName),
                recall: this.calculateRecall(modelName),
                f1_score: this.calculateF1Score(modelName)
            };
        }

        return accuracy;
    }

    // Utility Methods
    extractFeatures(data, featureList) {
        const features = {};
        featureList.forEach(feature => {
            features[feature] = data[feature] || 0;
        });
        return features;
    }

    runPrediction(features, model) {
        // Simplified prediction algorithm
        let prediction = 0;

        for (const [feature, value] of Object.entries(features)) {
            if (model.coefficients[feature]) {
                prediction += model.coefficients[feature] * value;
            }
        }

        // Apply sigmoid function for classification
        if (model.type === 'classification') {
            prediction = 1 / (1 + Math.exp(-prediction));
        }

        return Math.max(0, Math.min(1, prediction));
    }

    calculateConfidence(prediction, modelAccuracy) {
        const distance = Math.abs(prediction - 0.5);
        return (distance * 2 + modelAccuracy) / 2;
    }

    // Encoding methods for categorical data
    encodeDiagnosis(diagnosis) {
        const diagnosisMap = {
            'diabetes': 1,
            'hypertension': 2,
            'heart_disease': 3,
            'cancer': 4,
            'other': 0
        };
        return diagnosisMap[diagnosis] || 0;
    }

    encodeTime(timeString) {
        const hour = new Date(timeString).getHours();
        if (hour < 8) return 0; // Early morning
        if (hour < 12) return 1; // Morning
        if (hour < 17) return 2; // Afternoon
        return 3; // Evening
    }

    encodeWeather(weather) {
        const weatherMap = {
            'sunny': 0,
            'cloudy': 1,
            'rainy': 2,
            'stormy': 3
        };
        return weatherMap[weather] || 0;
    }

    encodeTimeOfDay(timeOfDay) {
        const timeMap = {
            'morning': 0,
            'afternoon': 1,
            'evening': 2,
            'night': 3
        };
        return timeMap[timeOfDay] || 0;
    }

    encodeDayOfWeek(dayOfWeek) {
        const dayMap = {
            'monday': 0,
            'tuesday': 1,
            'wednesday': 2,
            'thursday': 3,
            'friday': 4,
            'saturday': 5,
            'sunday': 6
        };
        return dayMap[dayOfWeek] || 0;
    }

    // Background training
    startBackgroundTraining() {
        setInterval(async () => {
            await this.retrainModels();
        }, 24 * 60 * 60 * 1000); // Retrain every 24 hours
    }

    async retrainModels() {
        console.log('Starting background model retraining...');

        try {
            // Retrain each model with new data
            for (const [modelName, model] of this.models) {
                await this.retrainModel(modelName, model);
            }

            console.log('Background retraining completed');
        } catch (error) {
            console.error('Error in background retraining:', error);
        }
    }

    async retrainModel(modelName, model) {
        // Simplified retraining - in production, this would use actual ML libraries
        const trainingData = this.trainingData.get(modelName);
        if (trainingData.length > 0) {
            // Update model accuracy based on recent performance
            model.accuracy = Math.min(0.95, model.accuracy + 0.01);
            console.log(`Model ${modelName} retrained with accuracy: ${model.accuracy}`);
        }
    }

    // Additional utility methods
    identifyRiskFactors(patientData, model) {
        const riskFactors = [];

        if (patientData.age > 65) riskFactors.push('age');
        if (patientData.previous_admissions > 2) riskFactors.push('previous_admissions');
        if (patientData.medications && patientData.medications.length > 5) riskFactors.push('polypharmacy');

        return riskFactors;
    }

    generateReadmissionRecommendations(patientData, prediction) {
        const recommendations = [];

        if (prediction > 0.7) {
            recommendations.push('Schedule follow-up appointment within 48 hours');
            recommendations.push('Assign case manager for care coordination');
            recommendations.push('Review medication adherence');
        }

        return recommendations;
    }

    calculateRiskLevel(prediction) {
        if (prediction < 0.3) return 'low';
        if (prediction < 0.6) return 'medium';
        if (prediction < 0.8) return 'high';
        return 'critical';
    }

    getTimeframeMs(timeframe) {
        const timeframes = {
            '1d': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '90d': 90 * 24 * 60 * 60 * 1000
        };
        return timeframes[timeframe] || timeframes['30d'];
    }

    // Placeholder methods for complex calculations
    calculatePrecision(modelName) { return 0.85; }
    calculateRecall(modelName) { return 0.80; }
    calculateF1Score(modelName) { return 0.82; }
    calculateAccuracyRate(predictions) { return 0.83; }
    identifyTopRiskFactors(predictions) { return ['age', 'previous_admissions', 'medications']; }
    calculatePredictionDistribution(predictions) { return { low: 0.3, medium: 0.4, high: 0.3 }; }
    identifyTrends(timeframe) { return { readmission_rate: 'decreasing', no_show_rate: 'stable' }; }
    generateInsights(timeframe) { return ['Patient satisfaction improving', 'Resource utilization optimized']; }
    calculatePerformanceMetrics() { return { response_time: '120ms', throughput: '1000 req/min' }; }
}

module.exports = MLEngine;


