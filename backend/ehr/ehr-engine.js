/**
 * Complete EHR (Electronic Health Records) Engine for HMIS
 * Provides comprehensive digital health records, lab integration, and imaging capabilities
 */

const fs = require('fs');
const path = require('path');

class EHREngine {
    constructor() {
        this.records = new Map();
        this.labResults = new Map();
        this.imaging = new Map();
        this.medications = new Map();
        this.allergies = new Map();
        this.vitalSigns = new Map();
        this.notes = new Map();
        this.documentation = new Map();

        this.init();
    }

    async init() {
        console.log('Initializing EHR Engine...');

        // Initialize data structures
        await this.initializeDataStructures();

        // Load sample data
        await this.loadSampleData();

        console.log('EHR Engine initialized successfully');
    }

    // Patient Records Management
    async createPatientRecord(patientData) {
        try {
            const recordId = this.generateRecordId();
            const record = {
                id: recordId,
                patientId: patientData.patientId,
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                status: 'active',
                demographics: patientData.demographics,
                medicalHistory: patientData.medicalHistory || [],
                currentMedications: patientData.currentMedications || [],
                allergies: patientData.allergies || [],
                vitalSigns: patientData.vitalSigns || [],
                labResults: patientData.labResults || [],
                imaging: patientData.imaging || [],
                notes: patientData.notes || [],
                documents: patientData.documents || [],
                providers: patientData.providers || [],
                insurance: patientData.insurance || {},
                emergencyContacts: patientData.emergencyContacts || [],
                preferences: patientData.preferences || {}
            };

            this.records.set(recordId, record);

            // Create audit log
            await this.createAuditLog('patient_record_created', {
                recordId,
                patientId: patientData.patientId,
                userId: patientData.userId
            });

            return record;
        } catch (error) {
            console.error('Error creating patient record:', error);
            throw error;
        }
    }

    async getPatientRecord(patientId) {
        try {
            const records = Array.from(this.records.values())
                .filter(record => record.patientId === patientId);

            if (records.length === 0) {
                return null;
            }

            // Return the most recent record
            return records.sort((a, b) => new Date(b.updated) - new Date(a.updated))[0];
        } catch (error) {
            console.error('Error getting patient record:', error);
            throw error;
        }
    }

    async updatePatientRecord(recordId, updates) {
        try {
            const record = this.records.get(recordId);
            if (!record) {
                throw new Error('Record not found');
            }

            // Update record
            Object.assign(record, updates);
            record.updated = new Date().toISOString();

            this.records.set(recordId, record);

            // Create audit log
            await this.createAuditLog('patient_record_updated', {
                recordId,
                patientId: record.patientId,
                userId: updates.userId,
                changes: Object.keys(updates)
            });

            return record;
        } catch (error) {
            console.error('Error updating patient record:', error);
            throw error;
        }
    }

    // Lab Results Integration
    async addLabResult(patientId, labData) {
        try {
            const labResult = {
                id: this.generateLabId(),
                patientId: patientId,
                testName: labData.testName,
                testCode: labData.testCode,
                result: labData.result,
                unit: labData.unit,
                referenceRange: labData.referenceRange,
                status: labData.status || 'final',
                orderedBy: labData.orderedBy,
                performedBy: labData.performedBy,
                orderedDate: labData.orderedDate || new Date().toISOString(),
                resultDate: labData.resultDate || new Date().toISOString(),
                notes: labData.notes || '',
                critical: labData.critical || false,
                abnormal: this.isAbnormal(labData.result, labData.referenceRange)
            };

            this.labResults.set(labResult.id, labResult);

            // Update patient record
            await this.updatePatientRecordWithLabResult(patientId, labResult);

            // Create audit log
            await this.createAuditLog('lab_result_added', {
                patientId,
                labResultId: labResult.id,
                testName: labData.testName,
                userId: labData.userId
            });

            return labResult;
        } catch (error) {
            console.error('Error adding lab result:', error);
            throw error;
        }
    }

