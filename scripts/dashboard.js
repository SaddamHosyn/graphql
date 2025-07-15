import { loadUserData } from './dataService.js';
import { generateProgressChart, generateBarChart, generatePieChart } from '../charts/visualization.js';

// Template utility functions
function useTemplate(templateId, data) {
    const template = document.getElementById(templateId);
    if (!template) {
        console.warn(`Template ${templateId} not found`);
        return '';
    }
    
    const clone = template.cloneNode(true);
    clone.classList.remove('template');
    
    // Populate template with data
    Object.keys(data).forEach(key => {
        const element = clone.querySelector(`.${key}`);
        if (element) {
            element.textContent = data[key];
        }
    });
    
    return clone.innerHTML;
}

function addVisibilityClasses() {
    const elements = {
        auth: document.getElementById('authContainer'),
        navigation: document.getElementById('topNavigation'),
        dashboard: document.getElementById('dashboardContainer'),
        footer: document.getElementById('pageFooter')
    };
    
    // Add utility classes for visibility control
    Object.keys(elements).forEach(key => {
        if (elements[key]) {
            elements[key].classList.add(`${key}-container`);
        }
    });
}

export async function populateDashboard() {
    try {
        // Initialize visibility classes
        addVisibilityClasses();
        
        const { profile, totalXP, xpHistory, auditData } = await loadUserData();

        renderProfileInfo(profile);
        renderAuditInformation(profile, auditData);
        renderExperienceTotal(totalXP);

        renderProgressVisualization(xpHistory);
        renderAuditBarChart(profile);
        renderAuditRatioDisplay(profile);
        renderAuditPieChart(auditData);

    } catch (err) {
        console.error('Dashboard population failed:', err)
        throw err;
    }
}

function renderProfileInfo(profileData) {
    if (!profileData) return;

    const profileContainer = document.getElementById('profileDetails');
    profileContainer.innerHTML = useTemplate('profileInfoTemplate', {
        'profile-name': `${profileData.firstName} ${profileData.lastName}`,
        'profile-username': profileData.login,
        'profile-id': profileData.id
    });
}

function renderAuditInformation(profile, auditData) {
    const auditContainer = document.getElementById('auditMetrics');
    const auditStatsContainer = document.getElementById('auditStats')

    const formattedRatio = parseFloat(profile.auditRatio).toFixed(1);  
   
    auditContainer.innerHTML = useTemplate('auditInfoTemplate', {
        'audit-ratio': formattedRatio,
        'audit-up': profile.totalUp,
        'audit-down': profile.totalDown
    });

    const givenAudits = auditData.filter(t => t.type === 'up').length;
    const receivedAudits = auditData.filter(t => t.type === 'down').length;
    const totalAudits = givenAudits + receivedAudits;

    auditStatsContainer.innerHTML = useTemplate('auditStatsTemplate', {
        'total-audits': totalAudits,
        'given-audits': givenAudits,
        'received-audits': receivedAudits
    });
}

function renderExperienceTotal(totalXP) {
    const xpContainer = document.getElementById('experienceDetails');
    xpContainer.innerHTML = useTemplate('experienceTemplate', {
        'total-xp': totalXP
    });
}

function renderProgressVisualization(xpHistory) {
    const chartContainer = document.getElementById('progressChart');
    if (!chartContainer) return;
    
    const chartSVG = generateProgressChart(xpHistory);
    chartContainer.innerHTML = chartSVG;
    chartContainer.classList.add('progress-chart-wrapper');
}

function renderAuditPieChart(auditData) {
    const pieChartSVG = generatePieChart(auditData);
    const pieContainer = document.getElementById('pieChartContainer');
    pieContainer.innerHTML = pieChartSVG;
    pieContainer.classList.add('pie-chart-wrapper');
}

function renderAuditRatioDisplay(profile) {
    const ratioContainer = document.getElementById('auditRatioDisplay');
    if (!ratioContainer) return;

    let auditRatio = profile.auditRatio;
    
    ratioContainer.innerHTML = '';
    ratioContainer.className = 'ratio-display';

    try {
        if (
            auditRatio === null ||
            auditRatio === '' ||
            isNaN(Number(auditRatio)) ||
            Number(auditRatio) === 0
        ) {
            ratioContainer.innerHTML = useTemplate('auditRatioTemplate', {
                'ratio-value': 'N/A'
            });
            ratioContainer.classList.add('ratio-unavailable');
            ratioContainer.querySelector('.ratio-value').classList.add('ratio-na');
        } else {
            const formattedRatio = Number(auditRatio).toFixed(1);
            ratioContainer.innerHTML = useTemplate('auditRatioTemplate', {
                'ratio-value': formattedRatio
            });
            ratioContainer.classList.add('ratio-available');
            ratioContainer.querySelector('.ratio-value').classList.add('ratio-active');
        }
    } catch (e) {
        ratioContainer.innerHTML = useTemplate('auditRatioTemplate', {
            'ratio-value': 'N/A'
        });
        ratioContainer.classList.add('ratio-error');
        ratioContainer.querySelector('.ratio-value').classList.add('ratio-na');
    }
}

function renderAuditBarChart(profile) {
    const auditMetrics = {
        auditRatio: parseFloat(profile.auditRatio).toFixed(1),
        totalUp: profile.totalUp,
        totalDown: profile.totalDown
    };
    const barChartSVG = generateBarChart(auditMetrics);
    const barContainer = document.getElementById('barChartContainer');
    barContainer.innerHTML = barChartSVG;
    barContainer.classList.add('bar-chart-wrapper');
}
