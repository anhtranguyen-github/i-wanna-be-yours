const http = require('http');

const API_BASE = 'http://127.0.0.1:8000';

function get(path) {
    return new Promise((resolve, reject) => {
        http.get(API_BASE + path, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(json);
                    } else {
                        reject({ status: res.statusCode, data: json });
                    }
                } catch (e) {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    } else {
                        reject({ status: res.statusCode, data });
                    }
                }
            });
        }).on('error', reject);
    });
}

async function run() {
    try {
        console.log('Testing Global...');
        const globalRes = await get('/e-api/v1/practice/nodes?visibility=global');
        // Validate that all items are global or system
        const invalidGlobal = globalRes.nodes.filter(n => n.tags.visibility !== 'global');
        if (invalidGlobal.length > 0) throw new Error('Global filter returned non-global items');
        console.log(`Global OK: returned ${globalRes.nodes.length} items`);

        console.log('Testing Public...');
        const publicRes = await get('/e-api/v1/practice/nodes?visibility=public');
        // Validate that all items are public
        const invalidPublic = publicRes.nodes.filter(n => n.tags.visibility !== 'public');
        if (invalidPublic.length > 0) throw new Error('Public filter returned non-public items');
        console.log(`Public OK: returned ${publicRes.nodes.length} items`);

        console.log('Testing All (Default)...');
        const allRes = await get('/e-api/v1/practice/nodes');
        // We expect some results usually
        console.log(`All OK: returned ${allRes.nodes.length} items`);

        console.log('Unified Access Tests Passed!');
    } catch (e) {
        console.error('Test Failed:', e);
        if (e.code === 'ECONNREFUSED') {
            console.error('Server is not running on port 8000');
        }
        process.exit(1);
    }
}

run();