    async getLabResults(patientId, filters = {}) {
        try {
            let results = Array.from(this.labResults.values())
                .filter(result => result.patientId === patientId);

            // Apply filters
            if (filters.testName) {
                results = results.filter(result =>
                    result.testName.toLowerCase().includes(filters.testName.toLowerCase())
                );
            }

            if (filters.dateFrom) {
                results = results.filter(result =>
                    new Date(result.resultDate) >= new Date(filters.dateFrom)
                );
            }

            if (filters.dateTo) {
                results = results.filter(result =>
                    new Date(result.resultDate) <= new Date(filters.dateTo)
                );
            }

            if (filters.abnormal) {
                results = results.filter(result => result.abnormal);
            }

            if (filters.critical) {
                results = results.filter(result => result.critical);
            }

            return results.sort((a, b) => new Date(b.resultDate) - new Date(a.resultDate));
        } catch (error) {
            console.error('Error getting lab results:', error);
            throw error;
        }
    }

    // Imaging Integration
    async addImagingStudy(patientId, imagingData) {
        try {
            const imaging = {
                id: this.generateImagingId(),
                patientId: patientId,
                studyType: imagingData.studyType,
                bodyPart: imagingData.bodyPart,
                modality: imagingData.modality,
                orderedBy: imagingData.orderedBy,
                performedBy: imagingData.performedBy,
                orderedDate: imagingData.orderedDate || new Date().toISOString(),
                studyDate: imagingData.studyDate || new Date().toISOString(),
                status: imagingData.status || 'scheduled',
                images: imagingData.images || [],
                report: imagingData.report || '',
                findings: imagingData.findings || '',
                impression: imagingData.impression || '',
                recommendations: imagingData.recommendations || [],
                critical: imagingData.critical || false,
                contrast: imagingData.contrast || false,
                sedation: imagingData.sedation || false
            };

            this.imaging.set(imaging.id, imaging);

            // Update patient record
            await this.updatePatientRecordWithImaging(patientId, imaging);

            // Create audit log
            await this.createAuditLog('imaging_study_added', {
                patientId,
                imagingId: imaging.id,
                studyType: imagingData.studyType,
                userId: imagingData.userId
            });

            return imaging;
        } catch (error) {
            console.error('Error adding imaging study:', error);
            throw error;
        }
    }

    async getImagingStudies(patientId, filters = {}) {
        try {
            let studies = Array.from(this.imaging.values())
                .filter(study => study.patientId === patientId);

            // Apply filters
            if (filters.studyType) {
                studies = studies.filter(study =>
                    study.studyType.toLowerCase().includes(filters.studyType.toLowerCase())
                );
            }

            if (filters.modality) {
                studies = studies.filter(study =>
                    study.modality.toLowerCase().includes(filters.modality.toLowerCase())
                );
            }

            if (filters.dateFrom) {
                studies = studies.filter(study =>
                    new Date(study.studyDate) >= new Date(filters.dateFrom)
                );
            }

            if (filters.dateTo) {
                studies = studies.filter(study =>
                    new Date(study.studyDate) <= new Date(filters.dateTo)
                );
            }

            if (filters.critical) {
                studies = studies.filter(study => study.critical);
            }

            return studies.sort((a, b) => new Date(b.studyDate) - new Date(a.studyDate));
        } catch (error) {
            console.error('Error getting imaging studies:', error);
            throw error;
        }
    }

    // Medication Management
    async addMedication(patientId, medicationData) {
        try {
            const medication = {
                id: this.generateMedicationId(),
                patientId: patientId,
                name: medicationData.name,
                genericName: medicationData.genericName,
                dosage: medicationData.dosage,
                frequency: medicationData.frequency,
                route: medicationData.route,
                startDate: medicationData.startDate || new Date().toISOString(),
                endDate: medicationData.endDate,
                prescribedBy: medicationData.prescribedBy,
                status: medicationData.status || 'active',
                instructions: medicationData.instructions || '',
                sideEffects: medicationData.sideEffects || [],
                interactions: medicationData.interactions || [],
                allergies: medicationData.allergies || [],
                refills: medicationData.refills || 0,
                refillsRemaining: medicationData.refillsRemaining || 0,
                pharmacy: medicationData.pharmacy || '',
                notes: medicationData.notes || ''
            };

            this.medications.set(medication.id, medication);

            // Update patient record
            await this.updatePatientRecordWithMedication(patientId, medication);

            // Create audit log
            await this.createAuditLog('medication_added', {
                patientId,
                medicationId: medication.id,
                medicationName: medicationData.name,
                userId: medicationData.userId
            });

            return medication;
        } catch (error) {
            console.error('Error adding medication:', error);
            throw error;
        }
    }

