import { fetchAllData } from './fetchData.js';
import { createLineGraph, createBarGraph, createPieChart } from '../graphFunc/createGraph.js';

export async function renderData() {
    try {
        const { user, xpSum, xpTransaction, typeTransaction } = await fetchAllData();

        // Populate user info
        // Populate tables
        // Use createLineGraph(data.xpTransaction) to create SVG and insert into DOM
        // Use createPieChart(data.typeTransaction) for pie chart
        // ...etc...

        displayUserData(user);
        displayAuditInfo(user, typeTransaction);
        displayTotalXP(xpSum);

        displayLineGraph(xpTransaction);
        displayAuditBarGraph(user);
        displayAuditRatioBig(user);
        displayAuditData(typeTransaction);

    } catch (err) {
        console.error('Error fetching data:', err)
        throw err;
    }
}

// Display data on dashboard cards
function displayUserData(userData) {
    if (!userData) return;

    const userDataDiv = document.getElementById('userData');
    userDataDiv.innerHTML = `
        <p>Name: ${userData.firstName} ${userData.lastName}</p>
        <p>LoginID: ${userData.login}</p>
        <p>ID: ${userData.id}</p>
    `;
}

function displayAuditInfo(user, typeTransaction) {
    const auditRatio = document.getElementById('auditRatio');
    const auditType = document.getElementById('auditType')

    const roundedAuditRatio = parseFloat(user.auditRatio).toFixed(1);  
    
    auditRatio.innerHTML = `
        <p>Audit Ratio: ${roundedAuditRatio}</p>
        <p>Audit Done XP: ${user.totalUp}</p>
        <p>Audit Received XP: ${user.totalDown}</p>
    `;


    const totalUp = typeTransaction.filter(t => t.type === 'up').length;
    const totalDown = typeTransaction.filter(t => t.type === 'down').length;
    const total = totalUp + totalDown;

    auditType.innerHTML = `
        <p>Total Audits: ${total}</p>
        <p>Audits Given: ${totalUp}</p>
        <p>Audits Received: ${totalDown}</p>
    `
}

function displayTotalXP(xpSum) {
    const xpDiv = document.getElementById('dataInfo');
    xpDiv.innerHTML = `
    <p>Total: ${xpSum}</p>
    `;
}
// Line graph for xp prog //

function displayLineGraph(xpTransaction) {
    const graphExpDiv = document.getElementById('graphExp');

    if (!graphExpDiv) return;
    graphExpDiv.innerHTML = createLineGraph(xpTransaction, {
        // Optional: Override defaults here
        width: 700,
        lineColor: '#6216d4'
    });
}
// Pie Graph //

function displayAuditData(typeTransaction) {
    const pieChartHTML = createPieChart(typeTransaction);
    document.getElementById('graphPie').innerHTML = pieChartHTML;
}


// Bar Graph //
function displayAuditRatioBig(user) {
    const auditRatioBigDiv = document.getElementById('auditRatioBig');
    if (!auditRatioBigDiv) return;

    let auditRatio = user.auditRatio;
    let displayHTML;

    try {
        // Handle null, empty, or zero values, or if conversion to number fails
        if (
            auditRatio === null ||
            auditRatio === '' ||
            isNaN(Number(auditRatio)) ||
            Number(auditRatio) === 0
        ) {
            displayHTML = `
                <span style="font-size:2rem;color:#B79AE3;">N/A</span>
                <span style="font-size:1.2rem;color:#4B3B53;">Audit Ratio</span>
            `;
        } else {
            const roundedAuditRatio = Number(auditRatio).toFixed(1);
            displayHTML = `
                <span style="font-size:3rem;font-weight:bold;color:#B79AE3;">
                    ${roundedAuditRatio}
                </span>
                <span style="font-size:1.2rem;color:#4B3B53;margin-left:12px;">
                    Audit Ratio
                </span>
            `;
        }
    } catch (e) {
        // Fallback for any unexpected errors
        displayHTML = `
            <span style="font-size:2rem;color:#B79AE3;">N/A</span>
            <span style="font-size:1.2rem;color:#4B3B53;">Audit Ratio</span>
        `;
    }

    auditRatioBigDiv.innerHTML = displayHTML;
}

function displayAuditBarGraph(user) {
    const auditData = {
        auditRatio: parseFloat(user.auditRatio).toFixed(1),
        totalUp: user.totalUp,
        totalDown: user.totalDown
    };
    const barGraphSVG = createBarGraph(auditData);
    document.getElementById('graphBar').innerHTML = barGraphSVG;
}

