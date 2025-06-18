export function createLineGraph(xpTransactions, options = {}) {
    if (!xpTransactions || xpTransactions.length === 0) {
        return '<p class="no-data">No XP data available</p>';
    }

    // Sort transactions by date (oldest first)
    const sorted = [...xpTransactions].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
    );

    // tx per day
    const grouped = groupTransactionsByDate(sorted);
    const dailyData = Object.entries(grouped).map(([date, txs]) => {
        const totalXP = txs.reduce((sum, tx) => sum + tx.amount, 0);
        const path = txs[0].path; // Use first transaction's path for marker color
        const createdAt = txs[0].createdAt; // Use first transaction's timestamp for sorting
        return { date, totalXP, path, createdAt };
    });

    // Sort daily data by date
    dailyData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Calculate cumulative XP
    let cumulativeXP = [];
    let runningTotal = 0;
    dailyData.forEach(day => {
        runningTotal += day.totalXP;
        cumulativeXP.push(runningTotal);
    });

    // Config with defaults; 
    // can be overridden if "options" or a new object of config is passed
    const config = {
        width: 1000,
        height: 400,
        padding: 50,
        lineColor: '#B79AE3',
        pointColor: '#B79AE3',
        gridColor: '#eee',
        textColor: '#4B3B53',
        ...options
    };

    // Calculate Y-axis grid lines (50k increments)
    const maxXP = Math.max(...cumulativeXP);
    const yMax = Math.ceil(maxXP / 50000) * 50000;
    const gridLines = [];
    for (let y = 0; y <= yMax; y += 50000) {
        gridLines.push(y);
    }

    // --- Date-proportional X-axis calculation ---
    const firstDate = new Date(dailyData[0].createdAt);
    const lastDate = new Date(dailyData[dailyData.length - 1].createdAt);
    let totalDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24); // 86,400,000 milliseconds in a day; 86,400 seconds, 1,440 minutes,
    if (totalDays === 0) totalDays = 1; // Prevent division by zero for single point

    const points = dailyData.map((day, i) => {
        const daysFromStart = (new Date(day.createdAt) - firstDate) / (1000 * 60 * 60 * 24);
        const x = config.padding + (daysFromStart / totalDays) * (config.width - 2.1 * config.padding);
        const y = config.padding + (config.height - 2 * config.padding) - 
                  (cumulativeXP[i] / yMax) * (config.height - 2 * config.padding);
        return { x, y };
    });

    // Build colored markers for each point using getMarkerColor
    let pointsSVG = '';
    points.forEach((pt, i) => {
        const color = getMarkerColor(dailyData[i].path);
        pointsSVG += `
        <circle cx="${pt.x}" cy="${pt.y}" r="12" fill="transparent" pointer-events="all"/>
        <circle cx="${pt.x}" cy="${pt.y}" r="5" fill="${color}" stroke="#fff" stroke-width="2">
        <title>${dailyData[i].date}</title>
        </circle>
        `;
    });

    let svg = `
        <svg width="${config.width}" height="${config.height}" viewBox="0 0 ${config.width} ${config.height}">
            <!-- Y-axis grid lines -->
            ${gridLines.map(yVal => {
                const y = config.padding + (config.height - 2 * config.padding) - (yVal / yMax) * (config.height - 2 * config.padding);
                return `
                    <line x1="${config.padding}" y1="${y}" x2="${config.width - config.padding}" y2="${y}" stroke="${config.gridColor}"/>
                    <text x="${config.padding - 10}" y="${y + 5}" text-anchor="end" font-size="12" fill="${config.textColor}">
                        ${yVal.toLocaleString()}
                    </text>
                `;
            }).join('')}

            <!-- X-axis line -->
            <line x1="${config.padding}" y1="${config.height - config.padding}" x2="${config.width - config.padding}" y2="${config.height - config.padding}" stroke="${config.textColor}"/>

            <!-- Line path -->
            <path d="${points.map((pt, i) => (i === 0 ? `M${pt.x},${pt.y}` : `L${pt.x},${pt.y}`)).join(' ')}" 
                  fill="none" 
                  stroke="${config.lineColor}" 
                  stroke-width="3"/>

            <!-- Colored Data points (one per day) -->
            ${pointsSVG}
        </svg>
    `;

    return svg;
}

// helper func for LineGraph
function groupTransactionsByDate(transactions) {
    const grouped = {};
    transactions.forEach(tx => {
        const date = tx.createdAt.split('T')[0]; // "YYYY-MM-DD"
        if (!grouped[date]) {
            //creating new arr for date
            grouped[date] = [];
        }
        grouped[date].push(tx);
    });
    // returning the object of arrays of the "date"
    return grouped;
}

