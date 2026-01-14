const prisma = require('../config/db');

const RuleRepo = {
    // lấy thông tin luật
    findById: async (id) => {
        return await prisma.itemUsageRule.findUnique({
            where: { id: Number(id) }
        });
    },

    // tạo 1 luật mới (ADMIN)
    create: async (data) => {
        return await prisma.itemUsageRule.create({
            data: data
        });
    }
};

module.exports = RuleRepo;