    async getMedications(patientId, filters = {}) {
        try {
            let medications = Array.from(this.medications.values())
                .filter(medication => medication.patientId === patientId);

            // Apply filters
            if (filters.status) {
                medications = medications.filter(medication =>
                    medication.status === filters.status
                );
            }

            if (filters.name) {
                medications = medications.filter(medication =>
                    medication.name.toLowerCase().includes(filters.name.toLowerCase())
                );
            }

            return medications.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        } catch (error) {
            console.error('Error getting medications:', error);
            throw error;
        }
    }

    // Allergy Management
    async addAllergy(patientId, allergyData) {
        try {
            const allergy = {
                id: this.generateAllergyId(),
                patientId: patientId,
                allergen: allergyData.allergen,
                type: allergyData.type,
                severity: allergyData.severity,
                reaction: allergyData.reaction,
                onsetDate: allergyData.onsetDate || new Date().toISOString(),
                reportedBy: allergyData.reportedBy,
                verifiedBy: allergyData.verifiedBy,
                status: allergyData.status || 'active',
                notes: allergyData.notes || ''
            };

            this.allergies.set(allergy.id, allergy);

            // Update patient record
            await this.updatePatientRecordWithAllergy(patientId, allergy);

            // Create audit log
            await this.createAuditLog('allergy_added', {
                patientId,
                allergyId: allergy.id,
                allergen: allergyData.allergen,
                userId: allergyData.userId
            });

            return allergy;
        } catch (error) {
            console.error('Error adding allergy:', error);
            throw error;
        }
    }

    async getAllergies(patientId) {
        try {
            return Array.from(this.allergies.values())
                .filter(allergy => allergy.patientId === patientId)
                .sort((a, b) => new Date(b.onsetDate) - new Date(a.onsetDate));
        } catch (error) {
            console.error('Error getting allergies:', error);
            throw error;
        }
    }

    // Vital Signs Management
    async addVitalSigns(patientId, vitalData) {
        try {
            const vitalSigns = {
                id: this.generateVitalId(),
                patientId: patientId,
                date: vitalData.date || new Date().toISOString(),
                temperature: vitalData.temperature,
                bloodPressure: vitalData.bloodPressure,
                heartRate: vitalData.heartRate,
                respiratoryRate: vitalData.respiratoryRate,
                oxygenSaturation: vitalData.oxygenSaturation,
                weight: vitalData.weight,
                height: vitalData.height,
                bmi: this.calculateBMI(vitalData.weight, vitalData.height),
                painLevel: vitalData.painLevel,
                recordedBy: vitalData.recordedBy,
                notes: vitalData.notes || ''
            };

            this.vitalSigns.set(vitalSigns.id, vitalSigns);

            // Update patient record
            await this.updatePatientRecordWithVitalSigns(patientId, vitalSigns);

            // Create audit log
            await this.createAuditLog('vital_signs_added', {
                patientId,
                vitalSignsId: vitalSigns.id,
                userId: vitalData.userId
            });

            return vitalSigns;
        } catch (error) {
            console.error('Error adding vital signs:', error);
            throw error;
        }
    }

    async getVitalSigns(patientId, filters = {}) {
        try {
            let vitalSigns = Array.from(this.vitalSigns.values())
                .filter(vital => vital.patientId === patientId);

            // Apply filters
            if (filters.dateFrom) {
                vitalSigns = vitalSigns.filter(vital =>
                    new Date(vital.date) >= new Date(filters.dateFrom)
                );
            }

            if (filters.dateTo) {
                vitalSigns = vitalSigns.filter(vital =>
                    new Date(vital.date) <= new Date(filters.dateTo)
                );
            }

            return vitalSigns.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('Error getting vital signs:', error);
            throw error;
        }
    }

