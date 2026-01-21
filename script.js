// Global variables
let rawData = [];
let processedData = [];
let allTeams = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initSmoothScroll();
});

// Smooth scroll for navigation
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// Load and process the data
async function loadData() {
    // Show loading state
    document.querySelectorAll('.chart-area, .chart-area-small').forEach(chart => {
        chart.innerHTML = '<div class="loading">Fogadási adatok betöltése...</div>';
    });

    try {
        console.log('📊 JSON adatok betöltése az odds_scraper-ből...');
        
        // Try to load odds_data.json first (from scraper)
        let oddsData;
        try {
            const oddsResponse = await fetch('data/odds_data.json');
            if (oddsResponse.ok) {
                oddsData = await oddsResponse.json();
                console.log(`✅ ${oddsData.length} mérkőzés betöltve az odds_data.json-ból`);
            }
        } catch (e) {
            console.log('⚠️ odds_data.json nem található, CSV betöltés...');
        }

        // If odds_data.json loaded successfully, use it
        if (oddsData && oddsData.length > 0) {
            rawData = oddsData.map(match => ({
                Date: match.date,
                League: match.league || 'Unknown',
                HomeTeam: match.home_team,
                AwayTeam: match.away_team,
                FTHG: parseInt(match.home_goals) || 0,
                FTAG: parseInt(match.away_goals) || 0,
                FTR: match.result,
                B365H: parseFloat(match.odds_home),
                B365D: parseFloat(match.odds_draw),
                B365A: parseFloat(match.odds_away)
            }));
            
            console.log('✅ Odds adatok sikeresen konvertálva');
            console.log('Minta mérkőzés:', rawData[0]);
        } else {
            // Fallback to CSV
            console.log('CSV adatok betöltése a Football-Data.co.uk-ról...');
            const csvData = await d3.csv('data/E0.csv');
            
            if (!csvData || csvData.length === 0) {
                throw new Error('A CSV fájl üres vagy nem található');
            }

            rawData = csvData
                .filter(row => row.B365H && row.B365D && row.B365A)
                .map(row => ({
                    Date: row.Date,
                    League: 'Premier League',
                    HomeTeam: row.HomeTeam,
                    AwayTeam: row.AwayTeam,
                    FTHG: parseInt(row.FTHG) || 0,
                    FTAG: parseInt(row.FTAG) || 0,
                    FTR: row.FTR,
                    B365H: parseFloat(row.B365H),
                    B365D: parseFloat(row.B365D),
                    B365A: parseFloat(row.B365A)
                }));
            
            console.log(`✅ ${rawData.length} mérkőzés betöltve CSV-ből`);
        }

        if (rawData.length === 0) {
            throw new Error('Nincs érvényes fogadási adat');
        }
        
        processData();
        console.log(`✅ ${processedData.length} mérkőzés feldolgozva a vizualizációhoz`);
        createAllVisualizations();
        console.log('✅ Minden vizualizáció elkészült valódi adatokból');

    } catch (error) {
        console.error('❌ Hiba az adatok betöltésekor:', error);
        console.log('⚠️ Visszaállás minta adatokra...');
        console.log('💡 Futtasd a python odds_scraper.py scriptet új adatok generálásához');
        
        // Generate sample data for demonstration
        generateSampleData();
        console.log(`✅ ${rawData.length} minta mérkőzés generálva`);
        processData();
        console.log(`✅ ${processedData.length} minta mérkőzés feldolgozva`);
        createAllVisualizations();
        console.log('✅ Minden vizualizáció elkészült minta adatokkal');
    }
}

// Process API response into match format
function processApiResponse(apiResponse) {

// Process API response into match format
function processApiResponse(apiResponse) {
    // Transform API response into match-based format
    const matchesMap = new Map();

    apiResponse.forEach(match => {
        const fixtureId = match.fixture?.id;
        if (!fixtureId) return;

        const league = match.league?.name || 'Unknown';
        const date = match.fixture?.date || '';
        const homeTeam = match.fixture?.teams?.home?.name || 'Unknown';
        const awayTeam = match.fixture?.teams?.away?.name || 'Unknown';

        // Find Bet365 bookmaker or use first available
        let selectedBookmaker = match.bookmakers?.find(b => b.name.includes('Bet365'));
        if (!selectedBookmaker && match.bookmakers?.length > 0) {
            selectedBookmaker = match.bookmakers[0];
        }

        if (selectedBookmaker) {
            const matchWinnerBet = selectedBookmaker.bets?.find(
                bet => bet.name === 'Match Winner'
            );

            if (matchWinnerBet && matchWinnerBet.values?.length >= 3) {
                const homeOdd = matchWinnerBet.values.find(v => v.value === 'Home');
                const drawOdd = matchWinnerBet.values.find(v => v.value === 'Draw');
                const awayOdd = matchWinnerBet.values.find(v => v.value === 'Away');

                if (homeOdd && drawOdd && awayOdd) {
                    // Simulate match result based on odds (for demonstration)
                    const impliedH = 1 / parseFloat(homeOdd.odd);
                    const impliedD = 1 / parseFloat(drawOdd.odd);
                    const impliedA = 1 / parseFloat(awayOdd.odd);
                    const total = impliedH + impliedD + impliedA;
                    const normalizedH = impliedH / total;
                    const normalizedD = impliedD / total;
                    
                    const rand = Math.random();
                    let FTR, FTHG, FTAG;
                    if (rand < normalizedH) {
                        FTR = 'H';
                        FTHG = Math.floor(Math.random() * 3) + 1;
                        FTAG = Math.floor(Math.random() * FTHG);
                    } else if (rand < normalizedH + normalizedD) {
                        FTR = 'D';
                        FTHG = FTAG = Math.floor(Math.random() * 3);
                    } else {
                        FTR = 'A';
                        FTAG = Math.floor(Math.random() * 3) + 1;
                        FTHG = Math.floor(Math.random() * FTAG);
                    }

                    matchesMap.set(fixtureId, {
                        Date: date.split('T')[0],
                        League: league,
                        HomeTeam: homeTeam,
                        AwayTeam: awayTeam,
                        FTHG: FTHG,
                        FTAG: FTAG,
                        FTR: FTR,
                        B365H: homeOdd.odd,
                        B365D: drawOdd.odd,
                        B365A: awayOdd.odd
                    });
                }
            }
        }
    });

    rawData = Array.from(matchesMap.values());
    
    if (rawData.length === 0) {
        console.warn('No valid odds data could be extracted');
        throw new Error('No valid match data received from API');
    }

    console.log(`✅ Successfully loaded ${rawData.length} matches from API-Football`);
    console.table(rawData.slice(0, 5));
    console.log('Sample match data:', rawData[0]);
    
    processData();
    console.log(`✅ Processed ${processedData.length} matches for visualization`);
    console.log('Sample processed data:', processedData[0]);
    createAllVisualizations();
    console.log('✅ All visualizations created');
}
}

// Generate sample data if CSV is not available
function generateSampleData() {
    const leagues = ['Premier League', 'La Liga', 'Bundesliga', 'Serie A'];
    const teams = {
        'Premier League': ['Arsenal', 'Chelsea', 'Liverpool', 'Man United', 'Man City', 'Tottenham'],
        'La Liga': ['Barcelona', 'Real Madrid', 'Atletico', 'Valencia', 'Sevilla', 'Villarreal'],
        'Bundesliga': ['Bayern Munich', 'Dortmund', 'Leipzig', 'Leverkusen', 'Frankfurt', 'Wolfsburg'],
        'Serie A': ['Juventus', 'Inter', 'Milan', 'Roma', 'Napoli', 'Lazio']
    };

    rawData = [];
    const startDate = new Date('2023-08-01');
    
    for (let i = 0; i < 500; i++) {
        const league = leagues[Math.floor(Math.random() * leagues.length)];
        const leagueTeams = teams[league];
        const homeTeam = leagueTeams[Math.floor(Math.random() * leagueTeams.length)];
        let awayTeam = leagueTeams[Math.floor(Math.random() * leagueTeams.length)];
        while (awayTeam === homeTeam) {
            awayTeam = leagueTeams[Math.floor(Math.random() * leagueTeams.length)];
        }

        // Generate realistic odds
        const homeWinProb = 0.3 + Math.random() * 0.4;
        const drawProb = 0.2 + Math.random() * 0.15;
        const awayWinProb = 1 - homeWinProb - drawProb;
        
        const margin = 1.05 + Math.random() * 0.05; // 5-10% margin
        const B365H = (margin / homeWinProb).toFixed(2);
        const B365D = (margin / drawProb).toFixed(2);
        const B365A = (margin / awayWinProb).toFixed(2);

        // Generate outcome based on odds with some randomness
        const rand = Math.random();
        let FTR, FTHG, FTAG;
        if (rand < homeWinProb * 0.95) {
            FTR = 'H';
            FTHG = Math.floor(Math.random() * 3) + 1;
            FTAG = Math.floor(Math.random() * FTHG);
        } else if (rand < homeWinProb * 0.95 + drawProb * 0.95) {
            FTR = 'D';
            FTHG = FTAG = Math.floor(Math.random() * 3);
        } else {
            FTR = 'A';
            FTAG = Math.floor(Math.random() * 3) + 1;
            FTHG = Math.floor(Math.random() * FTAG);
        }

        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        
        rawData.push({
            Date: date.toISOString().split('T')[0],
            League: league,
            HomeTeam: homeTeam,
            AwayTeam: awayTeam,
            FTHG: FTHG,
            FTAG: FTAG,
            FTR: FTR,
            B365H: B365H,
            B365D: B365D,
            B365A: B365A
        });
    }
}

// Process the raw data
function processData() {
    processedData = rawData.map((match, index) => {
        const B365H = parseFloat(match.B365H);
        const B365D = parseFloat(match.B365D);
        const B365A = parseFloat(match.B365A);

        const impliedH = 1 / B365H;
        const impliedD = 1 / B365D;
        const impliedA = 1 / B365A;
        const margin = impliedH + impliedD + impliedA;

        // Calculate profit for each outcome (stake = 1)
        let profitH = 0, profitD = 0, profitA = 0;
        if (match.FTR === 'H') profitH = B365H - 1;
        else profitH = -1;
        
        if (match.FTR === 'D') profitD = B365D - 1;
        else profitD = -1;
        
        if (match.FTR === 'A') profitA = B365A - 1;
        else profitA = -1;

        // Determine favorite
        const minOdds = Math.min(B365H, B365D, B365A);
        let favorite, favoriteOdds, favoriteProfit;
        if (minOdds === B365H) {
            favorite = 'H';
            favoriteOdds = B365H;
            favoriteProfit = profitH;
        } else if (minOdds === B365D) {
            favorite = 'D';
            favoriteOdds = B365D;
            favoriteProfit = profitD;
        } else {
            favorite = 'A';
            favoriteOdds = B365A;
            favoriteProfit = profitA;
        }

        // Determine underdog (highest odds)
        const maxOdds = Math.max(B365H, B365D, B365A);
        let underdog, underdogOdds, underdogProfit;
        if (maxOdds === B365H) {
            underdog = 'H';
            underdogOdds = B365H;
            underdogProfit = profitH;
        } else if (maxOdds === B365D) {
            underdog = 'D';
            underdogOdds = B365D;
            underdogProfit = profitD;
        } else {
            underdog = 'A';
            underdogOdds = B365A;
            underdogProfit = profitA;
        }

        return {
            ...match,
            index: index,
            B365H: B365H,
            B365D: B365D,
            B365A: B365A,
            impliedH: impliedH,
            impliedD: impliedD,
            impliedA: impliedA,
            margin: margin,
            profitH: profitH,
            profitD: profitD,
            profitA: profitA,
            favorite: favorite,
            favoriteOdds: favoriteOdds,
            favoriteProfit: favoriteProfit,
            underdog: underdog,
            underdogOdds: underdogOdds,
            underdogProfit: underdogProfit,
            homeWin: match.FTR === 'H' ? 1 : 0,
            draw: match.FTR === 'D' ? 1 : 0,
            awayWin: match.FTR === 'A' ? 1 : 0
        };
    });
    
    // Populate team selector after processing data
    if (document.getElementById('team-select')) {
        populateTeamList();
        initTeamSelector();
    }
}

// Create all visualizations
function createAllVisualizations() {
    if (document.getElementById('viz1')) createViz1();
    if (document.getElementById('viz2')) createViz2();
    if (document.getElementById('viz3')) createViz3();
    if (document.getElementById('viz4')) createViz4();
    if (document.getElementById('viz5')) createViz5();
    if (document.getElementById('viz6')) createViz6();
}