function getMarkerColor(path) {
    if (path.includes('checkpoint')) {
        return '#AEEBFF'; 
    }
    if (path.includes('piscine-')) {
        return '#A9D566'; 
    }
    return '#FFD9A0'; 
}


// ---- PieChart ---- //
export function createPieChart(typeTransaction, options = {}) {
    const { upCount, downCount } = calculateAuditCounts(typeTransaction);
    const total = upCount + downCount;
    
    // Default configuration
    const config = {
        size: 300,
        radius: 40,
        center: 50,
        colors: {
            up: '#D4EAB2',
            down: '#B79AE3',
            stroke: '#00FF9B',
            text: '#4B3B53'
        },
        ...options
    };

    if (total === 0) {
        return '<p class="no-data">No audit data available</p>';
    }

    const upPercentage = Math.round((upCount / total) * 100);
    const downPercentage = Math.round((downCount / total) * 100);

    return `
        <svg viewBox="0 0 100 100" 
             width="${config.size}" 
             height="${config.size}"
             aria-label="Pie chart showing audit distribution">
            ${createArcPaths(upCount, downCount, config)}
            ${createCenterLabels(upCount, downCount, upPercentage, downPercentage, config)}
        </svg>
    `;
}

// Helper functions for pie chart
function calculateAuditCounts(transactions) {
    const upCount = transactions.filter(t => t.type === 'up').length;
    const downCount = transactions.filter(t => t.type === 'down').length;
    return { upCount, downCount };
}

function createArcPaths(upCount, downCount, { center, radius, colors }) {
    const total = upCount + downCount;
    const upAngle = (upCount / total) * 360;
    
    return `
        <circle cx="${center}" cy="${center}" r="${radius}" 
                fill="transparent" stroke="${colors.stroke}" stroke-width="2" />
        <path d="${describeArc(center, center, radius, -90, -90 + upAngle)}" 
                fill="${colors.up}" />
        <path d="${describeArc(center, center, radius, -90 + upAngle, -90 + 360)}" 
                fill="${colors.down}" />
    `;
}

function createCenterLabels(upCount, downCount, upPct, downPct, { center, colors }) {
    const labelY = center - 5;
    return `
        <text x="${center}" y="${labelY - 2}" text-anchor="middle" 
            font-size="6" fill="${colors.text}">
            Up: ${upCount} (${upPct}%)
        </text>
        <text x="${center}" y="${labelY + 14}" text-anchor="middle" 
            font-size="6" fill="${colors.text}">
            Down: ${downCount} (${downPct}%)
        </text>
    `;
}

// Keep these as private helpers
function describeArc(x, y, radius, startAngle, endAngle) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? "0" : "1";

    return [
        "M", x, y,
        "L", start.x, start.y,
        "A", radius, radius, 0, largeArc, 0, end.x, end.y,
        "L", x, y, "Z"
    ].join(" ");
}

function polarToCartesian(centerX, centerY, radius, angleDeg) {
    const angleRad = (angleDeg - 90) * Math.PI / 180;
    return {
        x: centerX + radius * Math.cos(angleRad),
        y: centerY + radius * Math.sin(angleRad)
    };
}



// --- Bar Graph --- //

export function createBarGraph(auditData, options = {}) {
    // auditData: { totalUp, totalDown }
    // options: { width, height, barColors, ... }

    const config = {
        width: 300,
        height: 180,
        barColors: ['#FFD9A0', '#AEEBFF'],
        ...options
    };

    const labels = ['Done XP', 'Received XP'];
    const values = [
        auditData.totalUp,
        auditData.totalDown
    ];

    const maxValue = Math.max(...values) * 1.1; // Add 11% headroom

    const barWidth = config.width / (values.length * 2);
    const gap = barWidth / 3;

    let bars = '';
    values.forEach((val, i) => {
        const barHeight = (val / maxValue) * (config.height - 40); // leave space for labels
        const x = gap + i * (barWidth + gap);
        const y = config.height - barHeight - 20; // leave space for x labels
        bars += `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${config.barColors[i % config.barColors.length]}" rx="6"/>
            <text x="${x + barWidth / 2}" y="${config.height - 5}" text-anchor="middle" font-size="12" fill="#4B3B53">${labels[i]}</text>
            <text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="12" fill="#4B3B53">${val}</text>
        `;
    });

    return `
        <svg width="${config.width}" height="${config.height}" viewBox="0 0 ${config.width} ${config.height}" aria-label="Audit Bar Graph">
            ${bars}
        </svg>
    `;
}
