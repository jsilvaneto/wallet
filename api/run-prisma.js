const { execSync } = require('child_process');

try {
    console.log('Running prisma generate...');
    execSync('npx prisma generate', {
        env: {
            ...process.env,
            DATABASE_URL: 'postgresql://wallet_user:wallet_password@postgres:5432/wallet_db?schema=public'
        },
        stdio: 'inherit'
    });

    console.log('Running prisma db push...');
    execSync('npx prisma db push --accept-data-loss', {
        env: {
            ...process.env,
            DATABASE_URL: 'postgresql://wallet_user:wallet_password@postgres:5432/wallet_db?schema=public'
        },
        stdio: 'inherit'
    });

    console.log('Prisma setup completed successfully.');
} catch (error) {
    console.error('Error during Prisma setup:', error.message);
    process.exit(1);
}