// Visualization 1: Odds vs Actual Outcome Accuracy
function createViz1() {
    const container = d3.select('#viz1');
    container.html('');

    if (processedData.length === 0) {
        container.html('<div class="loading">Nincs elérhető adat</div>');
        return;
    }

    const containerWidth = container.node().getBoundingClientRect().width;
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = (containerWidth > 0 ? containerWidth : 700) - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Prepare data: bin odds and calculate actual win rates
    const bins = [];
    const oddsRanges = [
        { min: 1, max: 1.5, label: '1.0-1.5' },
        { min: 1.5, max: 2, label: '1.5-2.0' },
        { min: 2, max: 2.5, label: '2.0-2.5' },
        { min: 2.5, max: 3, label: '2.5-3.0' },
        { min: 3, max: 4, label: '3.0-4.0' },
        { min: 4, max: 6, label: '4.0-6.0' },
        { min: 6, max: 100, label: '6.0+' }
    ];

    oddsRanges.forEach(range => {
        ['H', 'D', 'A'].forEach(outcome => {
            let total = 0, wins = 0;
            
            processedData.forEach(match => {
                let odds, actualWin;
                if (outcome === 'H') {
                    odds = match.B365H;
                    actualWin = match.FTR === 'H';
                } else if (outcome === 'D') {
                    odds = match.B365D;
                    actualWin = match.FTR === 'D';
                } else {
                    odds = match.B365A;
                    actualWin = match.FTR === 'A';
                }

                if (odds >= range.min && odds < range.max) {
                    total++;
                    if (actualWin) wins++;
                }
            });

            if (total > 0) {
                const impliedProb = 1 / ((range.min + range.max) / 2);
                bins.push({
                    range: range.label,
                    outcome: outcome,
                    impliedProb: impliedProb * 100,
                    actualRate: (wins / total) * 100,
                    count: total
                });
            }
        });
    });

    // Create scales
    const xScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(['H', 'D', 'A'])
        .range(['#3498db', '#95a5a6', '#e74c3c']);

    // Add diagonal reference line
    svg.append('line')
        .attr('x1', xScale(0))
        .attr('y1', yScale(0))
        .attr('x2', xScale(100))
        .attr('y2', yScale(100))
        .attr('stroke', '#999')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');

    // Add points
    svg.selectAll('circle')
        .data(bins)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.impliedProb))
        .attr('cy', d => yScale(d.actualRate))
        .attr('r', 6)
        .attr('fill', d => colorScale(d.outcome))
        .attr('opacity', 0.7)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

    // Add axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d => d + '%'))
        .append('text')
        .attr('x', width / 2)
        .attr('y', 40)
        .attr('fill', '#000')
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Implied Probability from Odds');

    svg.append('g')
        .call(d3.axisLeft(yScale).tickFormat(d => d + '%'))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -40)
        .attr('fill', '#000')
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Actual Win Rate');

    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 120}, 20)`);

    ['H', 'D', 'A'].forEach((outcome, i) => {
        const g = legend.append('g')
            .attr('transform', `translate(0, ${i * 25})`);

        g.append('circle')
            .attr('r', 6)
            .attr('fill', colorScale(outcome));

        g.append('text')
            .attr('x', 15)
            .attr('y', 5)
            .text(outcome === 'H' ? 'Home' : outcome === 'D' ? 'Draw' : 'Away')
            .style('font-size', '12px');
    });
}

// Visualization 2: Bookmaker Margin Overview
function createViz2() {
    const container = d3.select('#viz2');
    container.html('');

    if (processedData.length === 0) {
        container.html('<div class="loading">No data available</div>');
        return;
    }

    const containerWidth = container.node().getBoundingClientRect().width;
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = (containerWidth > 0 ? containerWidth : 700) - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Bin margins
    const marginBins = d3.bin()
        .domain([1, 1.15])
        .thresholds(20)
        (processedData.map(d => d.margin));

    const data = marginBins.map(bin => ({
        x0: bin.x0,
        x1: bin.x1,
        count: bin.length
    }));

    // Create scales
    const xScale = d3.scaleLinear()
        .domain([1, 1.15])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count)])
        .range([height, 0]);

    // Add bars
    svg.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', d => xScale(d.x0))
        .attr('y', d => yScale(d.count))
        .attr('width', d => xScale(d.x1) - xScale(d.x0) - 1)
        .attr('height', d => height - yScale(d.count))
        .attr('fill', '#667eea');

    // Add reference line at 100%
    svg.append('line')
        .attr('x1', xScale(1))
        .attr('y1', 0)
        .attr('x2', xScale(1))
        .attr('y2', height)
        .attr('stroke', '#e74c3c')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');

    // Add axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d => (d * 100).toFixed(0) + '%'))
        .append('text')
        .attr('x', width / 2)
        .attr('y', 40)
        .attr('fill', '#000')
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Total Implied Probability (Overround)');

    svg.append('g')
        .call(d3.axisLeft(yScale))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -45)
        .attr('fill', '#000')
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Number of Matches');
}

// Live Margin Chart - Interactive Scatter Plot
window.createLiveMarginChart = function(liveData) {
    const container = d3.select('#viz2');
    container.html('');

    if (!liveData || !liveData.matches || liveData.matches.length === 0) {
        container.html('<div class="loading">Nincs élő adat. Futtasd: python fetch_live_matches.py</div>');
        return;
    }

    const matches = liveData.matches;
    
    // Készítsünk lapos adatstruktúrát: minden bookmaker-mérkőzés páros egy pont
    const dataPoints = [];
    matches.forEach((match, idx) => {
        match.bookmakers.forEach(bookie => {
            dataPoints.push({
                matchIndex: idx,
                matchLabel: `${match.home_team} vs ${match.away_team}`,
                league: match.league,
                status: match.status,
                date: match.date,
                bookmaker: bookie.bookmaker,
                margin: bookie.margin,
                odds_home: bookie.odds_home,
                odds_draw: bookie.odds_draw,
                odds_away: bookie.odds_away
            });
        });
    });

    const containerWidth = container.node().getBoundingClientRect().width;
    const margin = { top: 50, right: 150, bottom: 80, left: 70 };
    const width = (containerWidth > 0 ? containerWidth : 900) - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Unique bookmakers
    const bookmakers = [...new Set(dataPoints.map(d => d.bookmaker))];
    
    // Color scale
    const colorScale = d3.scaleOrdinal()
        .domain(bookmakers)
        .range(d3.schemeSet2);

    // Scales
    const xScale = d3.scaleLinear()
        .domain([0, matches.length - 1])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(dataPoints, d => d.margin) * 1.1])
        .range([height, 0]);

    // Add grid lines
    svg.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat('')
        );

    // Add points
    const circles = svg.selectAll('.data-point')
        .data(dataPoints)
        .enter()
        .append('circle')
        .attr('class', 'data-point')
        .attr('cx', d => xScale(d.matchIndex))
        .attr('cy', d => yScale(d.margin))
        .attr('r', 6)
        .attr('fill', d => colorScale(d.bookmaker))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.8)
        .style('cursor', 'pointer');

    // Tooltip
    const tooltip = container.append('div')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.9)')
        .style('color', '#fff')
        .style('padding', '12px')
        .style('border-radius', '8px')
        .style('border', '2px solid #667eea')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('font-size', '12px')
        .style('z-index', '1000');

    circles
        .on('mouseover', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('r', 10)
                .attr('stroke-width', 3);

            tooltip
                .style('opacity', 1)
                .html(`
                    <strong>${d.matchLabel}</strong><br>
                    <small>${d.league} | ${d.status}</small><br>
                    <hr style="margin: 5px 0; border-color: #667eea;">
                    <strong style="color: ${colorScale(d.bookmaker)}">${d.bookmaker}</strong><br>
                    📊 Margin: <strong>${d.margin.toFixed(2)}%</strong><br>
                    🏠 Home: ${d.odds_home} | ⚖️ Draw: ${d.odds_draw} | ✈️ Away: ${d.odds_away}
                `)
                .style('left', (event.pageX + 15) + 'px')
                .style('top', (event.pageY - 15) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('r', 6)
                .attr('stroke-width', 1.5);

            tooltip.style('opacity', 0);
        });

    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale)
            .ticks(Math.min(matches.length, 10))
            .tickFormat(i => {
                const match = matches[Math.round(i)];
                return match ? match.home_team.substring(0, 10) : '';
            })
        )
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .style('font-size', '10px');

    // Y axis
    svg.append('g')
        .call(d3.axisLeft(yScale).tickFormat(d => d + '%'))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -50)
        .attr('fill', '#fff')
        .attr('text-anchor', 'middle')
        .style('font-size', '13px')
        .text('Margin (%)');

    // X axis label
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 70)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#aaa')
        .text('Mérkőzések');

    // Title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -30)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .style('fill', '#fff')
        .text('📊 Bookmarkerek Margin Összehasonlítása - Interaktív');

    // Subtitle
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('fill', '#aaa')
        .text('Minden pont egy bookmaker-mérkőzés páros | Vidd az egeret fölé a részletekért');

    // Legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width + 20}, 0)`);

    bookmakers.forEach((bookmaker, i) => {
        const legendRow = legend.append('g')
            .attr('transform', `translate(0, ${i * 25})`);

        legendRow.append('circle')
            .attr('r', 6)
            .attr('fill', colorScale(bookmaker))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5);

        legendRow.append('text')
            .attr('x', 12)
            .attr('y', 5)
            .style('font-size', '11px')
            .style('fill', '#fff')
            .text(bookmaker);

        // Avg margin for this bookmaker
        const bookmakersMargins = dataPoints.filter(d => d.bookmaker === bookmaker).map(d => d.margin);
        const avgMargin = d3.mean(bookmakersMargins);
        
        legendRow.append('text')
            .attr('x', 12)
            .attr('y', 18)
            .style('font-size', '9px')
            .style('fill', '#aaa')
            .text(`Átlag: ${avgMargin.toFixed(2)}%`);
    });

    // Average line for all bookmakers
    const overallAvg = d3.mean(dataPoints, d => d.margin);
    svg.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yScale(overallAvg))
        .attr('y2', yScale(overallAvg))
        .attr('stroke', '#f39c12')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.6);

    svg.append('text')
        .attr('x', width - 5)
        .attr('y', yScale(overallAvg) - 5)
        .attr('text-anchor', 'end')
        .style('font-size', '11px')
        .style('fill', '#f39c12')
        .text(`Átlag: ${overallAvg.toFixed(2)}%`);
}

