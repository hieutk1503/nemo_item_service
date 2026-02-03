import { PrismaClient, RewardType, SourceType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('⏳ Đang dọn dẹp Database...');
  // Xóa dữ liệu cũ theo thứ tự quan hệ
  // await prisma.inventory.deleteMany({});
  // await prisma.orders_item.deleteMany({});
  // await prisma.orders.deleteMany({});
  // await prisma.rewardHistory.deleteMany({});
  // await prisma.luckyboxPrizeConfig.deleteMany({});
  // await prisma.leaderboardPrizeConfig.deleteMany({});
  // await prisma.item.deleteMany({});
  // await prisma.category.deleteMany({});
  // await prisma.subscription.deleteMany({});
  // await prisma.plan.deleteMany({});
  // await prisma.user.deleteMany({});
  // await prisma.game.deleteMany({});

  console.log('✅ Đang tạo dữ liệu mới...');

  // 1. Tạo Game mẫu
  const game = await prisma.game.create({
    data: {
      code: 'MYSTERY_BOX',
      name: 'Nemo Mystery Box 2026',
      baseUrl: 'https://mystery.nemo.vn',
      isActive: true,
    },
  });

  // 2. Tạo User mẫu
  const user = await prisma.user.create({
    data: {
      msisdn: '0912345678',
      username: 'hieunm_dev',
      fullName: 'Nguyễn Minh Hiếu',
      lang: 'vi'
    },
  });

  // 3. Tạo Category & Item
  const catItem = await prisma.category.create({
    data: {
      category_code: 'GIFT',
      category_name: 'Quà tặng sự kiện',
      items: {
        create: [
          {
            item_code: 'GOLD_KEY',
            item_name: 'Chìa khóa vàng',
            price: 1000,
            metadata: { limit_per_session: 3 }
          },
          {
            item_code: 'SILVER_CHEST',
            item_name: 'Rương bạc',
            price: 500,
            metadata: { rarity: 'Rare' }
          }
        ]
      }
    }
  });

  // 4. Tạo Gói cước (Plans)
  const planVip = await prisma.plan.create({
    data: {
      gameId: game.id,
      name: 'Gói VIP Tháng',
      price: 50000,
      duration_days: 30,
      packageCode: 'VIP_30D',
      description: 'Nhận thêm lượt quay mỗi ngày'
    }
  });

  // 5. Tạo Cấu hình Quà tặng (Luckybox)
  await prisma.luckyboxPrizeConfig.create({
    data: {
      gameId: game.code,
      rewardType: RewardType.Items,
      rewardId: 'GOLD_KEY', // Liên kết qua mã item
      quantity: 1,
      weight: 10.5, // 10.5% tỉ lệ trúng
      isActive: true
    }
  });

  // 6. Tạo đơn hàng mẫu (Orders)
  await prisma.orders.create({
    data: {
      game_id: game.code,
      user_id: user.msisdn,
      total_amount: 50000,
      status: 'SUCCESS',
      payment_method: 'VND',
      orders_item: {
        create: {
          product_id: planVip.id,
          quantity: 1,
          unit_price: 50000,
          total_price: 50000
        }
      }
    }
  });

  // 7. Tạo Subscription mẫu
  await prisma.subscription.create({
    data: {
      userId: user.msisdn,
      planId: planVip.id,
      status: 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  console.log('🚀 SEED HOÀN TẤT!');
  console.log(`- User Test: ${user.msisdn}`);
  console.log(`- Game Test: ${game.code}`);
  console.log(`- Item ID 1: GOLD_KEY`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });