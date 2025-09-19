/**
 * Modal System Module
 * Handles modal dialogs and overlays
 */

class ModalSystem {
    constructor() {
        this.activeModal = null;
        this.init();
    }

    init() {
        this.createModalOverlay();
        this.setupEventListeners();
    }

    createModalOverlay() {
        if (document.getElementById('modal-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        overlay.className = 'modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        document.body.appendChild(overlay);
    }

    setupEventListeners() {
        // Close modal when clicking overlay
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.closeModal();
            }
        });
    }

    showModal(title, content, size = 'medium', options = {}) {
        const overlay = document.getElementById('modal-overlay');
        if (!overlay) return;

        // Remove existing modal content
        const existingModal = overlay.querySelector('.modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal
        const modal = this.createModal(title, content, size, options);
        overlay.appendChild(modal);

        // Show modal
        overlay.style.display = 'flex';
        this.activeModal = modal;

        // Focus first input if any
        setTimeout(() => {
            const firstInput = modal.querySelector('input, textarea, select');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);

        return modal;
    }

    createModal(title, content, size, options) {
        const modal = document.createElement('div');
        modal.className = `modal modal-${size}`;

        const sizeStyles = {
            'small': 'max-width: 400px;',
            'medium': 'max-width: 600px;',
            'large': 'max-width: 800px;',
            'xlarge': 'max-width: 1200px;'
        };

        modal.style.cssText = `
            background: white;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            ${sizeStyles[size] || sizeStyles.medium}
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
        `;

        // Modal header
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.style.cssText = `
            padding: 20px 20px 0 20px;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 20px;
        `;

        const titleEl = document.createElement('h3');
        titleEl.textContent = title;
        titleEl.style.cssText = `
            margin: 0 0 10px 0;
            color: #1f2937;
            font-size: 1.25rem;
            font-weight: 600;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.className = 'modal-close';
        closeBtn.style.cssText = `
            position: absolute;
            top: 15px;
            right: 15px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6b7280;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeBtn.onclick = () => this.closeModal();

        header.appendChild(titleEl);
        header.appendChild(closeBtn);

        // Modal body
        const body = document.createElement('div');
        body.className = 'modal-body';
        body.style.cssText = `
            padding: 0 20px 20px 20px;
        `;

        if (typeof content === 'string') {
            body.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            body.appendChild(content);
        } else if (typeof content === 'function') {
            const contentEl = content();
            if (contentEl instanceof HTMLElement) {
                body.appendChild(contentEl);
            } else {
                body.innerHTML = contentEl;
            }
        }

        // Modal footer
        let footer = null;
        if (options.buttons) {
            footer = document.createElement('div');
            footer.className = 'modal-footer';
            footer.style.cssText = `
                padding: 20px;
                border-top: 1px solid #e5e7eb;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            `;

            options.buttons.forEach(button => {
                const btn = document.createElement('button');
                btn.textContent = button.text;
                btn.className = button.class || 'btn btn-secondary';
                btn.onclick = button.onclick;
                footer.appendChild(btn);
            });
        }

        // Assemble modal
        modal.appendChild(header);
        modal.appendChild(body);
        if (footer) {
            modal.appendChild(footer);
        }

        return modal;
    }

    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            const modal = overlay.querySelector('.modal');
            if (modal) {
                modal.remove();
            }
        }
        this.activeModal = null;
    }

    // Confirmation modal
    showConfirm(title, message, onConfirm, onCancel = null) {
        const content = `
            <p style="margin: 0; color: #6b7280;">${message}</p>
        `;

        const buttons = [
            {
                text: 'Cancel',
                class: 'btn btn-secondary',
                onclick: () => {
                    this.closeModal();
                    if (onCancel) onCancel();
                }
            },
            {
                text: 'Confirm',
                class: 'btn btn-danger',
                onclick: () => {
                    this.closeModal();
                    if (onConfirm) onConfirm();
                }
            }
        ];

        return this.showModal(title, content, 'small', { buttons });
    }

    // Alert modal
    showAlert(title, message, type = 'info') {
        const icons = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };

        const content = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">${icons[type] || icons.info}</span>
                <p style="margin: 0; color: #6b7280;">${message}</p>
            </div>
        `;

        const buttons = [
            {
                text: 'OK',
                class: 'btn btn-primary',
                onclick: () => this.closeModal()
            }
        ];

        return this.showModal(title, content, 'small', { buttons });
    }

    // Loading modal
    showLoading(title = 'Loading...', message = 'Please wait...') {
        const content = `
            <div style="text-align: center; padding: 20px;">
                <div class="spinner" style="
                    border: 4px solid #f3f4f6;
                    border-top: 4px solid #3b82f6;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px auto;
                "></div>
                <p style="margin: 0; color: #6b7280;">${message}</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;

        return this.showModal(title, content, 'small');
    }
}

// Make ModalSystem available globally
window.ModalSystem = ModalSystem;
