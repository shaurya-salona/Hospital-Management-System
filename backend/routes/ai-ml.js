/**
 * AI/ML API Routes for HMIS
 * Provides endpoints for predictive analytics, smart recommendations, and AI insights
 */

const express = require('express');
const router = express.Router();
const MLEngine = require('../ai/ml-engine');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

// Initialize ML Engine
const mlEngine = new MLEngine();

// Middleware for AI/ML endpoints
const validateMLRequest = (req, res, next) => {
    const { model, data } = req.body;

    if (!model) {
        return res.status(400).json({
            success: false,
            message: 'Model type is required'
        });
    }

    if (!data) {
        return res.status(400).json({
            success: false,
            message: 'Data is required for prediction'
        });
    }

    next();
};

// Prediction Endpoints

// Predict patient readmission
router.post('/predict/readmission', authenticateToken, authorizeRole(['doctor', 'nurse', 'admin']), validateMLRequest, async (req, res) => {
    try {
        const { patientData } = req.body;

        const prediction = await mlEngine.predictReadmission(patientData);

        res.json({
            success: true,
            prediction: prediction,
            timestamp: new Date().toISOString(),
            model_version: '1.0.0'
        });
    } catch (error) {
        console.error('Readmission prediction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to predict readmission',
            error: error.message
        });
    }
});

// Predict appointment no-show
router.post('/predict/no-show', authenticateToken, authorizeRole(['receptionist', 'admin']), validateMLRequest, async (req, res) => {
    try {
        const { appointmentData } = req.body;

        const prediction = await mlEngine.predictNoShow(appointmentData);

        res.json({
            success: true,
            prediction: prediction,
            timestamp: new Date().toISOString(),
            model_version: '1.0.0'
        });
    } catch (error) {
        console.error('No-show prediction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to predict no-show',
            error: error.message
        });
    }
});

// Optimize resource allocation
router.post('/optimize/resources', authenticateToken, authorizeRole(['admin', 'manager']), validateMLRequest, async (req, res) => {
    try {
        const { resourceData } = req.body;

        const optimization = await mlEngine.optimizeResources(resourceData);

        res.json({
            success: true,
            optimization: optimization,
            timestamp: new Date().toISOString(),
            model_version: '1.0.0'
        });
    } catch (error) {
        console.error('Resource optimization error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to optimize resources',
            error: error.message
        });
    }
});

// Check drug interactions
router.post('/check/drug-interaction', authenticateToken, authorizeRole(['doctor', 'pharmacist', 'nurse']), validateMLRequest, async (req, res) => {
    try {
        const { medicationData } = req.body;

        const interaction = await mlEngine.checkDrugInteraction(medicationData);

        res.json({
            success: true,
            interaction: interaction,
            timestamp: new Date().toISOString(),
            model_version: '1.0.0'
        });
    } catch (error) {
        console.error('Drug interaction check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check drug interaction',
            error: error.message
        });
    }
});

// Stratify patient risk
router.post('/stratify/risk', authenticateToken, authorizeRole(['doctor', 'nurse', 'admin']), validateMLRequest, async (req, res) => {
    try {
        const { patientData } = req.body;

        const riskStratification = await mlEngine.stratifyRisk(patientData);

        res.json({
            success: true,
            riskStratification: riskStratification,
            timestamp: new Date().toISOString(),
            model_version: '1.0.0'
        });
    } catch (error) {
        console.error('Risk stratification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to stratify risk',
            error: error.message
        });
    }
});

// Recommendation Endpoints

// Generate smart recommendations
router.post('/recommendations', authenticateToken, authorizeRole(['doctor', 'nurse', 'admin', 'manager']), async (req, res) => {
    try {
        const { context } = req.body;

        const recommendations = await mlEngine.generateRecommendations(context);

        res.json({
            success: true,
            recommendations: recommendations,
            timestamp: new Date().toISOString(),
            model_version: '1.0.0'
        });
    } catch (error) {
        console.error('Recommendation generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate recommendations',
            error: error.message
        });
    }
});

// Get patient care recommendations
router.get('/recommendations/patient-care/:patientId', authenticateToken, authorizeRole(['doctor', 'nurse']), async (req, res) => {
    try {
        const { patientId } = req.params;
        const { timeframe = '30d' } = req.query;

        // Fetch patient data (this would typically come from database)
        const patientData = await fetchPatientData(patientId);

        const context = {
            id: patientId,
            ...patientData,
            timeframe
        };

        const recommendations = await mlEngine.generatePatientCareRecommendations(context);

        res.json({
            success: true,
            patientId: patientId,
            recommendations: recommendations,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Patient care recommendations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get patient care recommendations',
            error: error.message
        });
    }
});

