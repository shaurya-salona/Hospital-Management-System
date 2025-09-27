// Quick fix for stuck modals
(function() {
    'use strict';

    // Function to close all modals
    function closeAllModals() {
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'none';
            modalOverlay.classList.add('hidden');
        }

        // Also try to close any other modals
        const allModals = document.querySelectorAll('.modal-overlay, .modal, [class*="modal"]');
        allModals.forEach(modal => {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        });
    }

    // Close modals on page load
    document.addEventListener('DOMContentLoaded', function() {
        closeAllModals();
    });

    // Close modals immediately
    closeAllModals();

    // Add global close function
    window.closeModal = function() {
        closeAllModals();
    };

    // Add escape key listener
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAllModals();
        }
    });

    // Add click outside listener
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal-overlay') ||
            event.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    console.log('Modal fix script loaded - all modals should be closed');
})();