// Visualization 3: Heatmap
function createViz3() {
    console.log('🌍 createViz3 - World Choropleth Map meghívva');
    const container = d3.select('#viz3');
    container.html('');

    // TopoJSON country name -> Team name mapping (válogatott név az adatokban)
    const topoNameToTeamName = {
        'United States of America': 'United States',
        'United Kingdom': 'England',
        'South Korea': 'Korea Republic',
        'Czech Republic': 'Czechia',
        'Bosnia and Herz.': 'Bosnia and Herzegovina',
        'Dominican Rep.': 'Dominican Republic',
        'Eq. Guinea': 'Equatorial Guinea',
        'Central African Rep.': 'Central African Republic',
        'Dem. Rep. Congo': 'Congo DR',
        'Congo': 'Congo',
        'Côte d\'Ivoire': 'Ivory Coast',
        'N. Cyprus': 'Northern Cyprus',
        'Macedonia': 'North Macedonia',
        'Serbia': 'Serbia',
        'Myanmar': 'Myanmar',
        'Lao PDR': 'Laos',
        'Vietnam': 'Vietnam',
        'Palestine': 'Palestine',
        'W. Sahara': 'Western Sahara',
        'eSwatini': 'Eswatini',
        'Timor-Leste': 'Timor-Leste',
        'Solomon Is.': 'Solomon Islands',
        'S. Sudan': 'South Sudan',
        'China': 'China PR',
        'Russia': 'Russia',
        'Turkey': 'Turkey',
        'Iran': 'Iran',
        'United Arab Emirates': 'United Arab Emirates',
        'Saudi Arabia': 'Saudi Arabia',
        'Korea': 'Korea Republic',
        'Dem. Rep. Korea': 'North Korea',
        'Taiwan': 'Chinese Taipei',
        'Czechia': 'Czech Republic'
    };

    console.log('📊 team_stats.json betöltése...');
    
    // Párhuzamosan betöltjük a világ térképet és a csapat statisztikákat
    Promise.all([
        d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
        d3.json('data/team_stats.json')
    ]).then(([world, teamStatsData]) => {
        console.log('✅ Térkép és adatok betöltve');
        
        if (!teamStatsData || Object.keys(teamStatsData).length === 0) {
            container.html('<div class="loading">Nincs elérhető adat</div>');
            return;
        }

        // Térképadatok előkészítése
        const countries = topojson.feature(world, world.objects.countries);
        
        // Országnév -> Csapat adatok mapping
        const dataByCountryName = {};
        Object.values(teamStatsData).forEach(team => {
            if (team.total_matches >= 5) {
                dataByCountryName[team.team_name] = team;
            }
        });

        console.log('📊 Csapatok adatokkal (min 5 meccs):', Object.keys(dataByCountryName).length);
        
        // Debug: nem talált országok
        const unmappedCountries = [];
        countries.features.forEach(feature => {
            const topoName = feature.properties.name;
            const teamName = topoNameToTeamName[topoName] || topoName;
            if (!dataByCountryName[teamName]) {
                if (!unmappedCountries.includes(topoName)) {
                    unmappedCountries.push(topoName);
                }
            }
        });
        console.log('⚠️ Térképen lévő országok amihez nincs adat:', unmappedCountries.slice(0, 20).join(', '));
        
        // Mely csapatokhoz nincs térkép mapping
        const unmappedTeams = Object.keys(dataByCountryName).filter(teamName => {
            return !countries.features.some(f => {
                const topoName = f.properties.name;
                const mappedName = topoNameToTeamName[topoName] || topoName;
                return mappedName === teamName;
            });
        });
        console.log('⚠️ Csapatok amikhez nincs térkép:', unmappedTeams.slice(0, 20).join(', '));

        // Méret beállítása
        const containerWidth = container.node().getBoundingClientRect().width;
        const width = containerWidth > 0 ? containerWidth : 900;
        const height = 600;

        // SVG létrehozása
        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background-color', '#1a1d20')
            .style('cursor', 'grab');

        // Zoom csoport létrehozása
        const g = svg.append('g');

        // Projekció beállítása
        const projection = d3.geoMercator()
            .scale(140)
            .translate([width / 2, height / 1.5]);

        const path = d3.geoPath().projection(projection);

        // Zoom viselkedés definiálása
        const zoom = d3.zoom()
            .scaleExtent([1, 8])  // 1x - 8x zoom
            .translateExtent([[0, 0], [width, height]])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
                svg.style('cursor', event.transform.k > 1 ? 'move' : 'grab');
            });

        svg.call(zoom);

        // Színskála
        const maxGoals = d3.max(Object.values(dataByCountryName), d => d.average_goals_per_match) || 3;
        const colorScale = d3.scaleSequential()
            .domain([0, maxGoals])
            .interpolator(d3.interpolateGreens);

        // Tooltip
        const tooltip = container.append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('background-color', 'rgba(0, 0, 0, 0.9)')
            .style('color', '#fff')
            .style('padding', '12px')
            .style('border-radius', '6px')
            .style('font-size', '13px')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .style('border', '2px solid #1cc88a')
            .style('box-shadow', '0 4px 6px rgba(0,0,0,0.3)');

        // Országok rajzolása
        g.append('g')
            .selectAll('path')
            .data(countries.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('fill', d => {
                const topoName = d.properties.name;
                const teamName = topoNameToTeamName[topoName] || topoName;
                const teamData = dataByCountryName[teamName];
                
                if (teamData) {
                    return colorScale(teamData.average_goals_per_match);
                }
                return '#2d3338';
            })
            .attr('stroke', '#1a1d20')
            .attr('stroke-width', 0.5)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                const topoName = d.properties.name;
                const teamName = topoNameToTeamName[topoName] || topoName;
                const teamData = dataByCountryName[teamName];
                
                if (teamData) {
                    d3.select(this)
                        .attr('stroke', '#1cc88a')
                        .attr('stroke-width', 2)
                        .raise();
                    
                    tooltip
                        .style('visibility', 'visible')
                        .html(`
                            <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #1cc88a; padding-bottom: 4px;">
                                🏴 ${teamData.team_name}
                            </div>
                            <div style="color: #1cc88a; font-size: 16px; font-weight: bold; margin: 6px 0;">
                                ⚽ ${teamData.average_goals_per_match.toFixed(2)} gól/meccs
                            </div>
                            <div style="color: #858796; font-size: 12px; margin-top: 6px;">
                                📊 Összes meccs: ${teamData.total_matches}<br>
                                🎯 Összes gól: ${teamData.total_goals}
                            </div>
                        `);
                } else {
                    // Nincs adat az országhoz
                    d3.select(this)
                        .attr('stroke', '#666')
                        .attr('stroke-width', 1)
                        .raise();
                    
                    tooltip
                        .style('visibility', 'visible')
                        .html(`
                            <div style="color: #858796;">
                                <strong>🌍 ${topoName}</strong><br>
                                <span style="font-size: 11px; color: #666;">Nincs elérhető adat (kevesebb mint 5 mérkőzés)</span>
                            </div>
                        `);
                }
            })
            .on('mousemove', function(event) {
                tooltip
                    .style('top', (event.pageY - 100) + 'px')
                    .style('left', (event.pageX + 15) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .attr('stroke', '#1a1d20')
                    .attr('stroke-width', 0.5);
                tooltip.style('visibility', 'hidden');
            });

        // Cím (fix pozíció, nem zoomol)
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .style('font-size', '20px')
            .style('font-weight', 'bold')
            .style('fill', '#fff')
            .style('pointer-events', 'none')
            .text('🌍 Válogatottak Átlagos Gólszáma - Világtérkép');

        // Alcím (fix pozíció, nem zoomol)
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 50)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#858796')
            .style('pointer-events', 'none')
            .text('Minimum 5 mérkőzés | Sötétebb zöld = magasabb gólátlag | 🔍 Görgess a nagyításhoz');

        // Zoom vezérlő gombok (fix pozíció)
        const zoomControls = svg.append('g')
            .attr('transform', `translate(20, ${height - 120})`)
            .style('pointer-events', 'all');

        // Zoom In gomb
        const zoomInBtn = zoomControls.append('g')
            .style('cursor', 'pointer')
            .on('click', () => {
                svg.transition().duration(300).call(zoom.scaleBy, 1.3);
            });

        zoomInBtn.append('rect')
            .attr('width', 40)
            .attr('height', 40)
            .attr('rx', 5)
            .attr('fill', '#2d3338')
            .attr('stroke', '#1cc88a')
            .attr('stroke-width', 2);

        zoomInBtn.append('text')
            .attr('x', 20)
            .attr('y', 27)
            .attr('text-anchor', 'middle')
            .style('font-size', '24px')
            .style('fill', '#1cc88a')
            .style('font-weight', 'bold')
            .style('pointer-events', 'none')
            .text('+');

        // Zoom Out gomb
        const zoomOutBtn = zoomControls.append('g')
            .attr('transform', 'translate(0, 45)')
            .style('cursor', 'pointer')
            .on('click', () => {
                svg.transition().duration(300).call(zoom.scaleBy, 0.7);
            });

        zoomOutBtn.append('rect')
            .attr('width', 40)
            .attr('height', 40)
            .attr('rx', 5)
            .attr('fill', '#2d3338')
            .attr('stroke', '#1cc88a')
            .attr('stroke-width', 2);

        zoomOutBtn.append('text')
            .attr('x', 20)
            .attr('y', 27)
            .attr('text-anchor', 'middle')
            .style('font-size', '24px')
            .style('fill', '#1cc88a')
            .style('font-weight', 'bold')
            .style('pointer-events', 'none')
            .text('−');

        // Reset gomb
        const resetBtn = zoomControls.append('g')
            .attr('transform', 'translate(45, 0)')
            .style('cursor', 'pointer')
            .on('click', () => {
                svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
            });

        resetBtn.append('rect')
            .attr('width', 40)
            .attr('height', 85)
            .attr('rx', 5)
            .attr('fill', '#2d3338')
            .attr('stroke', '#858796')
            .attr('stroke-width', 2);

        resetBtn.append('text')
            .attr('x', 20)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .style('font-size', '20px')
            .style('fill', '#858796')
            .style('pointer-events', 'none')
            .text('⟲');

        resetBtn.append('text')
            .attr('x', 20)
            .attr('y', 55)
            .attr('text-anchor', 'middle')
            .style('font-size', '9px')
            .style('fill', '#858796')
            .style('pointer-events', 'none')
            .text('RESET');

        // Jelmagyarázat (fix pozíció, nem zoomol)
        const legendWidth = 300;
        const legendHeight = 15;
        
        const legend = svg.append('g')
            .attr('transform', `translate(${width - legendWidth - 30}, ${height - 50})`)
            .style('pointer-events', 'none');

        const defs = svg.append('defs');
        const linearGradient = defs.append('linearGradient')
            .attr('id', 'world-legend-gradient');

        linearGradient.selectAll('stop')
            .data(d3.range(0, 1.1, 0.1))
            .enter()
            .append('stop')
            .attr('offset', d => `${d * 100}%`)
            .attr('stop-color', d => colorScale(d * maxGoals));

        legend.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', 'url(#world-legend-gradient)')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);

        const legendScale = d3.scaleLinear()
            .domain([0, maxGoals])
            .range([0, legendWidth]);

        const legendAxis = d3.axisBottom(legendScale)
            .ticks(6)
            .tickFormat(d => d.toFixed(1));

        legend.append('g')
            .attr('transform', `translate(0, ${legendHeight})`)
            .call(legendAxis)
            .selectAll('text')
            .style('font-size', '11px')
            .style('fill', '#fff');

        legend.append('text')
            .attr('x', legendWidth / 2)
            .attr('y', -5)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#fff')
            .style('font-weight', 'bold')
            .text('Átlagos Gól/Meccs');

    }).catch(error => {
        console.error('❌ Hiba az adatok betöltésekor:', error);
        container.html(`<div class="loading" style="color: #e74a3b;">Hiba: ${error.message}<br>Ellenőrizd, hogy a TopoJSON library betöltődött-e!</div>`);
    });
}