// Get resource allocation recommendations
router.get('/recommendations/resources', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const { timeframe = '7d' } = req.query;

        const context = {
            id: 'resource_optimization',
            timeframe
        };

        const recommendations = await mlEngine.generateResourceRecommendations(context);

        res.json({
            success: true,
            recommendations: recommendations,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Resource recommendations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get resource recommendations',
            error: error.message
        });
    }
});

// Analytics Endpoints

// Get AI/ML analytics
router.get('/analytics', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const { timeframe = '30d' } = req.query;

        const analytics = await mlEngine.generateAnalytics(timeframe);

        res.json({
            success: true,
            analytics: analytics,
            timeframe: timeframe,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Analytics generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate analytics',
            error: error.message
        });
    }
});

// Get model performance metrics
router.get('/models/performance', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const performance = await mlEngine.calculateModelAccuracy();

        res.json({
            success: true,
            performance: performance,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Model performance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get model performance',
            error: error.message
        });
    }
});

// Get prediction insights
router.get('/insights', authenticateToken, authorizeRole(['admin', 'manager', 'doctor']), async (req, res) => {
    try {
        const { timeframe = '30d' } = req.query;

        const insights = await mlEngine.generateInsights(timeframe);

        res.json({
            success: true,
            insights: insights,
            timeframe: timeframe,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Insights generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate insights',
            error: error.message
        });
    }
});

// Model Management Endpoints

// Get available models
router.get('/models', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const models = Array.from(mlEngine.models.entries()).map(([name, model]) => ({
            name: name,
            type: model.type,
            algorithm: model.algorithm,
            accuracy: model.accuracy,
            features: model.features,
            last_updated: new Date().toISOString()
        }));

        res.json({
            success: true,
            models: models,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Models listing error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get models',
            error: error.message
        });
    }
});

// Retrain model
router.post('/models/:modelName/retrain', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const { modelName } = req.params;
        const { trainingData } = req.body;

        // This would typically trigger model retraining
        await mlEngine.retrainModel(modelName, mlEngine.models.get(modelName));

        res.json({
            success: true,
            message: `Model ${modelName} retraining initiated`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Model retraining error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrain model',
            error: error.message
        });
    }
});

// Get model details
router.get('/models/:modelName', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const { modelName } = req.params;
        const model = mlEngine.models.get(modelName);

        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Model not found'
            });
        }

        res.json({
            success: true,
            model: {
                name: modelName,
                type: model.type,
                algorithm: model.algorithm,
                accuracy: model.accuracy,
                features: model.features,
                coefficients: model.coefficients,
                threshold: model.threshold
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Model details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get model details',
            error: error.message
        });
    }
});

// Batch Prediction Endpoints

// Batch predict readmissions
router.post('/predict/batch/readmission', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const { patients } = req.body;

        if (!Array.isArray(patients)) {
            return res.status(400).json({
                success: false,
                message: 'Patients must be an array'
            });
        }

        const predictions = await Promise.all(
            patients.map(async (patient) => {
                const prediction = await mlEngine.predictReadmission(patient);
                return {
                    patientId: patient.id,
                    prediction: prediction
                };
            })
        );

        res.json({
            success: true,
            predictions: predictions,
            count: predictions.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Batch readmission prediction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to predict readmissions',
            error: error.message
        });
    }
});

// Batch predict no-shows
router.post('/predict/batch/no-show', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const { appointments } = req.body;

        if (!Array.isArray(appointments)) {
            return res.status(400).json({
                success: false,
                message: 'Appointments must be an array'
            });
        }

        const predictions = await Promise.all(
            appointments.map(async (appointment) => {
                const prediction = await mlEngine.predictNoShow(appointment);
                return {
                    appointmentId: appointment.id,
                    prediction: prediction
                };
            })
        );

        res.json({
            success: true,
            predictions: predictions,
            count: predictions.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Batch no-show prediction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to predict no-shows',
            error: error.message
        });
    }
});

// Health Check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        models_loaded: mlEngine.models.size,
        predictions_made: mlEngine.predictions.size,
        recommendations_generated: mlEngine.recommendations.size
    });
});

// Helper function to fetch patient data
async function fetchPatientData(patientId) {
    // This would typically fetch from database
    // For now, return mock data
    return {
        id: patientId,
        age: 65,
        diagnosis: 'diabetes',
        length_of_stay: 5,
        previous_admissions: 2,
        medications: ['metformin', 'insulin'],
        vital_signs: {
            blood_pressure: '140/90',
            heart_rate: 85,
            temperature: 98.6
        },
        lab_results: {
            glucose: 180,
            hba1c: 8.5
        },
        medical_history: ['hypertension', 'diabetes'],
        risk_score: 0.7
    };
}

module.exports = router;


