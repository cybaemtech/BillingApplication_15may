const mssql = require('mssql/msnodesqlv8');
require('dotenv').config();

async function test() {
    try {
        const config = {
            server: process.env.DATABASE_SERVER.split('\\')[0],
            database: process.env.DATABASE_NAME,
            options: {
                trustServerCertificate: true,
                instanceName: process.env.DATABASE_INSTANCE,
                trustedConnection: true
            }
        };

        console.log('Testing msnodesqlv8 with config object:', config);
        await mssql.connect(config);
        console.log('Success with config object!');
        process.exit(0);
    } catch (err) {
        console.error('Failed with config object:', err.message);

        try {
            console.log('Trying with DATABASE_URL connection string...');
            await mssql.connect(process.env.DATABASE_URL + 'Driver={SQL Server Native Client 11.0};');
            console.log('Success with connection string!');
            process.exit(0);
        } catch (err2) {
            console.error('Failed with connection string:', err2.message);
            process.exit(1);
        }
    }
}

test();
