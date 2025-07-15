export function generateProgressChart(xpTransactions, options = {}) {
    if (!xpTransactions || xpTransactions.length === 0) {
        return generateNoDataHTML('No experience data available');
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
        primaryColor: '#4ECDC4',
        secondaryColor: '#FF6B9D',
        accentColor: '#FFE66D',
        backgroundColor: '#1A252F',
        gridColor: '#2C3E50',
        textColor: '#FFFFFF',
        ...options
    };

    const maxXP = Math.max(...cumulativeValues);
    const yAxisMax = Math.ceil(maxXP / 25000) * 25000;
    
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

    const curvePath = generateSmoothCurve(coordinates);
    const areaPath = `${curvePath} L${coordinates[coordinates.length - 1].x},${settings.height - settings.padding} L${coordinates[0].x},${settings.height - settings.padding} Z`;

    // Enhanced milestone markers
    let milestoneMarkers = '';
    const milestones = [50000, 100000, 200000, 300000, 500000];
    milestones.forEach(milestone => {
        if (milestone <= maxXP) {
            const y = settings.height - settings.padding - (milestone / yAxisMax) * (settings.height - 2 * settings.padding);
            milestoneMarkers += `
                <line x1="${settings.padding - 15}" y1="${y}" x2="${settings.width - settings.padding + 15}" y2="${y}" 
                      stroke="${settings.accentColor}" stroke-width="2" stroke-dasharray="8,4" opacity="0.6">
                    <animate attributeName="opacity" values="0.6;0.8;0.6" dur="3s" repeatCount="indefinite"/>
                </line>
                <rect x="${settings.width - settings.padding + 30}" y="${y - 12}" width="80" height="24" 
                      fill="url(#milestoneGradient)" rx="12" opacity="0.9" filter="url(#progressGlow)"/>
                <text x="${settings.width - settings.padding + 70}" y="${y + 5}" text-anchor="middle" 
                      font-size="11" font-weight="bold" fill="${settings.textColor}">
                    ${(milestone / 1000)}K XP
                </text>
            `;
        }
    });

    // Enhanced data points with animations
    let dataPoints = '';
    coordinates.forEach((point, i) => {
        const projectType = getProjectType(dailyTotals[i].projectPath);
        const pointDesign = getPointDesign(projectType, point.x, point.y, i);
        
        dataPoints += `
            <g class="data-point" transform="translate(${point.x}, ${point.y})" opacity="0">
                ${pointDesign}
                <circle r="20" fill="transparent" style="cursor: pointer;">
                    <title>Date: ${point.date}
XP: ${point.value.toLocaleString()}
Project: ${dailyTotals[i].projectPath}</title>
                </circle>
                <animate attributeName="opacity" from="0" to="1" dur="0.8s" begin="${i * 0.2 + 1}s" fill="freeze"/>
            </g>
        `;
    });

    // Floating particles animation
    let floatingParticles = '';
    for (let i = 0; i < 8; i++) {
        const x = settings.padding + Math.random() * (settings.width - 2 * settings.padding);
        const y = settings.padding + Math.random() * (settings.height - 2 * settings.padding);
        const color = i % 2 === 0 ? settings.primaryColor : settings.secondaryColor;
        floatingParticles += `
            <circle cx="${x}" cy="${y}" r="1.5" fill="${color}" opacity="0.4">
                <animate attributeName="cy" values="${y};${y - 20};${y}" dur="${3 + i}s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.4;0.8;0.4" dur="${3 + i}s" repeatCount="indefinite"/>
            </circle>
        `;
    }

    let svg = `
        <svg width="${settings.width}" height="${settings.height}" viewBox="0 0 ${settings.width} ${settings.height}"
             style="background: radial-gradient(ellipse at center, ${settings.backgroundColor} 0%, #0F1419 100%); 
                    border-radius: 20px; 
                    box-shadow: 0 15px 35px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);"
             aria-label="Enhanced XP Progress Chart">
            
            <defs>
                <!-- Enhanced gradients -->
                <radialGradient id="areaGradient" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="${settings.primaryColor}" stop-opacity="0.4"/>
                    <stop offset="50%" stop-color="${settings.secondaryColor}" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="${settings.accentColor}" stop-opacity="0.1"/>
                </radialGradient>
                
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="${settings.primaryColor}"/>
                    <stop offset="50%" stop-color="${settings.secondaryColor}"/>
                    <stop offset="100%" stop-color="${settings.accentColor}"/>
                </linearGradient>

                <linearGradient id="milestoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${settings.accentColor}" stop-opacity="1"/>
                    <stop offset="100%" stop-color="#FFA500" stop-opacity="0.8"/>
                </linearGradient>

                <!-- Enhanced filters -->
                <filter id="progressGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>

                <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
                </filter>

                <!-- Background texture -->
                <pattern id="progressTexture" patternUnits="userSpaceOnUse" width="20" height="20">
                    <circle cx="10" cy="10" r="1" fill="${settings.primaryColor}" opacity="0.1"/>
                </pattern>

                <!-- Point gradients -->
                <radialGradient id="checkpointGradient" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#FF8A80"/>
                    <stop offset="100%" stop-color="#FF6B6B"/>
                </radialGradient>
                
                <radialGradient id="piscineGradient" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#7FFFD4"/>
                    <stop offset="100%" stop-color="#4ECDC4"/>
                </radialGradient>
                
                <radialGradient id="examGradient" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#FFF176"/>
                    <stop offset="100%" stop-color="#FFE66D"/>
                </radialGradient>
                
                <radialGradient id="projectGradient" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#C8E6C9"/>
                    <stop offset="100%" stop-color="#A8E6CF"/>
                </radialGradient>
            </defs>

            <!-- Background texture -->
            <rect width="100%" height="100%" fill="url(#progressTexture)"/>
            
            <!-- Decorative background circles -->
            <circle cx="200" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1" opacity="0.6">
                <animate attributeName="r" values="80;85;80" dur="5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="${settings.width - 200}" cy="${settings.height - 100}" r="60" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" opacity="0.4">
                <animate attributeName="r" values="60;65;60" dur="4s" repeatCount="indefinite"/>
            </circle>
            
            <!-- Floating particles -->
            <g opacity="0.6">${floatingParticles}</g>
            
            <!-- Milestone lines -->
            ${milestoneMarkers}
            
            <!-- Main axis lines with enhanced styling -->
            <line x1="${settings.padding}" y1="${settings.height - settings.padding}" 
                  x2="${settings.width - settings.padding}" y2="${settings.height - settings.padding}" 
                  stroke="${settings.textColor}" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
            <line x1="${settings.padding}" y1="${settings.padding}" 
                  x2="${settings.padding}" y2="${settings.height - settings.padding}" 
                  stroke="${settings.textColor}" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
            
            <!-- Area under curve with enhanced gradient -->
            <path d="${areaPath}" fill="url(#areaGradient)" opacity="0.7"/>
            
            <!-- Main progress curve with enhanced glow -->
            <path d="${curvePath}" fill="none" stroke="url(#lineGradient)" 
                  stroke-width="5" filter="url(#progressGlow)" stroke-linecap="round"
                  stroke-dasharray="0,2000" opacity="0">
                <animate attributeName="stroke-dasharray" values="0,2000;2000,0" dur="3s" begin="0.5s" fill="freeze"/>
                <animate attributeName="opacity" from="0" to="1" dur="1s" begin="0.5s" fill="freeze"/>
            </path>
            
            <!-- Data points -->
            ${dataPoints}
            
            <!-- Enhanced chart title -->
            <rect x="${settings.width / 2 - 140}" y="20" width="280" height="45" 
                  fill="rgba(255,255,255,0.1)" rx="22" opacity="0.9" filter="url(#dropShadow)"/>
            <text x="${settings.width / 2}" y="38" text-anchor="middle" 
                  font-size="14" font-weight="bold" fill="${settings.textColor}" opacity="0.8">
                 XP Progress Journey
            </text>
            <text x="${settings.width / 2}" y="52" text-anchor="middle" 
                  font-size="10" fill="${settings.textColor}" opacity="0.6">
                Interactive Data Visualization
            </text>
            
            <!-- Enhanced Y-axis labels -->
            ${generateEnhancedYAxisLabels(yAxisMax, settings)}
            
            <!-- Enhanced progress indicator -->
            <circle cx="${coordinates[coordinates.length - 1].x}" cy="${coordinates[coordinates.length - 1].y}" 
                    r="18" fill="url(#milestoneGradient)" stroke="${settings.textColor}" stroke-width="3" 
                    filter="url(#progressGlow)" opacity="0">
                <animate attributeName="r" values="18;22;18" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="0" to="1" dur="1s" begin="3s" fill="freeze"/>
            </circle>
            <text x="${coordinates[coordinates.length - 1].x}" y="${coordinates[coordinates.length - 1].y + 6}" 
                  text-anchor="middle" font-size="14" font-weight="bold" fill="${settings.textColor}" opacity="0">
                🎯
                <animate attributeName="opacity" from="0" to="1" dur="1s" begin="3.5s" fill="freeze"/>
            </text>
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
            <circle r="10" fill="url(#checkpointGradient)" stroke="${'#FFFFFF'}" stroke-width="2" filter="url(#dropShadow)">
                <animate attributeName="r" values="10;12;10" dur="2s" repeatCount="indefinite"/>
            </circle>
            <polygon points="0,-5 4,0 0,5 -4,0" fill="${'#FFFFFF'}" opacity="0.9"/>
        `,
        piscine: `
            <rect x="-8" y="-8" width="16" height="16" fill="url(#piscineGradient)" stroke="${'#FFFFFF'}" stroke-width="2" rx="3" filter="url(#dropShadow)">
                <animateTransform attributeName="transform" type="rotate" values="0;360" dur="8s" repeatCount="indefinite"/>
            </rect>
            <circle r="4" fill="${'#FFFFFF'}" opacity="0.9"/>
        `,
        exam: `
            <polygon points="0,-10 8,0 0,10 -8,0" fill="url(#examGradient)" stroke="${'#FFFFFF'}" stroke-width="2" filter="url(#dropShadow)">
                <animate attributeName="points" values="0,-10 8,0 0,10 -8,0;0,-12 10,0 0,12 -10,0;0,-10 8,0 0,10 -8,0" dur="3s" repeatCount="indefinite"/>
            </polygon>
            <text y="3" text-anchor="middle" font-size="10" fill="${'#2C3E50'}" font-weight="bold">!</text>
        `,
        project: `
            <circle r="8" fill="url(#projectGradient)" stroke="${'#FFFFFF'}" stroke-width="2" filter="url(#dropShadow)">
                <animate attributeName="fill-opacity" values="1;0.7;1" dur="2.5s" repeatCount="indefinite"/>
            </circle>
            <circle r="3" fill="${'#FFFFFF'}" opacity="0.9"/>
        `
    };
    
    return designs[type] || designs.project;
}





