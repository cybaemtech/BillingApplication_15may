import sql from 'msnodesqlv8';

async function test() {
    const connectionString = 'Server=DESKTOP-9LSMK42\\SQLEXPRESS;Database=billing_application;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server};';
    console.log('Trying raw connect...');
    sql.query(connectionString, 'SELECT @@VERSION', (err, rows) => {
        if (err) {
            console.error('Failed!', err);
            process.exit(1);
        }
        console.log('Success!', rows);
        process.exit(0);
    });
}

test();