// Visualization 4: Betting Strategy Simulation - Enhanced
function createViz4() {
    const container = d3.select('#viz4');
    container.html('');

    if (processedData.length === 0) {
        container.html('<div class="loading">Adatok betöltése...</div>');
        return;
    }

    const containerWidth = container.node().getBoundingClientRect().width;
    
    // Create two-panel layout
    const totalWidth = containerWidth > 0 ? containerWidth : 900;
    const lineChartWidth = totalWidth * 0.6;
    const barChartWidth = totalWidth * 0.35;
    const gap = 40;

    const margin = { top: 30, right: 20, bottom: 60, left: 70 };
    const lineWidth = lineChartWidth - margin.left - margin.right;
    const barWidth = barChartWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Main SVG container
    const mainSvg = container.append('svg')
        .attr('width', totalWidth)
        .attr('height', height + margin.top + margin.bottom + 100);

    // Left panel: Line chart
    const lineSvg = mainSvg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Right panel: Bar chart
    const barSvg = mainSvg.append('g')
        .attr('transform', `translate(${lineChartWidth + gap + margin.left},${margin.top})`);

    // Calculate cumulative profits for different strategies
    const strategies = {
        favorite: { 
            name: 'Mindig Esélyes', 
            color: '#3498db', 
            cumulative: [0],
            wins: 0,
            losses: 0
        },
        underdog: { 
            name: 'Mindig Kívülálló', 
            color: '#e74c3c', 
            cumulative: [0],
            wins: 0,
            losses: 0
        },
        draw: { 
            name: 'Mindig Döntetlen', 
            color: '#f39c12', 
            cumulative: [0],
            wins: 0,
            losses: 0
        }
    };

    let favSum = 0, undSum = 0, drawSum = 0;

    processedData.forEach((match, i) => {
        // Favorite strategy
        favSum += match.favoriteProfit;
        if (match.favoriteProfit > 0) strategies.favorite.wins++;
        else strategies.favorite.losses++;
        
        // Underdog strategy
        undSum += match.underdogProfit;
        if (match.underdogProfit > 0) strategies.underdog.wins++;
        else strategies.underdog.losses++;
        
        // Draw strategy
        drawSum += match.profitD;
        if (match.profitD > 0) strategies.draw.wins++;
        else strategies.draw.losses++;

        strategies.favorite.cumulative.push(favSum);
        strategies.underdog.cumulative.push(undSum);
        strategies.draw.cumulative.push(drawSum);
    });

    // ===== LINE CHART =====
    const xScale = d3.scaleLinear()
        .domain([0, processedData.length])
        .range([0, lineWidth]);

    const allValues = [
        ...strategies.favorite.cumulative,
        ...strategies.underdog.cumulative,
        ...strategies.draw.cumulative
    ];

    const yScale = d3.scaleLinear()
        .domain([Math.min(d3.min(allValues), -50), Math.max(d3.max(allValues), 50)])
        .nice()
        .range([height, 0]);

    const line = d3.line()
        .x((d, i) => xScale(i))
        .y(d => yScale(d));

    // Grid
    lineSvg.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(yScale)
            .tickSize(-lineWidth)
            .tickFormat(''));

    // Zero line
    lineSvg.append('line')
        .attr('x1', 0)
        .attr('x2', lineWidth)
        .attr('y1', yScale(0))
        .attr('y2', yScale(0))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');

    // Draw lines
    Object.keys(strategies).forEach(key => {
        const strategy = strategies[key];
        lineSvg.append('path')
            .datum(strategy.cumulative)
            .attr('fill', 'none')
            .attr('stroke', strategy.color)
            .attr('stroke-width', 3)
            .attr('d', line);
    });

    // Axes for line chart
    lineSvg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(10))
        .selectAll('text')
        .style('fill', '#fff');

    lineSvg.selectAll('.domain, .tick line')
        .style('stroke', '#fff');

    lineSvg.append('text')
        .attr('x', lineWidth / 2)
        .attr('y', height + 45)
        .attr('fill', '#fff')
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Fogadások száma');

    lineSvg.append('g')
        .call(d3.axisLeft(yScale).ticks(8))
        .selectAll('text')
        .style('fill', '#fff');

    lineSvg.selectAll('.domain, .tick line')
        .style('stroke', '#fff');

    lineSvg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -50)
        .attr('fill', '#fff')
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Kumulatív Profit (egység)');

    // Title
    lineSvg.append('text')
        .attr('x', lineWidth / 2)
        .attr('y', -10)
        .attr('fill', '#fff')
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text('Profit Görbe');

    // ===== BAR CHART =====
    const strategyKeys = Object.keys(strategies);
    const finalProfits = strategyKeys.map(key => ({
        key: key,
        name: strategies[key].name,
        color: strategies[key].color,
        profit: strategies[key].cumulative[strategies[key].cumulative.length - 1],
        roi: (strategies[key].cumulative[strategies[key].cumulative.length - 1] / processedData.length * 100),
        wins: strategies[key].wins,
        losses: strategies[key].losses,
        winRate: (strategies[key].wins / processedData.length * 100)
    }));

    const barX = d3.scaleBand()
        .domain(strategyKeys)
        .range([0, barWidth])
        .padding(0.3);

    const barY = d3.scaleLinear()
        .domain([Math.min(0, d3.min(finalProfits, d => d.profit)), Math.max(0, d3.max(finalProfits, d => d.profit))])
        .nice()
        .range([height, 0]);

    // Grid for bar chart
    barSvg.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(barY)
            .tickSize(-barWidth)
            .tickFormat(''));

    // Zero line
    barSvg.append('line')
        .attr('x1', 0)
        .attr('x2', barWidth)
        .attr('y1', barY(0))
        .attr('y2', barY(0))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

    // Bars
    barSvg.selectAll('.bar')
        .data(finalProfits)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => barX(d.key))
        .attr('y', d => d.profit >= 0 ? barY(d.profit) : barY(0))
        .attr('width', barX.bandwidth())
        .attr('height', d => Math.abs(barY(d.profit) - barY(0)))
        .attr('fill', d => d.color)
        .attr('opacity', 0.8);

    // Value labels on bars
    barSvg.selectAll('.label')
        .data(finalProfits)
        .enter()
        .append('text')
        .attr('class', 'label')
        .attr('x', d => barX(d.key) + barX.bandwidth() / 2)
        .attr('y', d => d.profit >= 0 ? barY(d.profit) - 5 : barY(0) + 15)
        .attr('fill', '#fff')
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text(d => `${d.profit.toFixed(1)}`);

    // ROI labels
    barSvg.selectAll('.roi-label')
        .data(finalProfits)
        .enter()
        .append('text')
        .attr('class', 'roi-label')
        .attr('x', d => barX(d.key) + barX.bandwidth() / 2)
        .attr('y', d => d.profit >= 0 ? barY(d.profit) - 20 : barY(0) + 30)
        .attr('fill', d => d.roi >= 0 ? '#2ecc71' : '#e74c3c')
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .text(d => `${d.roi.toFixed(1)}% ROI`);

    // Y axis for bar chart
    barSvg.append('g')
        .call(d3.axisLeft(barY).ticks(8))
        .selectAll('text')
        .style('fill', '#fff');

    barSvg.selectAll('.domain, .tick line')
        .style('stroke', '#fff');

    barSvg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -50)
        .attr('fill', '#fff')
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Végső Profit');

    // Title
    barSvg.append('text')
        .attr('x', barWidth / 2)
        .attr('y', -10)
        .attr('fill', '#fff')
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text('Végeredmény');

    // ===== SUMMARY TABLE =====
    const tableSvg = mainSvg.append('g')
        .attr('transform', `translate(${margin.left}, ${height + margin.top + margin.bottom + 10})`);

    tableSvg.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('fill', '#fff')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('📊 Részletes Statisztikák:');

    const tableData = finalProfits.map(d => 
        `${d.name}: ${d.wins}/${processedData.length} győzelem (${d.winRate.toFixed(1)}%) | Profit: ${d.profit.toFixed(1)} egység | ROI: ${d.roi.toFixed(1)}%`
    );

    tableData.forEach((text, i) => {
        tableSvg.append('text')
            .attr('x', 0)
            .attr('y', 20 + i * 18)
            .attr('fill', finalProfits[i].color)
            .style('font-size', '12px')
            .text(text);
    });

    // Console log
    console.log('📊 Stratégia Szimuláció Eredmények:');
    finalProfits.forEach(d => {
        console.log(`  ${d.name}: ${d.profit.toFixed(1)} egység (${d.roi.toFixed(1)}% ROI) | Győzelmi arány: ${d.winRate.toFixed(1)}%`);
    });
}

