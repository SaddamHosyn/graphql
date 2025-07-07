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
        width: 1200,
        height: 500,
        padding: 110,
        primaryColor: '#2E86AB',
        secondaryColor: '#A23B72',
        accentColor: '#F18F01',
        backgroundColor: '#F8F9FA',
        gridColor: '#E9ECEF',
        textColor: '#343A40',
        ...options
    };

    const maxXP = Math.max(...cumulativeValues);
    const yAxisMax = Math.ceil(maxXP / 25000) * 25000;
    
    // Create curved path instead of straight lines
    const startDate = new Date(dailyTotals[0].timestamp);
    const endDate = new Date(dailyTotals[dailyTotals.length - 1].timestamp);
    let totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    if (totalDays === 0) totalDays = 1;

    const coordinates = dailyTotals.map((day, i) => {
        const daysFromStart = (new Date(day.timestamp) - startDate) / (1000 * 60 * 60 * 24);
        const x = settings.padding + (daysFromStart / totalDays) * (settings.width - 2 * settings.padding);
        const y = settings.height - settings.padding - (cumulativeValues[i] / yAxisMax) * (settings.height - 2 * settings.padding);
        return { x, y, value: cumulativeValues[i], date: day.date, project: day.projectPath };
    });

    // Generate smooth curve path using cubic bezier
    const curvePath = generateSmoothCurve(coordinates);
    
    // Create gradient area under curve
    const areaPath = `${curvePath} L${coordinates[coordinates.length - 1].x},${settings.height - settings.padding} L${coordinates[0].x},${settings.height - settings.padding} Z`;

    // Generate milestone markers
  // Generate milestone markers
let milestoneMarkers = '';
const milestones = [50000, 100000, 200000, 300000, 500000];
milestones.forEach(milestone => {
    if (milestone <= maxXP) {
        const y = settings.height - settings.padding - (milestone / yAxisMax) * (settings.height - 2 * settings.padding);
        milestoneMarkers += `
            <line x1="${settings.padding - 15}" y1="${y}" x2="${settings.width - settings.padding + 15}" y2="${y}" 
                  stroke="${settings.accentColor}" stroke-width="2" stroke-dasharray="8,4" opacity="0.6"/>
            <rect x="${settings.width - settings.padding + 30}" y="${y - 12}" width="80" height="24" 
                  fill="${settings.accentColor}" rx="12" opacity="0.9"/>
            <text x="${settings.width - settings.padding + 70}" y="${y + 5}" text-anchor="middle" 
                  font-size="11" font-weight="bold" fill="black">
                ${(milestone / 1000)}K XP
            </text>
        `;
    }
});


    // Generate interactive data points with unique designs
    let dataPoints = '';
    coordinates.forEach((point, i) => {
        const projectType = getProjectType(dailyTotals[i].projectPath);
        const pointDesign = getPointDesign(projectType, point.x, point.y, i);
        
        dataPoints += `
            <g class="data-point" transform="translate(${point.x}, ${point.y})">
                ${pointDesign}
                <circle r="20" fill="transparent" style="cursor: pointer;">
                    <title>Date: ${point.date}
XP: ${point.value.toLocaleString()}
Project: ${dailyTotals[i].projectPath}</title>
                </circle>
            </g>
        `;
    });

    // Generate dynamic grid with hexagonal pattern
    let hexGrid = '';
    for (let i = 0; i < 8; i++) {
        const y = settings.padding + i * ((settings.height - 2 * settings.padding) / 7);
        hexGrid += `
            <polygon points="${settings.padding - 10},${y - 5} ${settings.padding - 5},${y - 8} ${settings.padding + 5},${y - 8} ${settings.padding + 10},${y - 5} ${settings.padding + 5},${y - 2} ${settings.padding - 5},${y - 2}"
                     fill="${settings.gridColor}" opacity="0.7"/>
        `;
    }

    let svg = `
        <svg width="${settings.width}" height="${settings.height}" viewBox="0 0 ${settings.width} ${settings.height}"
             style="background: linear-gradient(135deg, ${settings.backgroundColor} 0%, #E3F2FD 100%); border-radius: 15px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
            
            <!-- Definitions for gradients and patterns -->
            <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="${settings.primaryColor}" stop-opacity="0.3"/>
                    <stop offset="50%" stop-color="${settings.secondaryColor}" stop-opacity="0.2"/>
                    <stop offset="100%" stop-color="${settings.accentColor}" stop-opacity="0.1"/>
                </linearGradient>
                
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="${settings.primaryColor}"/>
                    <stop offset="50%" stop-color="${settings.secondaryColor}"/>
                    <stop offset="100%" stop-color="${settings.accentColor}"/>
                </linearGradient>

                <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>

                <pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="4" height="4">
                    <path d="M 0,4 l 4,-4 M -1,1 l 2,-2 M 3,5 l 2,-2" stroke="${settings.gridColor}" stroke-width="1"/>
                </pattern>
            </defs>

            <!-- Background pattern -->
            <rect width="100%" height="100%" fill="url(#diagonalHatch)" opacity="0.1"/>
            
            <!-- Hexagonal grid markers -->
            ${hexGrid}
            
            <!-- Milestone lines -->
            ${milestoneMarkers}
            
            <!-- Main axis lines with rounded ends -->
            <line x1="${settings.padding}" y1="${settings.height - settings.padding}" 
                  x2="${settings.width - settings.padding}" y2="${settings.height - settings.padding}" 
                  stroke="${settings.textColor}" stroke-width="3" stroke-linecap="round"/>
            <line x1="${settings.padding}" y1="${settings.padding}" 
                  x2="${settings.padding}" y2="${settings.height - settings.padding}" 
                  stroke="${settings.textColor}" stroke-width="3" stroke-linecap="round"/>
            
            <!-- Area under curve -->
            <path d="${areaPath}" fill="url(#areaGradient)" opacity="0.6"/>
            
            <!-- Main progress curve with glow effect -->
            <path d="${curvePath}" fill="none" stroke="url(#lineGradient)" 
                  stroke-width="4" filter="url(#glow)" stroke-linecap="round"/>
            
            <!-- Data points -->
            ${dataPoints}
            
            <!-- Chart title with decorative elements -->
            <rect x="${settings.width / 2 - 120}" y="20" width="240" height="40" 
                  fill="${settings.primaryColor}" rx="20" opacity="0.9"/>
            <text x="${settings.width / 2}" y="45" text-anchor="middle" 
                  font-size="16" font-weight="bold" fill="white">
                🚀 XP Progress Journey
            </text>
            
            <!-- Y-axis labels with custom styling -->
            ${generateYAxisLabels(yAxisMax, settings)}
            
            <!-- Progress indicator -->
            <circle cx="${coordinates[coordinates.length - 1].x}" cy="${coordinates[coordinates.length - 1].y}" 
                    r="15" fill="${settings.accentColor}" stroke="white" stroke-width="3">
                <animate attributeName="r" values="15;18;15" dur="2s" repeatCount="indefinite"/>
            </circle>
            <text x="${coordinates[coordinates.length - 1].x}" y="${coordinates[coordinates.length - 1].y + 5}" 
                  text-anchor="middle" font-size="12" font-weight="bold" fill="white">🎯</text>
        </svg>
    `;

    return svg;
}

