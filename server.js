// Simple Node.js proxy server for Premier League data
// Fetches real data from premierleague.com (pulselive API)

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3000;

const PULSE_HOST = 'footballapi.pulselive.com';

// Cache season lookup so we don't hit /compseasons on every request
let cachedCompSeason = {
    id: null,
    label: null,
    fetchedAtMs: 0
};

function getLikelyCurrentSeasonLabel(now = new Date()) {
    // Premier League season label is like "2025/26".
    // Season typically starts mid-year; if we're in Jan-Jun, use previous year as start.
    const month = now.getMonth(); // 0-11
    const startYear = month >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    const endYearShort = String((startYear + 1) % 100).padStart(2, '0');
    return `${startYear}/${endYearShort}`;
}

function httpsGetJson(options) {
    return new Promise((resolve, reject) => {
        https
            .get(options, (apiRes) => {
                let data = '';
                apiRes.on('data', (chunk) => {
                    data += chunk;
                });
                apiRes.on('end', () => {
                    if (!apiRes.statusCode || apiRes.statusCode < 200 || apiRes.statusCode >= 300) {
                        reject(new Error(`Upstream HTTP ${apiRes.statusCode ?? 'unknown'}: ${data.slice(0, 300)}`));
                        return;
                    }
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error(`Invalid JSON: ${e.message}`));
                    }
                });
            })
            .on('error', (error) => reject(error));
    });
}

async function resolveCurrentCompSeasonId() {
    const now = Date.now();
    const cacheTtlMs = 6 * 60 * 60 * 1000; // 6 hours
    if (cachedCompSeason.id && now - cachedCompSeason.fetchedAtMs < cacheTtlMs) {
        return cachedCompSeason.id;
    }

    const likelyLabel = getLikelyCurrentSeasonLabel();

    const options = {
        hostname: PULSE_HOST,
        path: '/football/competitions/1/compseasons?pageSize=50',
        method: 'GET',
        headers: {
            Origin: 'https://www.premierleague.com',
            Referer: 'https://www.premierleague.com/',
            Accept: 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    };

    const json = await httpsGetJson(options);
    const seasons = Array.isArray(json?.content) ? json.content : [];
    if (seasons.length === 0) {
        throw new Error('No compSeasons returned from upstream');
    }

    const byLabel = seasons.find((s) => s?.label === likelyLabel);
    const picked = byLabel || seasons.find((s) => s?.isCurrent) || seasons[0];

    cachedCompSeason = {
        id: picked?.id ?? null,
        label: picked?.label ?? null,
        fetchedAtMs: now
    };

    if (!cachedCompSeason.id) {
        throw new Error('Could not resolve compSeason id');
    }

    console.log(`🗓️  Using compSeason ${cachedCompSeason.id} (${cachedCompSeason.label ?? 'unknown'})`);
    return cachedCompSeason.id;
}

const server = http.createServer(async (req, res) => {
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

    // Debug: /api/_debug/season - show which compSeason will be used
    if (parsedUrl.pathname === '/api/_debug/season') {
        try {
            const id = await resolveCurrentCompSeasonId();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
                JSON.stringify({
                    compSeasonId: id,
                    label: cachedCompSeason.label,
                    likelyLabel: getLikelyCurrentSeasonLabel(),
                    cachedAtMs: cachedCompSeason.fetchedAtMs
                })
            );
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // Endpoint: /api/table - Get Premier League table/standings
    if (parsedUrl.pathname === '/api/table') {
        console.log('📡 Fetching live Premier League table...');

        try {
            const forcedCompSeason = parsedUrl.query.compSeasonId
                ? Number(parsedUrl.query.compSeasonId)
                : null;
            const compSeasonId = forcedCompSeason || (await resolveCurrentCompSeasonId());

            const options = {
                hostname: PULSE_HOST,
                path: `/football/standings?pageSize=20&compSeasons=${encodeURIComponent(
                    String(compSeasonId)
                )}&comps=1&altIds=true`,
                method: 'GET',
                headers: {
                    Origin: 'https://www.premierleague.com',
                    Referer: 'https://www.premierleague.com/',
                    Accept: 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            };

            const jsonData = await httpsGetJson(options);
            const tableData = parseAPIResponse(jsonData);

            if (!Array.isArray(tableData) || tableData.length <= 1) {
                throw new Error('Empty table after parsing');
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(tableData));
            console.log('✅ Live table data sent:', tableData.length - 1, 'teams');
        } catch (error) {
            console.error('❌ /api/table error:', error.message);
            const fallbackData = getCachedData();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(fallbackData));
        }
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found. Use /api/table' }));
});

function parseAPIResponse(jsonData) {
    const tableData = [
        ["Position", "Team", "Played", "Wins", "Draws", "Losses", "Goal Difference", "Points"]
    ];
    
    try {
        const entries = jsonData?.tables?.[0]?.entries;
        if (!Array.isArray(entries)) {
            throw new Error('Missing tables[0].entries');
        }

        entries.forEach((entry) => {
            const overall = entry?.overall ?? entry;
            tableData.push([
                entry?.position,
                entry?.team?.name,
                overall?.played,
                overall?.won,
                overall?.drawn,
                overall?.lost,
                overall?.goalsDifference ?? overall?.goalDifference,
                overall?.points
            ]);
        });

        console.log('✅ Parsed', entries.length, 'teams from API');
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