// Visualization 5: Home Advantage Analysis
function createViz5() {
    const container = d3.select('#viz5');
    container.html('');

    if (processedData.length === 0) {
        container.html('<div class="loading">No data available</div>');
        return;
    }

    const containerWidth = container.node().getBoundingClientRect().width;
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = (containerWidth > 0 ? containerWidth : 280) - margin.left - margin.right;
    const height = 180 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Calculate metrics
    const avgImpliedHome = d3.mean(processedData, d => d.impliedH) * 100;
    const actualHomeWinRate = d3.mean(processedData, d => d.homeWin) * 100;

    const data = [
        { category: 'Implied Probability\n(from odds)', value: avgImpliedHome, color: '#3498db' },
        { category: 'Actual Home\nWin Rate', value: actualHomeWinRate, color: '#2ecc71' }
    ];

    // Create scales
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.category))
        .range([0, width])
        .padding(0.3);

    const yScale = d3.scaleLinear()
        .domain([0, 60])
        .range([height, 0]);

    // Add bars
    svg.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', d => xScale(d.category))
        .attr('y', d => yScale(d.value))
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - yScale(d.value))
        .attr('fill', d => d.color);

    // Add value labels
    svg.selectAll('text.value')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'value')
        .attr('x', d => xScale(d.category) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.value) - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text(d => d.value.toFixed(1) + '%');

    // Add axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('font-size', '12px')
        .call(wrap, xScale.bandwidth());

    svg.append('g')
        .call(d3.axisLeft(yScale).tickFormat(d => d + '%'))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -45)
        .attr('fill', '#000')
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Percentage');
}