function generateEnhancedYAxisLabels(maxValue, settings) {
    let labels = '';
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
        const value = (maxValue / steps) * i;
        const y = settings.height - settings.padding - (i / steps) * (settings.height - 2 * settings.padding);
        
        labels += `
            <g transform="translate(${settings.padding - 25}, ${y})" opacity="0">
                <circle r="10" fill="url(#milestoneGradient)" opacity="0.8" filter="url(#progressGlow)"/>
                <text x="0" y="4" text-anchor="middle" font-size="9" font-weight="bold" fill="${settings.textColor}">
                    ${Math.round(value / 1000)}K
                </text>
                <animate attributeName="opacity" from="0" to="1" dur="0.8s" begin="${i * 0.1 + 2}s" fill="freeze"/>
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



function calculateAuditDistribution(transactions) {
    const upCount = transactions.filter(t => t.type === 'up').length;
    const downCount = transactions.filter(t => t.type === 'down').length;
    return { upCount, downCount };
}


export function generatePieChart(auditTransactions, options = {}) {
    const { upCount, downCount } = calculateAuditDistribution(auditTransactions);
    const total = upCount + downCount;
   
    const settings = {
        size: 300,
        radius: 35,
        center: 50,
        colors: {
            up: '#4ECDC4',
            down: '#FF6B9D',
            stroke: '#2C3E50',
            text: '#FFFFFF'
        },
        ...options
    };

    if (total === 0) {
        return generateNoDataHTML('No audit data available');
    }

    const upPercentage = Math.round((upCount / total) * 100);
    const downPercentage = Math.round((downCount / total) * 100);

    return `
        <svg viewBox="0 0 100 100"
             width="${settings.size}"
             height="${settings.size}"
             style="background: linear-gradient(135deg, #2C3E50 0%, #1A252F 100%); 
                    border-radius: 15px; 
                    box-shadow: 0 10px 25px rgba(0,0,0,0.3);"
             aria-label="Animated pie chart showing audit distribution">
            
            <defs>
                <linearGradient id="upGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#7FFFD4"/>
                    <stop offset="100%" stop-color="#4ECDC4"/>
                </linearGradient>
                
                <linearGradient id="downGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#FFB3D1"/>
                    <stop offset="100%" stop-color="#FF6B9D"/>
                </linearGradient>
                
                <filter id="glow">
                    <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            
            <!-- Background circle -->
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
            
            <!-- Chart title -->
            <text x="50" y="15" text-anchor="middle" font-size="4" font-weight="bold" 
                  fill="${settings.colors.text}" filter="url(#glow)">
                Audit XP Distribution
            </text>
            
            <!-- Pie segments with simple animation -->
            ${generateSimpleArcSegments(upCount, downCount, settings)}
            
            <!-- Center circle -->
            <circle cx="50" cy="50" r="15" fill="rgba(255,255,255,0.1)" 
                    stroke="rgba(255,255,255,0.2)" stroke-width="0.5">
                <animate attributeName="r" values="15;16;15" dur="3s" repeatCount="indefinite"/>
            </circle>
            
            <!-- Center text -->
            <text x="50" y="47" text-anchor="middle" font-size="6" font-weight="bold" 
                  fill="#FFD700" opacity="0">
                ${total}
                <animate attributeName="opacity" from="0" to="1" dur="1s" begin="2s" fill="freeze"/>
            </text>
            <text x="50" y="53" text-anchor="middle" font-size="3" 
                  fill="#FFD700" opacity="0.8">
                Total Audits
                <animate attributeName="opacity" from="0" to="0.8" dur="1s" begin="2.2s" fill="freeze"/>
            </text>
            
            <!-- Legend -->
         <g transform="translate(20, 88)">
    <circle cx="0" cy="0" r="1.5" fill="url(#upGradient)"/>
    <text x="4" y="1" font-size="3" fill="${settings.colors.text}">
        Given: ${upCount} (${upPercentage}%)
    </text>
    
    <circle cx="0" cy="5" r="1.5" fill="url(#downGradient)"/>
    <text x="4" y="6" font-size="3" fill="${settings.colors.text}">
        Received: ${downCount} (${downPercentage}%)
    </text>
</g>

        </svg>
    `;
}

function generateSimpleArcSegments(upCount, downCount, settings) {
    const total = upCount + downCount;
    const upAngle = (upCount / total) * 360;
    const { center, radius } = settings;
    
    return `
        <!-- Up segment -->
        <path d="${createArcPath(center, center, radius, -90, -90 + upAngle)}"
              fill="url(#upGradient)" 
              stroke="${settings.colors.stroke}" 
              stroke-width="0.5"
              style="cursor: pointer;"
              stroke-dasharray="0,1000"
              opacity="0">
            <animate attributeName="stroke-dasharray" 
                     values="0,1000;1000,0" 
                     dur="1.5s" 
                     begin="0.5s" 
                     fill="freeze"/>
            <animate attributeName="opacity" 
                     from="0" to="1" 
                     dur="0.5s" 
                     begin="0.5s" 
                     fill="freeze"/>
            <title>Given Audits: ${upCount} (${Math.round((upCount / total) * 100)}%)</title>
        </path>
        
        <!-- Down segment -->
        <path d="${createArcPath(center, center, radius, -90 + upAngle, -90 + 360)}"
              fill="url(#downGradient)" 
              stroke="${settings.colors.stroke}" 
              stroke-width="0.5"
              style="cursor: pointer;"
              stroke-dasharray="0,1000"
              opacity="0">
            <animate attributeName="stroke-dasharray" 
                     values="0,1000;1000,0" 
                     dur="1.5s" 
                     begin="1s" 
                     fill="freeze"/>
            <animate attributeName="opacity" 
                     from="0" to="1" 
                     dur="0.5s" 
                     begin="1s" 
                     fill="freeze"/>
            <title>Received Audits: ${downCount} (${Math.round((downCount / total) * 100)}%)</title>
        </path>
    `;
}


















function generateEnhancedCenterText(upCount, downCount, upPct, downPct, total, settings) {
    const { center } = settings;
    
    return `
        <!-- Total count -->
        <text x="${center}" y="${center - 4}" text-anchor="middle" 
              font-size="8" font-weight="bold" fill="${settings.colors.text}" 
              filter="url(#pieGlow)" opacity="0">
            ${total}
            <animate attributeName="opacity" from="0" to="1" dur="0.8s" begin="2.5s" fill="freeze"/>
        </text>
        
        <!-- Total label -->
        <text x="${center}" y="${center + 2}" text-anchor="middle" 
              font-size="3" fill="${settings.colors.text}" opacity="0.8">
            Total Audits
            <animate attributeName="opacity" from="0" to="0.8" dur="0.8s" begin="2.7s" fill="freeze"/>
        </text>
        
        <!-- Percentage breakdown -->
        <text x="${center}" y="${center + 8}" text-anchor="middle" 
              font-size="2.5" fill="${settings.colors.text}" opacity="0.6">
            ${upPct}% / ${downPct}%
            <animate attributeName="opacity" from="0" to="0.6" dur="0.8s" begin="2.9s" fill="freeze"/>
        </text>
        
        <!-- Pulsing center dot -->
        <circle cx="${center}" cy="${center}" r="1" fill="rgba(255,255,255,0.8)" opacity="0">
            <animate attributeName="r" values="1;2;1" dur="2s" begin="3s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0;0.8;0" dur="2s" begin="3s" repeatCount="indefinite"/>
        </circle>
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
        width: 400,
        height: 280, // Increased height to accommodate labels
        padding: 50,
        barColors: ['#FF6B9D', '#4ECDC4'],
        accentColor: '#FFE66D',
        backgroundColor: '#2C3E50',
        textColor: '#ECF0F1',
        gridColor: '#34495E',
        ...options
    };

    const categories = ['Given Audit XP', 'Received Audit XP'];
    const values = [
        auditMetrics.totalUp,
        auditMetrics.totalDown
    ];

    const maxValue = Math.max(...values) * 1.2;
    const chartHeight = settings.height - 2 * settings.padding - 40; // Reserve space for labels
    const chartWidth = settings.width - 2 * settings.padding;
    const barWidth = chartWidth / (values.length * 3);
    const spacing = barWidth * 0.8;

    // Generate decorative elements
    let decorativeElements = '';
    for (let i = 0; i < 5; i++) {
        const x = 20 + i * 30;
        const y = 15 + i * 8;
        decorativeElements += `
            <circle cx="${x}" cy="${y}" r="2" fill="${settings.accentColor}" opacity="${0.3 + i * 0.1}">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="${2 + i}s" repeatCount="indefinite"/>
            </circle>
        `;
    }

    // Generate unique cylindrical bars
    let barElements = '';
    values.forEach((value, i) => {
        const barHeight = (value / maxValue) * chartHeight;
        const x = settings.padding + spacing + i * (barWidth + spacing * 2);
        const y = settings.height - settings.padding - barHeight - 40; // Adjusted for label space
        
        // Create 3D cylindrical effect
        const ellipseRy = barWidth * 0.15;
        const ellipseRx = barWidth * 0.45;
        
        barElements += `
            <g class="bar-group" transform="translate(0,0)">
                <!-- Bar shadow -->
                <ellipse cx="${x + barWidth/2 + 3}" cy="${settings.height - settings.padding - 32}" 
                         rx="${ellipseRx}" ry="${ellipseRy * 0.5}" 
                         fill="rgba(0,0,0,0.3)" opacity="0.6"/>
                
                <!-- Main bar body with gradient -->
                <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" 
                      fill="url(#barGradient${i})" rx="8" ry="8"
                      stroke="url(#strokeGradient${i})" stroke-width="2">
                    <animate attributeName="height" from="0" to="${barHeight}" 
                             dur="1.2s" begin="${i * 0.3}s" fill="freeze"/>
                    <animate attributeName="y" from="${settings.height - settings.padding - 40}" to="${y}" 
                             dur="1.2s" begin="${i * 0.3}s" fill="freeze"/>
                </rect>
                
                <!-- Top ellipse for 3D effect -->
                <ellipse cx="${x + barWidth/2}" cy="${y}" 
                         rx="${ellipseRx}" ry="${ellipseRy}" 
                         fill="url(#topGradient${i})" stroke="white" stroke-width="1" opacity="0.9">
                    <animate attributeName="opacity" from="0" to="0.9" 
                             dur="0.5s" begin="${i * 0.3 + 1.2}s" fill="freeze"/>
                </ellipse>
                
                <!-- Highlight effect -->
                <rect x="${x + 8}" y="${y + 10}" width="${barWidth * 0.3}" height="${Math.max(barHeight - 20, 0)}" 
                      fill="url(#highlightGradient)" opacity="0.4" rx="4"/>
                
                <!-- Value display with custom styling -->
                <rect x="${x + barWidth/2 - 30}" y="${y - 35}" width="60" height="25" 
                      fill="${settings.accentColor}" rx="12" opacity="0.9" stroke="white" stroke-width="1">
                    <animate attributeName="opacity" from="0" to="0.9" 
                             dur="0.4s" begin="${i * 0.3 + 1.5}s" fill="freeze"/>
                </rect>
                <text x="${x + barWidth/2}" y="${y - 18}" text-anchor="middle" 
                      font-size="11" font-weight="bold" fill="${settings.backgroundColor}" opacity="0">
                    ${value.toLocaleString()}
                    <animate attributeName="opacity" from="0" to="1" 
                             dur="0.4s" begin="${i * 0.3 + 1.5}s" fill="freeze"/>
                </text>
                
                <!-- FIXED: Category label with proper positioning -->
                <g transform="translate(${x + barWidth/2}, ${settings.height - settings.padding + 5})">
                    ${i === 0 ? 
                        `<path d="M-8,-8 L8,-8 L8,8 L-8,8 Z M-4,-4 L4,-4 L4,4 L-4,4 Z" fill="${settings.barColors[i]}" opacity="0.8"/>` : 
                        `<circle r="8" fill="${settings.barColors[i]}" opacity="0.8"/>
                         <path d="M-4,-2 L0,4 L4,-2" stroke="white" stroke-width="2" fill="none"/>`
                    }
                    <!-- Fixed text positioning to stay within SVG bounds -->
                    <text y="18" text-anchor="middle" font-size="9" font-weight="bold" 
                          fill="${settings.textColor}" opacity="0">
                        ${i === 0 ? 'Given Audit' : 'Received Audit'}
                        <animate attributeName="opacity" from="0" to="1" 
                                 dur="0.5s" begin="${i * 0.3 + 1.8}s" fill="freeze"/>
                    </text>
                    <text y="28" text-anchor="middle" font-size="9" font-weight="bold" 
                          fill="${settings.textColor}" opacity="0">
                        XP
                        <animate attributeName="opacity" from="0" to="1" 
                                 dur="0.5s" begin="${i * 0.3 + 1.9}s" fill="freeze"/>
                    </text>
                </g>
                
                <!-- Interactive hover area -->
                <rect x="${x - 5}" y="${y - 40}" width="${barWidth + 10}" height="${barHeight + 80}" 
                      fill="transparent" style="cursor: pointer;" class="hover-area">
                    <title>Category: ${categories[i]}
Value: ${value.toLocaleString()} XP
Percentage: ${Math.round((value / values.reduce((a,b) => a+b, 0)) * 100)}%</title>
                </rect>
            </g>
        `;
    });

    // Generate grid pattern
    let gridPattern = '';
    for (let i = 1; i <= 4; i++) {
        const y = settings.height - settings.padding - 40 - (i * chartHeight / 4);
        gridPattern += `
            <line x1="${settings.padding}" y1="${y}" x2="${settings.width - settings.padding}" y2="${y}" 
                  stroke="${settings.gridColor}" stroke-width="1" stroke-dasharray="4,4" opacity="0.5"/>
        `;
    }

    return `
        <svg width="${settings.width}" height="${settings.height}" 
             viewBox="0 0 ${settings.width} ${settings.height}"
             style="background: radial-gradient(ellipse at center, ${settings.backgroundColor} 0%, #1A252F 100%); 
                    border-radius: 16px; 
                    box-shadow: 0 12px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);"
             aria-label="Enhanced Audit XP Bar Chart">
            
            <defs>
                <!-- Gradient definitions for each bar -->
                <linearGradient id="barGradient0" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="${settings.barColors[0]}" stop-opacity="1"/>
                    <stop offset="50%" stop-color="${settings.barColors[0]}" stop-opacity="0.8"/>
                    <stop offset="100%" stop-color="#8B4A6B" stop-opacity="0.9"/>
                </linearGradient>
                
                <linearGradient id="barGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="${settings.barColors[1]}" stop-opacity="1"/>
                    <stop offset="50%" stop-color="${settings.barColors[1]}" stop-opacity="0.8"/>
                    <stop offset="100%" stop-color="#2C8B8B" stop-opacity="0.9"/>
                </linearGradient>
                
                <linearGradient id="topGradient0" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#FFB3D1" stop-opacity="1"/>
                    <stop offset="100%" stop-color="${settings.barColors[0]}" stop-opacity="0.8"/>
                </linearGradient>
                
                <linearGradient id="topGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#7FFFD4" stop-opacity="1"/>
                    <stop offset="100%" stop-color="${settings.barColors[1]}" stop-opacity="0.8"/>
                </linearGradient>
                
                <linearGradient id="strokeGradient0" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#FF8FA3" stop-opacity="0.8"/>
                    <stop offset="100%" stop-color="#FF6B9D" stop-opacity="1"/>
                </linearGradient>
                
                <linearGradient id="strokeGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#5FE5D5" stop-opacity="0.8"/>
                    <stop offset="100%" stop-color="#4ECDC4" stop-opacity="1"/>
                </linearGradient>
                
                <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="white" stop-opacity="0.6"/>
                    <stop offset="100%" stop-color="white" stop-opacity="0.1"/>
                </linearGradient>
                
                <!-- Glow filter -->
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                
                <!-- Pattern for background texture -->
                <pattern id="backgroundTexture" patternUnits="userSpaceOnUse" width="20" height="20">
                    <circle cx="10" cy="10" r="1" fill="${settings.accentColor}" opacity="0.1"/>
                </pattern>
            </defs>
            
            <!-- Background texture -->
            <rect width="100%" height="100%" fill="url(#backgroundTexture)"/>
            
            <!-- Decorative elements -->
            ${decorativeElements}
            
            <!-- Chart title with glow effect -->
            <g transform="translate(${settings.width/2}, 25)">
                <rect x="-80" y="-12" width="160" height="24" 
                      fill="rgba(255,255,255,0.1)" rx="12" stroke="${settings.accentColor}" stroke-width="1"/>
                <text text-anchor="middle" font-size="14" font-weight="bold" 
                      fill="${settings.textColor}" filter="url(#glow)">
                    Audit XP Distribution
                </text>
            </g>
            
            <!-- Grid lines -->
            ${gridPattern}
            
            <!-- Main chart area border -->
            <rect x="${settings.padding}" y="${settings.padding}" 
                  width="${chartWidth}" height="${chartHeight}" 
                  fill="none" stroke="${settings.gridColor}" stroke-width="2" 
                  rx="8" opacity="0.3"/>
            
            <!-- Bar elements -->
            ${barElements}
            
            <!-- Legend -->
            <g transform="translate(${settings.width - 120}, ${settings.height - 40})">
                <rect x="0" y="0" width="110" height="35" 
                      fill="rgba(255,255,255,0.1)" rx="8" stroke="${settings.gridColor}" stroke-width="1"/>
                <circle cx="15" cy="12" r="4" fill="${settings.barColors[0]}"/>
                <text x="25" y="16" font-size="10" fill="${settings.textColor}">Given</text>
                <circle cx="15" cy="25" r="4" fill="${settings.barColors[1]}"/>
                <text x="25" y="29" font-size="10" fill="${settings.textColor}">Received</text>
            </g>
        </svg>
    `;
}

