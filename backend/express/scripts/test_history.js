const http = require('http');

const API_BASE = 'http://127.0.0.1:8000';

function request(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(API_BASE + path, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(json);
                    } else {
                        resolve({ error: true, status: res.statusCode, data: json });
                    }
                } catch (e) {
                    resolve({ error: true, status: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    try {
        console.log('Logging in (registering new temp user)...');
        const email = `history_${Date.now()}@test.com`;
        await request('POST', '/e-api/v1/auth/register', { email, password: 'password123' });
        const loginRes = await request('POST', '/e-api/v1/auth/login', { email, password: 'password123' });
        const token = loginRes.accessToken;
        const userId = loginRes.user.id;

        console.log('Creating Record...');
        const recordBody = {
            itemType: 'FLASHCARD',
            itemId: '000000000000000000000001', // Dummy ID
            itemTitle: 'Test Deck',
            score: 85,
            status: 'COMPLETED',
            details: { count: 10 }
        };
        const createRes = await request('POST', '/e-api/v1/records', recordBody, token);
        if (createRes.error) throw new Error(`Create Failed: ${JSON.stringify(createRes)}`);
        console.log('Record Created');

        console.log('Fetching History...');
        const listRes = await request('GET', '/e-api/v1/records/history', null, token);
        if (listRes.error) throw new Error(`List Failed: ${JSON.stringify(listRes)}`);

        if (listRes.length !== 1 || listRes[0].score !== 85) {
            throw new Error('History mismatch or empty');
        }
        console.log(`History verified. Found ${listRes.length} records.`);

        console.log('History Test Passed!');

    } catch (e) {
        console.error('Test Failed:', e);
        process.exit(1);
    }
}

run();
