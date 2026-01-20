// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Đang khởi tạo dữ liệu mẫu...');

  // 1. Tạo Luật Game (ItemUsageRule)
  // Bắt buộc phải có: name, daily_limit, game_id
  const rule = await prisma.itemUsageRule.create({
    data: {
      name: "Luật Mặc Định (Test)",  // [BẮT BUỘC] Tên luật
      daily_limit: 5,                // [BẮT BUỘC] Giới hạn ngày
      cooldown_seconds: 10,          // Hồi chiêu 10s
      game_id: 1,                    // [BẮT BUỘC] ID Game (Kiểu Int)
      min_level_required: 0          // Level tối thiểu
    }
  });
  console.log('Đã tạo Rule ID: ${rule.id}');

  // 2. Tạo Catalog Vật Phẩm (ItemCatalog)
  // Bắt buộc phải có: game_id (String), name, type, rule_id
  const catalog = await prisma.itemCatalog.create({
    data: {
      name: "Bình Máu Test",         // [BẮT BUỘC] Tên vật phẩm
      type: "CONSUMABLE",            // [BẮT BUỘC] Loại vật phẩm (VD: Tiêu hao)
      game_id: "GAME_01",            // [BẮT BUỘC] ID Game (Kiểu String - lưu ý khác với Rule)
      max_usages: 10,                // Số lần dùng tối đa
      rule_id: rule.id               // [BẮT BUỘC] Áp dụng luật vừa tạo ở trên
    }
  });

  console.log('Đã tạo Catalog Item: "${catalog.name}" (ID: ${catalog.id})');
  
  // 3. (Tùy chọn) Tạo thử 1 Inventory cho User ID 1 để test luôn
  const inventory = await prisma.inventory.create({
    data: {
        user_id: 1,
        item_catalog_id: catalog.id,
        remaining_uses: 10,
        daily_counter: 0,
        source: "SEED_DATA",
        status: "AVAILABLE"
    }
  });
  console.log('Đã tạo sẵn 1 món đồ trong túi cho User 1 (Inventory ID: ${inventory.id})');

  console.log('====================================');
  console.log('ID Catalog để test API Grant: ' + catalog.id);
  console.log('ID Inventory để test API Use: ' + inventory.id);
}

main()
  .catch((e) => {
    console.error("Lỗi khi chạy Seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });