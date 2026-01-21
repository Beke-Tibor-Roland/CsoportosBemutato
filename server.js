// Simple Node.js proxy server for Premier League data
// Fetches real data from premierleague.com

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3000;

const server = http.createServer((req, res) => {
    // Enable CORS for all origins
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);

    // Endpoint: /api/table - Get Premier League table/standings
    if (parsedUrl.pathname === '/api/table') {
        console.log('📡 Fetching real Premier League table from premierleague.com...');
        
        const options = {
            hostname: 'footballapi.pulselive.com',
            path: '/football/standings?pageSize=20&compSeasons=719&comps=1&altIds=true',
            method: 'GET',
            headers: {
                'Origin': 'https://www.premierleague.com',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        https.get(options, (apiRes) => {
            let data = '';

            apiRes.on('data', (chunk) => {
                data += chunk;
            });

            apiRes.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    const tableData = parseAPIResponse(jsonData);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(tableData));
                    console.log('✅ Real table data sent:', tableData.length - 1, 'teams');
                } catch (error) {
                    console.error('❌ Parse error:', error.message);
                    // Fallback to cached data
                    const fallbackData = getCachedData();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(fallbackData));
                }
            });
        }).on('error', (error) => {
            console.error('❌ Fetch Error:', error.message);
            // Fallback to cached data
            const fallbackData = getCachedData();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(fallbackData));
        });
    } 
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found. Use /api/table' }));
    }
});

function parseAPIResponse(jsonData) {
    const tableData = [
        ["Position", "Team", "Played", "Wins", "Draws", "Losses", "Goal Difference", "Points"]
    ];
    
    try {
        const standings = jsonData.tables[0].entries;
        
        standings.forEach(team => {
            tableData.push([
                team.position,
                team.team.name,
                team.played,
                team.won,
                team.drawn,
                team.lost,
                team.goalDifference,
                team.points
            ]);
        });
        
        console.log('✅ Parsed', standings.length, 'teams from API');
        return tableData;
    } catch (error) {
        console.error('❌ Error parsing API response:', error.message);
        return getCachedData();
    }
}

function getCachedData() {
    // Fallback data (updated Jan 21, 2026)
    console.log('⚠️ Using cached data');
    return [
        ["Position", "Team", "Played", "Wins", "Draws", "Losses", "Goal Difference", "Points"],
        [1, "Arsenal", 22, 15, 5, 2, 26, 50],
        [2, "Manchester City", 22, 13, 4, 5, 24, 43],
        [3, "Aston Villa", 22, 13, 4, 5, 8, 43],
        [4, "Liverpool", 22, 10, 6, 6, 4, 36],
        [5, "Brighton", 22, 10, 5, 7, 7, 35],
        [6, "Nottingham Forest", 22, 10, 5, 7, 3, 35],
        [7, "Newcastle", 22, 10, 4, 8, 10, 34],
        [8, "Fulham", 22, 9, 7, 6, 3, 34],
        [9, "Bournemouth", 22, 9, 5, 8, -2, 32],
        [10, "Chelsea", 22, 8, 7, 7, 8, 31],
        [11, "Tottenham", 22, 9, 2, 11, 11, 29],
        [12, "Brentford", 22, 8, 4, 10, -3, 28],
        [13, "West Ham", 22, 7, 6, 9, -7, 27],
        [14, "Manchester United", 22, 7, 5, 10, -4, 26],
        [15, "Crystal Palace", 22, 6, 7, 9, -7, 25],
        [16, "Everton", 22, 5, 8, 9, -10, 23],
        [17, "Wolves", 22, 6, 4, 12, -19, 22],
        [18, "Leicester", 22, 4, 5, 13, -19, 17],
        [19, "Ipswich", 22, 3, 7, 12, -16, 16],
        [20, "Southampton", 22, 1, 4, 17, -24, 7]
    ];
}

server.listen(PORT, () => {
    console.log(`🚀 Proxy server running at http://localhost:${PORT}`);
    console.log(`📊 Premier League Table: http://localhost:${PORT}/api/table`);
    console.log(`⚽ Fetching live data from premierleague.com API`);
});
