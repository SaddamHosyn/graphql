import { handleSubmit, handleLogout, switchToLoginView, switchToMainView } from './auth.js';
import { renderData } from './displayData.js';


document.addEventListener('DOMContentLoaded', () => {
    const token = sessionStorage.getItem('jwtToken');
    
    if (token) {
        switchToMainView();
        renderData();
    } else {
        switchToLoginView(); 
    }


    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        // Prevent dbl submission 
        loginForm.addEventListener('submit', async (e) => {

            const submitBtn = loginForm.querySelector('input[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            const errorMessage = document.getElementById('error-message');
            if (errorMessage) errorMessage.textContent = '';

            await handleSubmit(e);

            if (submitBtn) submitBtn.disabled = false;

            if (sessionStorage.getItem('jwtToken')) {
                console.log("Login Successful")
                switchToMainView();
                renderData();

            }
        });
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            handleLogout();
            console.log("Logout Successful")
        });
    }
});