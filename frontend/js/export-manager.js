/**
 * Export Manager for HMIS
 * Handles PDF, Excel, and CSV exports for various data types
 */

class ExportManager {
    constructor() {
        this.exportFormats = {
            pdf: 'application/pdf',
            excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            csv: 'text/csv',
            json: 'application/json'
        };
        this.init();
    }

    init() {
        this.setupExportButtons();
        this.loadExportLibraries();
    }

    setupExportButtons() {
        // Add export buttons to existing tables and data containers
        this.addExportButtonsToTables();
        this.createGlobalExportButton();
    }

    addExportButtonsToTables() {
        const tables = document.querySelectorAll('.data-table, .table-container');
        tables.forEach(table => {
            if (!table.querySelector('.export-buttons')) {
                const exportButtons = this.createExportButtons();
                table.parentNode.insertBefore(exportButtons, table);
            }
        });
    }

    createExportButtons() {
        const container = document.createElement('div');
        container.className = 'export-buttons';
        container.innerHTML = `
            <div class="export-actions">
                <button class="export-btn" data-format="pdf" title="Export as PDF">
                    <i class="fas fa-file-pdf"></i> PDF
                </button>
                <button class="export-btn" data-format="excel" title="Export as Excel">
                    <i class="fas fa-file-excel"></i> Excel
                </button>
                <button class="export-btn" data-format="csv" title="Export as CSV">
                    <i class="fas fa-file-csv"></i> CSV
                </button>
                <button class="export-btn" data-format="json" title="Export as JSON">
                    <i class="fas fa-file-code"></i> JSON
                </button>
            </div>
        `;

        // Add event listeners
        container.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = e.currentTarget.dataset.format;
                const table = e.currentTarget.closest('.export-buttons').nextElementSibling;
                this.exportTable(table, format);
            });
        });

        return container;
    }

    createGlobalExportButton() {
        // Check if global export button already exists
        if (document.getElementById('global-export-btn')) return;

        const globalBtn = document.createElement('button');
        globalBtn.id = 'global-export-btn';
        globalBtn.className = 'global-export-button';
        globalBtn.innerHTML = `
            <i class="fas fa-download"></i>
            <span>Export Data</span>
        `;
        globalBtn.title = 'Export current page data (Ctrl+E)';

        // Add to page
        document.body.appendChild(globalBtn);

        // Add event listener
        globalBtn.addEventListener('click', () => this.showExportModal());

        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                this.showExportModal();
            }
        });
    }

    async loadExportLibraries() {
        // Load required libraries for export functionality
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js');
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    showExportModal() {
        const modal = document.createElement('div');
        modal.className = 'export-modal';
        modal.innerHTML = `
            <div class="export-modal-content">
                <div class="export-modal-header">
                    <h3>Export Data</h3>
                    <button class="export-modal-close">&times;</button>
                </div>
                <div class="export-modal-body">
                    <div class="export-options">
                        <div class="export-option">
                            <label>
                                <input type="radio" name="export-type" value="current-page" checked>
                                Current Page Data
                            </label>
                        </div>
                        <div class="export-option">
                            <label>
                                <input type="radio" name="export-type" value="all-data">
                                All Data
                            </label>
                        </div>
                        <div class="export-option">
                            <label>
                                <input type="radio" name="export-type" value="filtered-data">
                                Filtered Data
                            </label>
                        </div>
                    </div>
                    <div class="export-formats">
                        <h4>Export Format:</h4>
                        <div class="format-options">
                            <label><input type="radio" name="export-format" value="pdf" checked> PDF</label>
                            <label><input type="radio" name="export-format" value="excel"> Excel</label>
                            <label><input type="radio" name="export-format" value="csv"> CSV</label>
                            <label><input type="radio" name="export-format" value="json"> JSON</label>
                        </div>
                    </div>
                    <div class="export-options-advanced">
                        <h4>Options:</h4>
                        <label>
                            <input type="checkbox" id="include-charts" checked>
                            Include Charts/Graphs
                        </label>
                        <label>
                            <input type="checkbox" id="include-images" checked>
                            Include Images
                        </label>
                        <label>
                            <input type="checkbox" id="include-formatting" checked>
                            Include Formatting
                        </label>
                    </div>
                </div>
                <div class="export-modal-footer">
                    <button class="export-cancel-btn">Cancel</button>
                    <button class="export-confirm-btn">Export</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        modal.querySelector('.export-modal-close').addEventListener('click', () => this.closeExportModal(modal));
        modal.querySelector('.export-cancel-btn').addEventListener('click', () => this.closeExportModal(modal));
        modal.querySelector('.export-confirm-btn').addEventListener('click', () => this.handleExportConfirm(modal));

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeExportModal(modal);
            }
        });
    }

    closeExportModal(modal) {
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }

    handleExportConfirm(modal) {
        const exportType = modal.querySelector('input[name="export-type"]:checked').value;
        const exportFormat = modal.querySelector('input[name="export-format"]:checked').value;
        const includeCharts = modal.querySelector('#include-charts').checked;
        const includeImages = modal.querySelector('#include-images').checked;
        const includeFormatting = modal.querySelector('#include-formatting').checked;

        this.performExport(exportType, exportFormat, {
            includeCharts,
            includeImages,
            includeFormatting
        });

        this.closeExportModal(modal);
    }

    async performExport(exportType, format, options) {
        try {
            this.showExportProgress();

            let data;
            switch (exportType) {
                case 'current-page':
                    data = await this.getCurrentPageData();
                    break;
                case 'all-data':
                    data = await this.getAllData();
                    break;
                case 'filtered-data':
                    data = await this.getFilteredData();
                    break;
            }

            const filename = this.generateFilename(exportType, format);

            switch (format) {
                case 'pdf':
                    await this.exportToPDF(data, filename, options);
                    break;
                case 'excel':
                    await this.exportToExcel(data, filename, options);
                    break;
                case 'csv':
                    await this.exportToCSV(data, filename);
                    break;
                case 'json':
                    await this.exportToJSON(data, filename);
                    break;
            }

            this.hideExportProgress();
            this.showExportSuccess(filename);
        } catch (error) {
            this.hideExportProgress();
            this.showExportError(error.message);
        }
    }

    async getCurrentPageData() {
        const tables = document.querySelectorAll('.data-table');
        const data = [];

        tables.forEach(table => {
            const tableData = this.extractTableData(table);
            if (tableData.length > 0) {
                data.push({
                    title: this.getTableTitle(table),
                    data: tableData
                });
            }
        });

        return data;
    }

    async getAllData() {
        // Fetch all data from API endpoints
        const endpoints = [
            '/api/patients',
            '/api/appointments',
            '/api/users',
            '/api/medical-records',
            '/api/billing'
        ];

        const data = [];
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint);
                const result = await response.json();
                data.push({
                    title: this.getEndpointTitle(endpoint),
                    data: result
                });
            } catch (error) {
                console.error(`Error fetching data from ${endpoint}:`, error);
            }
        }

        return data;
    }

    async getFilteredData() {
        // Get filtered data based on current filters
        const filters = this.getCurrentFilters();
        return await this.fetchFilteredData(filters);
    }

    extractTableData(table) {
        const rows = table.querySelectorAll('tbody tr');
        const data = [];

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const rowData = {};

            cells.forEach((cell, index) => {
                const header = table.querySelector(`thead th:nth-child(${index + 1})`);
                const key = header ? header.textContent.trim() : `column_${index}`;
                rowData[key] = cell.textContent.trim();
            });

            if (Object.keys(rowData).length > 0) {
                data.push(rowData);
            }
        });

        return data;
    }

    getTableTitle(table) {
        const titleElement = table.closest('.content-card').querySelector('h3');
        return titleElement ? titleElement.textContent : 'Table Data';
    }

    getEndpointTitle(endpoint) {
        const titles = {
            '/api/patients': 'Patients',
            '/api/appointments': 'Appointments',
            '/api/users': 'Users',
            '/api/medical-records': 'Medical Records',
            '/api/billing': 'Billing'
        };
        return titles[endpoint] || 'Data';
    }

    generateFilename(exportType, format) {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const type = exportType.replace('-', '_');
        return `hmis_${type}_${timestamp}.${format}`;
    }

    async exportToPDF(data, filename, options) {
        if (typeof window.jspdf === 'undefined') {
            throw new Error('PDF library not loaded');
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(20);
        doc.text('HMIS Data Export', 20, 20);

        // Add export info
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
        doc.text(`Total Records: ${this.getTotalRecords(data)}`, 20, 35);

        let yPosition = 50;

        data.forEach((section, index) => {
            if (index > 0) {
                doc.addPage();
                yPosition = 20;
            }

            // Add section title
            doc.setFontSize(16);
            doc.text(section.title, 20, yPosition);
            yPosition += 10;

            if (section.data.length > 0) {
                // Create table
                const tableData = this.prepareTableDataForPDF(section.data);
                doc.autoTable({
                    head: [Object.keys(tableData[0] || {})],
                    body: tableData.map(row => Object.values(row)),
                    startY: yPosition,
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [102, 126, 234] }
                });
            }
        });

        doc.save(filename);
    }

    async exportToExcel(data, filename, options) {
        if (typeof window.XLSX === 'undefined') {
            throw new Error('Excel library not loaded');
        }

        const workbook = window.XLSX.utils.book_new();

        data.forEach(section => {
            if (section.data.length > 0) {
                const worksheet = window.XLSX.utils.json_to_sheet(section.data);
                window.XLSX.utils.book_append_sheet(workbook, worksheet, section.title);
            }
        });

        window.XLSX.writeFile(workbook, filename);
    }

    async exportToCSV(data, filename) {
        let csvContent = '';

        data.forEach(section => {
            csvContent += `\n${section.title}\n`;
            csvContent += '='.repeat(section.title.length) + '\n\n';

            if (section.data.length > 0) {
                const headers = Object.keys(section.data[0]);
                csvContent += headers.join(',') + '\n';

                section.data.forEach(row => {
                    const values = headers.map(header =>
                        `"${(row[header] || '').toString().replace(/"/g, '""')}"`
                    );
                    csvContent += values.join(',') + '\n';
                });
            }

            csvContent += '\n';
        });

        this.downloadFile(csvContent, filename, 'text/csv');
    }

    async exportToJSON(data, filename) {
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, filename, 'application/json');
    }

    prepareTableDataForPDF(data) {
        return data.slice(0, 50); // Limit to 50 rows for PDF
    }

    getTotalRecords(data) {
        return data.reduce((total, section) => total + section.data.length, 0);
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    showExportProgress() {
        const progress = document.createElement('div');
        progress.id = 'export-progress';
        progress.className = 'export-progress';
        progress.innerHTML = `
            <div class="export-progress-content">
                <div class="export-spinner"></div>
                <span>Preparing export...</span>
            </div>
        `;
        document.body.appendChild(progress);
    }

    hideExportProgress() {
        const progress = document.getElementById('export-progress');
        if (progress) {
            progress.remove();
        }
    }

    showExportSuccess(filename) {
        this.showNotification(`Export completed: ${filename}`, 'success');
    }

    showExportError(message) {
        this.showNotification(`Export failed: ${message}`, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `export-notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    getCurrentFilters() {
        // Extract current filter values from the page
        const filters = {};

        // Get date range filters
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (input.value) {
                filters[input.name || input.id] = input.value;
            }
        });

        // Get select filters
        const selects = document.querySelectorAll('select');
        selects.forEach(select => {
            if (select.value && select.value !== 'all') {
                filters[select.name || select.id] = select.value;
            }
        });

        return filters;
    }

    async fetchFilteredData(filters) {
        // Fetch data with applied filters
        const queryParams = new URLSearchParams(filters);
        const response = await fetch(`/api/export/filtered?${queryParams}`);
        return await response.json();
    }
}

// Initialize export manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.exportManager = new ExportManager();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportManager;
}


