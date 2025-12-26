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
                        // resolve even if error to handle logic
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
        console.log('Registering...');
        const email = `follow_${Date.now()}@test.com`;
        const regRes = await request('POST', '/e-api/v1/auth/register', { email, password: 'password123' });

        if (regRes.error && regRes.status !== 409) {
            throw new Error(`Register failed: ${JSON.stringify(regRes)}`);
        }

        console.log('Logging in...');
        const loginRes = await request('POST', '/e-api/v1/auth/login', { email, password: 'password123' });
        if (loginRes.error) throw new Error(`Login failed: ${JSON.stringify(loginRes)}`);

        const token = loginRes.accessToken;
        console.log('Got token');

        console.log('Fetching global node...');
        const nodesRes = await request('GET', '/e-api/v1/practice/nodes?visibility=global');
        if (nodesRes.error || !nodesRes.nodes || nodesRes.nodes.length === 0) {
            throw new Error('No global nodes found to follow');
        }
        const nodeId = nodesRes.nodes[0].id;
        console.log(`Will follow node ${nodeId}`);

        console.log('Following...');
        const followRes = await request('POST', '/e-api/v1/users/follow', {
            itemId: nodeId,
            itemType: 'PRACTICE'
        }, token);

        if (followRes.error) throw new Error(`Follow failed: ${JSON.stringify(followRes)}`);
        console.log('Followed successfully');

        console.log('Verifying followed list...');
        const listRes = await request('GET', '/e-api/v1/users/followed', null, token);
        if (listRes.error) throw new Error(`List failed: ${JSON.stringify(listRes)}`);

        const found = listRes.some(i => i.itemId === nodeId && i.itemType === 'PRACTICE');
        if (!found) throw new Error('Item not found in followed list');

        console.log('Follow Test Passed!');

    } catch (e) {
        console.error('Test Failed:', e);
        process.exit(1);
    }
}

run();
