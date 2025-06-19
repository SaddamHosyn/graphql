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
    const navigation = document.getElementById('topNavigation');
    const footer = document.getElementById('pageFooter');
    
    if (navigation) {
        navigation.style.display = 'flex';
    }
    
    if (footer) {
        footer.style.display = 'flex';
    }
}

function hideNavigationAndFooter() {
    const navigation = document.getElementById('topNavigation');
    const footer = document.getElementById('pageFooter');
    
    if (navigation) {
        navigation.style.display = 'none';
    }
    
    if (footer) {
        footer.style.display = 'none';
    }
}
