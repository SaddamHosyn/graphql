import { processLogin, performLogout, showAuthView, showDashboard } from './authentication.js';
import { populateDashboard } from './dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
    const authToken = sessionStorage.getItem('authToken');
   
    if (authToken) {
        showDashboard();
        populateDashboard();
    } else {
        showAuthView();
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
            }
        });
    }

    const signOutButton = document.getElementById('signOutBtn');
    if (signOutButton) {
        signOutButton.addEventListener('click', () => {
            performLogout();
            console.log("Sign out successful")
        });
    }
});
