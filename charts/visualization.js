export function generateProgressChart(xpTransactions, options = {}) {
    if (!xpTransactions || xpTransactions.length === 0) {
        return '<p class="no-data">No experience data available</p>';
    }

    const sortedTransactions = [...xpTransactions].sort((a, b) =>
        new Date(a.createdAt) - new Date(b.createdAt)
    );

    const dailyGroups = groupByDate(sortedTransactions);
    const dailyTotals = Object.entries(dailyGroups).map(([date, transactions]) => {
        const dailyXP = transactions.reduce((sum, tx) => sum + tx.amount, 0);
        const projectPath = transactions[0].path;
        const timestamp = transactions[0].createdAt;
        return { date, dailyXP, projectPath, timestamp };
    });

    dailyTotals.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let cumulativeValues = [];
    let runningSum = 0;
    dailyTotals.forEach(day => {
        runningSum += day.dailyXP;
        cumulativeValues.push(runningSum);
    });

    const settings = {
        width: 1000,
        height: 400,
        padding: 50,
        lineColor: '#B79AE3',
        pointColor: '#B79AE3',
        gridColor: '#eee',
        textColor: '#4B3B53',
        ...options
    };

    const maxXP = Math.max(...cumulativeValues);
    const yAxisMax = Math.ceil(maxXP / 50000) * 50000;
    const gridLines = [];
    for (let y = 0; y <= yAxisMax; y += 50000) {
        gridLines.push(y);
    }

    const startDate = new Date(dailyTotals[0].timestamp);
    const endDate = new Date(dailyTotals[dailyTotals.length - 1].timestamp);
    let totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    if (totalDays === 0) totalDays = 1;

    const coordinates = dailyTotals.map((day, i) => {
        const daysFromStart = (new Date(day.timestamp) - startDate) / (1000 * 60 * 60 * 24);
        const x = settings.padding + (daysFromStart / totalDays) * (settings.width - 2.1 * settings.padding);
        const y = settings.padding + (settings.height - 2 * settings.padding) -
                  (cumulativeValues[i] / yAxisMax) * (settings.height - 2 * settings.padding);
        return { x, y };
    });

    let pointElements = '';
    coordinates.forEach((point, i) => {
        const color = getPointColor(dailyTotals[i].projectPath);
        pointElements += `
        <circle cx="${point.x}" cy="${point.y}" r="12" fill="transparent" pointer-events="all"/>
        <circle cx="${point.x}" cy="${point.y}" r="5" fill="${color}" stroke="#fff" stroke-width="2">
        <title>${dailyTotals[i].date}</title>
        </circle>
        `;
    });

    let svg = `
        <svg width="${settings.width}" height="${settings.height}" viewBox="0 0 ${settings.width} ${settings.height}">
            ${gridLines.map(yVal => {
                const y = settings.padding + (settings.height - 2 * settings.padding) - (yVal / yAxisMax) * (settings.height - 2 * settings.padding);
                return `
                    <line x1="${settings.padding}" y1="${y}" x2="${settings.width - settings.padding}" y2="${y}" stroke="${settings.gridColor}"/>
                    <text x="${settings.padding - 10}" y="${y + 5}" text-anchor="end" font-size="12" fill="${settings.textColor}">
                        ${yVal.toLocaleString()}
                    </text>
                `;
            }).join('')}

            <line x1="${settings.padding}" y1="${settings.height - settings.padding}" x2="${settings.width - settings.padding}" y2="${settings.height - settings.padding}" stroke="${settings.textColor}"/>

            <path d="${coordinates.map((pt, i) => (i === 0 ? `M${pt.x},${pt.y}` : `L${pt.x},${pt.y}`)).join(' ')}"
                  fill="none"
                  stroke="${settings.lineColor}"
                  stroke-width="3"/>

            ${pointElements}
        </svg>
    `;

    return svg;
}

function groupByDate(transactions) {
    const grouped = {};
    transactions.forEach(tx => {
        const date = tx.createdAt.split('T')[0];
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(tx);
    });
    return grouped;
}

function getPointColor(path) {
    if (path.includes('checkpoint')) {
        return '#AEEBFF';
    }
    if (path.includes('piscine-')) {
        return '#A9D566';
    }
    return '#FFD9A0';
}

export function generatePieChart(auditTransactions, options = {}) {
    const { upCount, downCount } = calculateAuditDistribution(auditTransactions);
    const total = upCount + downCount;
   
    const settings = {
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
             width="${settings.size}"
             height="${settings.size}"
             aria-label="Pie chart showing audit distribution">
            ${generateArcSegments(upCount, downCount, settings)}
            ${generateCenterText(upCount, downCount, upPercentage, downPercentage, settings)}
        </svg>
    `;
}

function calculateAuditDistribution(transactions) {
    const upCount = transactions.filter(t => t.type === 'up').length;
    const downCount = transactions.filter(t => t.type === 'down').length;
    return { upCount, downCount };
}

function generateArcSegments(upCount, downCount, { center, radius, colors }) {
    const total = upCount + downCount;
    const upAngle = (upCount / total) * 360;
   
    return `
        <circle cx="${center}" cy="${center}" r="${radius}"
                fill="transparent" stroke="${colors.stroke}" stroke-width="2" />
        <path d="${createArcPath(center, center, radius, -90, -90 + upAngle)}"
                fill="${colors.up}" />
        <path d="${createArcPath(center, center, radius, -90 + upAngle, -90 + 360)}"
                fill="${colors.down}" />
    `;
}

function generateCenterText(upCount, downCount, upPct, downPct, { center, colors }) {
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

function createArcPath(x, y, radius, startAngle, endAngle) {
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

export function generateBarChart(auditMetrics, options = {}) {
    const settings = {
        width: 300,
        height: 180,
        barColors: ['#FFD9A0', '#AEEBFF'],
        ...options
    };

    const categories = ['Given XP', 'Received XP'];
    const values = [
        auditMetrics.totalUp,
        auditMetrics.totalDown
    ];

    const maxValue = Math.max(...values) * 1.1;

    const barWidth = settings.width / (values.length * 2);
    const spacing = barWidth / 3;

    let barElements = '';
    values.forEach((value, i) => {
        const barHeight = (value / maxValue) * (settings.height - 40);
        const x = spacing + i * (barWidth + spacing);
        const y = settings.height - barHeight - 20;
        barElements += `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${settings.barColors[i % settings.barColors.length]}" rx="6"/>
            <text x="${x + barWidth / 2}" y="${settings.height - 5}" text-anchor="middle" font-size="12" fill="#4B3B53">${categories[i]}</text>
            <text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="12" fill="#4B3B53">${value}</text>
        `;
    });

    return `
        <svg width="${settings.width}" height="${settings.height}" viewBox="0 0 ${settings.width} ${settings.height}" aria-label="Audit Bar Chart">
            ${barElements}
        </svg>
    `;
}
