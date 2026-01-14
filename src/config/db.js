const { PrismaClient } = require('@prisma/client');

// Khởi tạo connection
const db = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'], 
});

// Test 
async function connect() {
    try {
        await db.$connect();
        console.log('Kết nối MySQL thành công!');
    } catch (error) {
        console.error(' Lỗi kết nối Database:', error);
        process.exit(1); 
    }
}

connect();

module.exports = db;