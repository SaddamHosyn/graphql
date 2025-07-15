const AUTH_ENDPOINT = 'https://01.gritlab.ax/api/auth/signin';

export async function processLogin(event) {
    event.preventDefault();

    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('userPassword');
    const errorDisplay = document.getElementById('authError');

    if (!usernameField.value || !passwordField.value) {
        errorDisplay.textContent = 'Both fields are required.';
        return;
    }

    const userCredentials = `${usernameField.value}:${passwordField.value}`;
    const encodedAuth = btoa(userCredentials);

    await authenticateUser(encodedAuth, errorDisplay);
}

async function authenticateUser(encodedAuth, errorDisplay) {
    try {
        const response = await fetch(AUTH_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${encodedAuth}`,
                'Accept': 'application/json'
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                errorDisplay.textContent = 'Authentication failed. Check your credentials.';
            } else if (response.status >= 500) {
                errorDisplay.textContent = 'Server unavailable. Try again later.';
            } else {
                errorDisplay.textContent = `Authentication error (${response.status}).`;
            }
            return false;
        }

        const authToken = await response.json();
        if (!authToken) {
            errorDisplay.textContent = 'Authentication token not received.';
            return false;
        }

        saveAuthToken(authToken);
        errorDisplay.textContent = '';
        return true;

    } catch (error) {
        console.error('Authentication error:', error);
        errorDisplay.textContent = 'Connection error. Check your network.';
        return false;
    }
}

function saveAuthToken(token) {
    sessionStorage.setItem('authToken', token);
}

export function performLogout() {
    sessionStorage.removeItem('authToken');
    sessionStorage.clear();
    showAuthView();
}

export function showDashboard() {
    console.log("Displaying dashboard");
    hideElements(['authContainer']);
    showElements(['topNavigation', 'dashboardContainer', 'pageFooter']);
}

export function showAuthView() {
    console.log("Displaying authentication");
    showElements(['authContainer']);
    hideElements(['topNavigation', 'dashboardContainer', 'pageFooter']);
}


// Password toggle functionality
export function initializePasswordToggle() {
    const togglePassword = document.getElementById('togglePassword');
    const passwordField = document.getElementById('userPassword');
    
    if (togglePassword && passwordField) {
        togglePassword.addEventListener('change', function() {
            if (this.checked) {
                passwordField.type = 'text';
            } else {
                passwordField.type = 'password';
            }
        });
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', initializePasswordToggle);

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