// Visualization 6: League Comparison
function createViz6() {
    const container = d3.select('#viz6');
    container.html('');

    if (processedData.length === 0) {
        container.html('<div class="loading">No data available</div>');
        return;
    }

    const containerWidth = container.node().getBoundingClientRect().width;
    const margin = { top: 20, right: 30, bottom: 100, left: 60 };
    const width = (containerWidth > 0 ? containerWidth : 280) - margin.left - margin.right;
    const height = 180 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Group by league
    const leagueStats = d3.rollups(
        processedData,
        v => ({
            avgMargin: d3.mean(v, d => d.margin),
            homeWinRate: d3.mean(v, d => d.homeWin),
            favoriteWinRate: d3.mean(v, d => d.favorite === d.FTR ? 1 : 0),
            count: v.length
        }),
        d => d.League
    );

    const data = leagueStats.map(([league, stats]) => ({
        league: league,
        avgMargin: (stats.avgMargin - 1) * 100,
        predictability: stats.favoriteWinRate * 100,
        count: stats.count
    }));

    // Create scales
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.league))
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => Math.max(d.avgMargin, d.predictability)) * 1.1])
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(['Bookmaker Margin', 'Favorite Win Rate'])
        .range(['#667eea', '#2ecc71']);

    // Prepare grouped data
    const subgroups = ['avgMargin', 'predictability'];
    const xSubgroup = d3.scaleBand()
        .domain(subgroups)
        .range([0, xScale.bandwidth()])
        .padding(0.05);

    // Add bars
    svg.append('g')
        .selectAll('g')
        .data(data)
        .enter()
        .append('g')
        .attr('transform', d => `translate(${xScale(d.league)},0)`)
        .selectAll('rect')
        .data(d => subgroups.map(key => ({ key: key, value: d[key], league: d.league })))
        .enter()
        .append('rect')
        .attr('x', d => xSubgroup(d.key))
        .attr('y', d => yScale(d.value))
        .attr('width', xSubgroup.bandwidth())
        .attr('height', d => height - yScale(d.value))
        .attr('fill', d => d.key === 'avgMargin' ? colorScale('Bookmaker Margin') : colorScale('Favorite Win Rate'));

    // Add axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .style('font-size', '11px');

    svg.append('g')
        .call(d3.axisLeft(yScale).tickFormat(d => d.toFixed(1) + '%'))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -45)
        .attr('fill', '#000')
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Percentage');

    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 200}, 0)`);

    ['Bookmaker Margin', 'Favorite Win Rate'].forEach((label, i) => {
        const g = legend.append('g')
            .attr('transform', `translate(0, ${i * 25})`);

        g.append('rect')
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', colorScale(label));

        g.append('text')
            .attr('x', 24)
            .attr('y', 9)
            .attr('dy', '0.35em')
            .style('font-size', '12px')
            .text(label);
    });
}

// Helper function to wrap text
function wrap(text, width) {
    text.each(function() {
        const text = d3.select(this);
        const words = text.text().split(/\n/);
        text.text('');
        words.forEach((word, i) => {
            text.append('tspan')
                .attr('x', 0)
                .attr('dy', i === 0 ? 0 : '1.1em')
                .text(word);
        });
    });
}

// Team Selector Functions
function initTeamSelector() {
    const teamSelect = document.getElementById('team-select');
    
    if (!teamSelect) return;

    // Event listener for team selection
    teamSelect.addEventListener('change', function() {
        const selectedTeam = this.value;
        if (selectedTeam) {
            displayTeamStats(selectedTeam);
        } else {
            // Reset display if no team selected
            const container = document.getElementById('team-stats-display');
            if (container) {
                container.innerHTML = '<div class="text-center text-muted py-3"><small>Válassz egy csapatot a statisztikák megtekintéséhez</small></div>';
            }
        }
    });
}

function populateTeamList() {
    const teamSelect = document.getElementById('team-select');
    if (!teamSelect || rawData.length === 0) return;

    // Extract unique teams from rawData
    const teamsSet = new Set();
    rawData.forEach(match => {
        if (match.HomeTeam) teamsSet.add(match.HomeTeam);
        if (match.AwayTeam) teamsSet.add(match.AwayTeam);
    });

    allTeams = Array.from(teamsSet).sort();

    // Populate select dropdown
    teamSelect.innerHTML = '<option value="">-- Válassz csapatot --</option>';
    allTeams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamSelect.appendChild(option);
    });
}

function displayTeamStats(teamName) {
    const container = document.getElementById('team-stats-display');
    if (!container) return;

    // Calculate team statistics
    const teamMatches = rawData.filter(match => 
        match.HomeTeam === teamName || match.AwayTeam === teamName
    );

    if (teamMatches.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-3"><small>Nincs adat ehhez a csapathoz</small></div>';
        return;
    }

    // Statistics calculations
    let homeWins = 0, homeDraws = 0, homeLosses = 0;
    let awayWins = 0, awayDraws = 0, awayLosses = 0;
    let goalsScored = 0, goalsConceded = 0;
    let totalHomeMatches = 0, totalAwayMatches = 0;

    teamMatches.forEach(match => {
        const isHome = match.HomeTeam === teamName;
        
        if (isHome) {
            totalHomeMatches++;
            goalsScored += match.FTHG;
            goalsConceded += match.FTAG;
            if (match.FTR === 'H') homeWins++;
            else if (match.FTR === 'D') homeDraws++;
            else homeLosses++;
        } else {
            totalAwayMatches++;
            goalsScored += match.FTAG;
            goalsConceded += match.FTHG;
            if (match.FTR === 'A') awayWins++;
            else if (match.FTR === 'D') awayDraws++;
            else awayLosses++;
        }
    });

    const totalMatches = teamMatches.length;
    const totalWins = homeWins + awayWins;
    const totalDraws = homeDraws + awayDraws;
    const totalLosses = homeLosses + awayLosses;
    const winRate = ((totalWins / totalMatches) * 100).toFixed(1);
    const avgGoalsScored = (goalsScored / totalMatches).toFixed(2);
    const avgGoalsConceded = (goalsConceded / totalMatches).toFixed(2);

    // Display HTML
    container.innerHTML = `
        <div class="mb-3">
            <strong style="font-size: 16px;">${teamName}</strong>
            <div class="mt-2"><small class="text-muted">📊 ${totalMatches} mérkőzés elemezve</small></div>
        </div>

        <!-- Overall Record -->
        <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <small><strong>📈 Összesített Eredmények</strong></small>
            </div>
            <div class="d-flex justify-content-around text-center">
                <div>
                    <div style="font-size: 20px; font-weight: bold; color: #1cc88a;">${totalWins}</div>
                    <small class="text-muted">Győzelem</small>
                </div>
                <div>
                    <div style="font-size: 20px; font-weight: bold; color: #f6c23e;">${totalDraws}</div>
                    <small class="text-muted">Döntetlen</small>
                </div>
                <div>
                    <div style="font-size: 20px; font-weight: bold; color: #e74a3b;">${totalLosses}</div>
                    <small class="text-muted">Vereség</small>
                </div>
            </div>
        </div>

        <!-- Win Rate Progress -->
        <div class="mb-3">
            <small><strong>Győzelmi Arány</strong></small>
            <div class="progress mt-1" style="height: 25px;">
                <div class="progress-bar bg-success" style="width: ${winRate}%">
                    <strong>${winRate}%</strong>
                </div>
            </div>
        </div>

        <!-- Home vs Away -->
        <div class="mb-3">
            <small><strong>🏠 Hazai vs ✈️ Vendég</strong></small>
            <div class="row mt-2 text-center">
                <div class="col-6">
                    <div class="p-2 bg-dark rounded">
                        <div style="font-size: 18px; font-weight: bold; color: #667eea;">${homeWins}-${homeDraws}-${homeLosses}</div>
                        <small class="text-muted">Hazai (${totalHomeMatches})</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="p-2 bg-dark rounded">
                        <div style="font-size: 18px; font-weight: bold; color: #f39c12;">${awayWins}-${awayDraws}-${awayLosses}</div>
                        <small class="text-muted">Vendég (${totalAwayMatches})</small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Goal Stats -->
        <div class="mb-3">
            <div class="row text-center">
                <div class="col-6">
                    <div class="p-2 border border-success rounded">
                        <div style="font-size: 24px; font-weight: bold; color: #1cc88a;">⚽ ${avgGoalsScored}</div>
                        <small class="text-muted">Átlag rúgott gól</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="p-2 border border-danger rounded">
                        <div style="font-size: 24px; font-weight: bold; color: #e74a3b;">🥅 ${avgGoalsConceded}</div>
                        <small class="text-muted">Átlag kapott gól</small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Goal Difference -->
        <div class="text-center p-2 bg-dark rounded">
            <small class="text-muted">Gólkülönbség per meccs</small>
            <div style="font-size: 22px; font-weight: bold; color: ${(avgGoalsScored - avgGoalsConceded) > 0 ? '#1cc88a' : '#e74a3b'};">
                ${(avgGoalsScored - avgGoalsConceded) > 0 ? '+' : ''}${(avgGoalsScored - avgGoalsConceded).toFixed(2)}
            </div>
        </div>
    `;
}