// Helper function to generate no-data HTML
function generateNoDataHTML(message) {
    return `<p class="no-data">${message}</p>`;
}

// Chart utility functions
export function createChartContainer(title, chartContent, legendItems = []) {
    let legendHTML = '';
    if (legendItems.length > 0) {
        legendHTML = `
            <div class="chart-legend">
                ${legendItems.map(item => `
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: ${item.color};"></div>
                        <span>${item.label}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    return `
        <div class="chart-container">
            <div class="chart-title">${title}</div>
            <div class="chart-wrapper">
                ${chartContent}
            </div>
            ${legendHTML}
        </div>
    `;
}

export function wrapChartWithContainer(chartHTML, title, legendItems = []) {
    if (chartHTML.includes('no-data')) {
        return chartHTML; // Return as-is if it's a no-data message
    }
    return createChartContainer(title, chartHTML, legendItems);
}

// Template utilities for working with HTML templates
export function useChartTemplate(templateId, title, chartContent, legendItems = []) {
    const template = document.getElementById(templateId);
    if (!template) {
        console.warn(`Template ${templateId} not found`);
        return createChartContainer(title, chartContent, legendItems);
    }
    
    const clone = template.cloneNode(true);
    clone.id = `${templateId}_${Date.now()}`;
    clone.classList.remove('template');
    clone.classList.add('cloned');
    clone.style.display = 'flex';
    
    // Update title if provided
    if (title) {
        const titleElement = clone.querySelector('.chart-title');
        if (titleElement) titleElement.textContent = title;
    }
    
    // Insert chart content
    const wrapper = clone.querySelector('.chart-wrapper');
    if (wrapper) wrapper.innerHTML = chartContent;
    
    // Update legend if provided
    if (legendItems.length > 0) {
        const legend = clone.querySelector('.chart-legend');
        if (legend) {
            legend.innerHTML = legendItems.map(item => `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${item.color};"></div>
                    <span>${item.label}</span>
                </div>
            `).join('');
        }
    }
    
    return clone.outerHTML;
}

// Enhanced chart generation with template support
export function generateProgressChartWithTemplate(xpTransactions, options = {}) {
    const chartSVG = generateProgressChart(xpTransactions, options);
    
    if (chartSVG.includes('no-data')) {
        return chartSVG;
    }
    
    return useChartTemplate('progressChartTemplate', 'XP Progress Journey', chartSVG);
}

export function generatePieChartWithTemplate(auditTransactions, options = {}) {
    const chartSVG = generatePieChart(auditTransactions, options);
    
    if (chartSVG.includes('no-data')) {
        return chartSVG;
    }
    
    const legendItems = [
        { color: '#4ECDC4', label: 'Given Audits' },
        { color: '#FF6B9D', label: 'Received Audits' }
    ];
    
    return useChartTemplate('pieChartTemplate', 'Audit XP Distribution', chartSVG, legendItems);
}

export function generateBarChartWithTemplate(auditMetrics, options = {}) {
    const chartSVG = generateBarChart(auditMetrics, options);
    
    if (chartSVG.includes('no-data')) {
        return chartSVG;
    }
    
    const legendItems = [
        { color: '#FF6B9D', label: 'Given Audit XP' },
        { color: '#4ECDC4', label: 'Received Audit XP' }
    ];
    
    return useChartTemplate('barChartTemplate', 'Audit XP Comparison', chartSVG, legendItems);
}
