import { processLogin, performLogout, showAuthView, showDashboard } from './authentication.js';
import { populateDashboard } from './dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
    const authToken = sessionStorage.getItem('authToken');
   
    if (authToken) {
        showDashboard();
        populateDashboard();
        showNavigationAndFooter();
    } else {
        showAuthView();
        hideNavigationAndFooter();
    }

    const authForm = document.getElementById('authForm');

    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            const submitButton = authForm.querySelector('button[type="submit"]');
            if (submitButton) submitButton.disabled = true;

            const errorDisplay = document.getElementById('authError');
            if (errorDisplay) errorDisplay.textContent = '';

            await processLogin(e);

            if (submitButton) submitButton.disabled = false;

            if (sessionStorage.getItem('authToken')) {
                console.log("Authentication successful")
                showDashboard();
                populateDashboard();
                showNavigationAndFooter();
            }
        });
    }

    const signOutButton = document.getElementById('signOutBtn');
    if (signOutButton) {
        signOutButton.addEventListener('click', () => {
            performLogout();
            hideNavigationAndFooter();
            console.log("Sign out successful")
        });
    }
});

function showNavigationAndFooter() {
    showElements(['topNavigation', 'pageFooter']);
}

function hideNavigationAndFooter() {
    hideElements(['topNavigation', 'pageFooter']);
}

// Visibility utility functions
function setVisibility(elementId, isVisible) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.toggle('hidden', !isVisible);
        element.classList.toggle('visible', isVisible);
    }
}

function showElements(elementIds) {
    elementIds.forEach(id => setVisibility(id, true));
}

function hideElements(elementIds) {
    elementIds.forEach(id => setVisibility(id, false));
}