    // Clinical Notes Management
    async addClinicalNote(patientId, noteData) {
        try {
            const note = {
                id: this.generateNoteId(),
                patientId: patientId,
                type: noteData.type,
                title: noteData.title,
                content: noteData.content,
                author: noteData.author,
                date: noteData.date || new Date().toISOString(),
                status: noteData.status || 'draft',
                tags: noteData.tags || [],
                attachments: noteData.attachments || [],
                sharedWith: noteData.sharedWith || [],
                priority: noteData.priority || 'normal',
                followUp: noteData.followUp || null
            };

            this.notes.set(note.id, note);

            // Update patient record
            await this.updatePatientRecordWithNote(patientId, note);

            // Create audit log
            await this.createAuditLog('clinical_note_added', {
                patientId,
                noteId: note.id,
                noteType: noteData.type,
                userId: noteData.userId
            });

            return note;
        } catch (error) {
            console.error('Error adding clinical note:', error);
            throw error;
        }
    }

    async getClinicalNotes(patientId, filters = {}) {
        try {
            let notes = Array.from(this.notes.values())
                .filter(note => note.patientId === patientId);

            // Apply filters
            if (filters.type) {
                notes = notes.filter(note => note.type === filters.type);
            }

            if (filters.author) {
                notes = notes.filter(note => note.author === filters.author);
            }

            if (filters.dateFrom) {
                notes = notes.filter(note =>
                    new Date(note.date) >= new Date(filters.dateFrom)
                );
            }

            if (filters.dateTo) {
                notes = notes.filter(note =>
                    new Date(note.date) <= new Date(filters.dateTo)
                );
            }

            return notes.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('Error getting clinical notes:', error);
            throw error;
        }
    }

    // Document Management
    async addDocument(patientId, documentData) {
        try {
            const document = {
                id: this.generateDocumentId(),
                patientId: patientId,
                name: documentData.name,
                type: documentData.type,
                category: documentData.category,
                filePath: documentData.filePath,
                fileSize: documentData.fileSize,
                mimeType: documentData.mimeType,
                uploadedBy: documentData.uploadedBy,
                uploadedDate: documentData.uploadedDate || new Date().toISOString(),
                status: documentData.status || 'active',
                tags: documentData.tags || [],
                description: documentData.description || '',
                accessLevel: documentData.accessLevel || 'restricted',
                sharedWith: documentData.sharedWith || [],
                version: documentData.version || 1,
                checksum: documentData.checksum || ''
            };

            this.documentation.set(document.id, document);

            // Update patient record
            await this.updatePatientRecordWithDocument(patientId, document);

            // Create audit log
            await this.createAuditLog('document_added', {
                patientId,
                documentId: document.id,
                documentName: documentData.name,
                userId: documentData.userId
            });

            return document;
        } catch (error) {
            console.error('Error adding document:', error);
            throw error;
        }
    }

    async getDocuments(patientId, filters = {}) {
        try {
            let documents = Array.from(this.documentation.values())
                .filter(document => document.patientId === patientId);

            // Apply filters
            if (filters.type) {
                documents = documents.filter(document => document.type === filters.type);
            }

            if (filters.category) {
                documents = documents.filter(document => document.category === filters.category);
            }

            if (filters.dateFrom) {
                documents = documents.filter(document =>
                    new Date(document.uploadedDate) >= new Date(filters.dateFrom)
                );
            }

            if (filters.dateTo) {
                documents = documents.filter(document =>
                    new Date(document.uploadedDate) <= new Date(filters.dateTo)
                );
            }

            return documents.sort((a, b) => new Date(b.uploadedDate) - new Date(a.uploadedDate));
        } catch (error) {
            console.error('Error getting documents:', error);
            throw error;
        }
    }