function generateSmoothCurve(points) {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];
        
        if (i === 1) {
            // First curve
            const cp1x = prev.x + (curr.x - prev.x) * 0.3;
            const cp1y = prev.y;
            const cp2x = curr.x - (curr.x - prev.x) * 0.3;
            const cp2y = curr.y;
            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
        } else if (i === points.length - 1) {
            // Last curve
            const cp1x = prev.x + (curr.x - prev.x) * 0.3;
            const cp1y = prev.y;
            const cp2x = curr.x - (curr.x - prev.x) * 0.3;
            const cp2y = curr.y;
            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
        } else {
            // Middle curves with smooth transitions
            const prevPoint = points[i - 2] || prev;
            const cp1x = prev.x + (curr.x - prevPoint.x) * 0.2;
            const cp1y = prev.y + (curr.y - prevPoint.y) * 0.2;
            const cp2x = curr.x - (next.x - prev.x) * 0.2;
            const cp2y = curr.y - (next.y - prev.y) * 0.2;
            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
        }
    }
    
    return path;
}

function getProjectType(path) {
    if (path.includes('checkpoint')) return 'checkpoint';
    if (path.includes('piscine')) return 'piscine';
    if (path.includes('exam')) return 'exam';
    return 'project';
}

function getPointDesign(type, x, y, index) {
    const designs = {
        checkpoint: `
            <circle r="8" fill="#FF6B6B" stroke="white" stroke-width="2"/>
            <polygon points="0,-4 3,0 0,4 -3,0" fill="white"/>
        `,
        piscine: `
            <rect x="-6" y="-6" width="12" height="12" fill="#4ECDC4" stroke="white" stroke-width="2" rx="2"/>
            <circle r="3" fill="white"/>
        `,
        exam: `
            <polygon points="0,-8 7,0 0,8 -7,0" fill="#FFE66D" stroke="white" stroke-width="2"/>
            <text y="2" text-anchor="middle" font-size="8" fill="#333">!</text>
        `,
        project: `
            <circle r="6" fill="#A8E6CF" stroke="white" stroke-width="2"/>
            <circle r="2" fill="white"/>
        `
    };
    
    return designs[type] || designs.project;
}

function generateYAxisLabels(maxValue, settings) {
    let labels = '';
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
        const value = (maxValue / steps) * i;
        const y = settings.height - settings.padding - (i / steps) * (settings.height - 2 * settings.padding);
        
        labels += `
            <g transform="translate(${settings.padding - 20}, ${y})">
                <circle r="8" fill="${settings.primaryColor}" opacity="0.8"/>
                <text x="0" y="3" text-anchor="middle" font-size="10" font-weight="bold" fill="black">
                    ${Math.round(value / 1000)}K
                </text>
            </g>
        `;
    }
    return labels;
}



// Add these helper functions first
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
