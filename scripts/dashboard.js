import { loadUserData } from './dataService.js';
import { generateProgressChart, generateBarChart, generatePieChart } from '../charts/visualization.js';

export async function populateDashboard() {
    try {
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
    profileContainer.innerHTML = `
        <p>Full Name: ${profileData.firstName} ${profileData.lastName}</p>
        <p>Username: ${profileData.login}</p>
        <p>User ID: ${profileData.id}</p>
    `;
}

function renderAuditInformation(profile, auditData) {
    const auditContainer = document.getElementById('auditMetrics');
    const auditStatsContainer = document.getElementById('auditStats')

    const formattedRatio = parseFloat(profile.auditRatio).toFixed(1);  
   
    auditContainer.innerHTML = `
        <p>Performance Ratio: ${formattedRatio}</p>
        <p>Given Audit XP: ${profile.totalUp}</p>
        <p>Received Audit XP: ${profile.totalDown}</p>
    `;

    const givenAudits = auditData.filter(t => t.type === 'up').length;
    const receivedAudits = auditData.filter(t => t.type === 'down').length;
    const totalAudits = givenAudits + receivedAudits;

    auditStatsContainer.innerHTML = `
        <p>Total Audits: ${totalAudits}</p>
        <p>Given: ${givenAudits}</p>
        <p>Received: ${receivedAudits}</p>
    `
}

function renderExperienceTotal(totalXP) {
    const xpContainer = document.getElementById('experienceDetails');
    xpContainer.innerHTML = `
        <p>Total XP: ${totalXP}</p>
    `;
}

function renderProgressVisualization(xpHistory) {
    const chartContainer = document.getElementById('progressChart');
    if (!chartContainer) return;
    
    // Generate the base chart SVG
    let chartSVG = generateProgressChart(xpHistory);
    
    // Add gradient definition to the SVG
    if (chartSVG.includes('<svg')) {
        // Find the opening svg tag and add the gradient definition after it
        const svgOpenTag = chartSVG.match(/<svg[^>]*>/)[0];
        const gradientDefs = `
            <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#B79AE3" />
                    <stop offset="50%" stop-color="#d41664" />
                    <stop offset="100%" stop-color="#3d5482" />
                </linearGradient>
            </defs>`;
        
        chartSVG = chartSVG.replace(svgOpenTag, svgOpenTag + gradientDefs);
    }
    
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
            ratioContainer.innerHTML = `
                <span class="ratio-value ratio-na">N/A</span>
                <span class="ratio-label">Audit Ratio</span>
            `;
            ratioContainer.classList.add('ratio-unavailable');
        } else {
            const formattedRatio = Number(auditRatio).toFixed(1);
            ratioContainer.innerHTML = `
                <span class="ratio-value ratio-active">${formattedRatio}</span>
                <span class="ratio-label">Audit Ratio</span>
            `;
            ratioContainer.classList.add('ratio-available');
        }
    } catch (e) {
        ratioContainer.innerHTML = `
            <span class="ratio-value ratio-na">N/A</span>
            <span class="ratio-label">Audit Ratio</span>
        `;
        ratioContainer.classList.add('ratio-error');
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