    // Comprehensive Patient Summary
    async getPatientSummary(patientId) {
        try {
            const record = await this.getPatientRecord(patientId);
            const labResults = await this.getLabResults(patientId);
            const imaging = await this.getImagingStudies(patientId);
            const medications = await this.getMedications(patientId);
            const allergies = await this.getAllergies(patientId);
            const vitalSigns = await this.getVitalSigns(patientId);
            const notes = await this.getClinicalNotes(patientId);
            const documents = await this.getDocuments(patientId);

            return {
                patient: record,
                labResults: labResults.slice(0, 10), // Last 10 results
                imaging: imaging.slice(0, 5), // Last 5 studies
                medications: medications.filter(m => m.status === 'active'),
                allergies: allergies,
                vitalSigns: vitalSigns.slice(0, 10), // Last 10 readings
                notes: notes.slice(0, 5), // Last 5 notes
                documents: documents.slice(0, 10), // Last 10 documents
                summary: {
                    totalLabResults: labResults.length,
                    totalImagingStudies: imaging.length,
                    activeMedications: medications.filter(m => m.status === 'active').length,
                    totalAllergies: allergies.length,
                    totalNotes: notes.length,
                    totalDocuments: documents.length
                }
            };
        } catch (error) {
            console.error('Error getting patient summary:', error);
            throw error;
        }
    }

    // Utility Methods
    generateRecordId() {
        return 'REC_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateLabId() {
        return 'LAB_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateImagingId() {
        return 'IMG_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateMedicationId() {
        return 'MED_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateAllergyId() {
        return 'ALL_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateVitalId() {
        return 'VIT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateNoteId() {
        return 'NOTE_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateDocumentId() {
        return 'DOC_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    isAbnormal(result, referenceRange) {
        if (!referenceRange) return false;

        const [min, max] = referenceRange.split('-').map(Number);
        const value = parseFloat(result);

        return value < min || value > max;
    }

    calculateBMI(weight, height) {
        if (!weight || !height) return null;

        const heightInMeters = height / 100;
        return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }

    async createAuditLog(action, data) {
        // This would typically save to an audit log database
        console.log(`EHR Audit: ${action}`, data);
    }

    // Helper methods for updating patient records
    async updatePatientRecordWithLabResult(patientId, labResult) {
        const record = await this.getPatientRecord(patientId);
        if (record) {
            record.labResults.push(labResult);
            record.updated = new Date().toISOString();
        }
    }

    async updatePatientRecordWithImaging(patientId, imaging) {
        const record = await this.getPatientRecord(patientId);
        if (record) {
            record.imaging.push(imaging);
            record.updated = new Date().toISOString();
        }
    }

    async updatePatientRecordWithMedication(patientId, medication) {
        const record = await this.getPatientRecord(patientId);
        if (record) {
            record.currentMedications.push(medication);
            record.updated = new Date().toISOString();
        }
    }

    async updatePatientRecordWithAllergy(patientId, allergy) {
        const record = await this.getPatientRecord(patientId);
        if (record) {
            record.allergies.push(allergy);
            record.updated = new Date().toISOString();
        }
    }

    async updatePatientRecordWithVitalSigns(patientId, vitalSigns) {
        const record = await this.getPatientRecord(patientId);
        if (record) {
            record.vitalSigns.push(vitalSigns);
            record.updated = new Date().toISOString();
        }
    }

    async updatePatientRecordWithNote(patientId, note) {
        const record = await this.getPatientRecord(patientId);
        if (record) {
            record.notes.push(note);
            record.updated = new Date().toISOString();
        }
    }

    async updatePatientRecordWithDocument(patientId, document) {
        const record = await this.getPatientRecord(patientId);
        if (record) {
            record.documents.push(document);
            record.updated = new Date().toISOString();
        }
    }

    // Initialize data structures
    async initializeDataStructures() {
        // Initialize with empty data structures
        console.log('EHR data structures initialized');
    }

    // Load sample data
    async loadSampleData() {
        // Load sample patient records, lab results, etc.
        console.log('Sample EHR data loaded');
    }
}

module.exports = EHREngine;


