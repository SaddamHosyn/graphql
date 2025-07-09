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
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('topNavigation').style.display = 'flex';
    document.getElementById('dashboardContainer').style.display = 'flex';
    document.getElementById('pageFooter').hidden = false;
}

export function showAuthView() {
    console.log("Displaying authentication");
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('topNavigation').style.display = 'none';
    document.getElementById('dashboardContainer').style.display = 'none';
    document.getElementById('pageFooter').hidden = true;
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
