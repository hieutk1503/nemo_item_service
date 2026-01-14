const prisma = require('../config/db');

const CatalogRepo = {
    // Xem chi tiết 1 vật phẩm
    findById: async (id) => {
        return await prisma.itemCatalog.findUnique({
            where: { id: Number(id) },
            include: { rule: true }
        });
    },

    // Tìm vật phẩm theo game
    findAllByGame: async (gameId) => {
        return await prisma.itemCatalog.findMany({
            where: { game_id: gameId }
        });
    }
};

module.exports = CatalogRepo;