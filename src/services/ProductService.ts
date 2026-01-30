import storeManager from '../manager/StoreManager'; 
import { ServiceResponse } from '../utils/ServiceResponse';
// ✅ Sửa lại Import để dùng đúng Instance cho Item/Product
import { ItemActionLogger as ItemLogger } from '../utils/Logger'; 

// Định nghĩa kiểu dữ liệu cho User
interface UserData {
    id?: string; // ✅ Chuyển sang string vì msisdn là VarChar
    name?: string;
}

interface FilterData {
    keyword?: string;
}

class ProductService {

    /**
     * Lấy danh sách sản phẩm theo Game
     */
    async getProduct(gameId: number | string, filter: FilterData, userData: UserData) {
        try {
            const parsedGameId = Number(gameId);
            if (isNaN(parsedGameId)) {
                return ServiceResponse.Fail("Game ID không hợp lệ");
            }

            // 1. Gọi Manager để lấy dữ liệu thô từ DB
            let products = await storeManager.findItemsByGameId(parsedGameId);

            // 2. Xử lý Filter (Tìm kiếm theo keyword)
            if (filter?.keyword) {
                const keyword = filter.keyword.toLowerCase();
                products = products.filter((p: any) => 
                    p.item_name?.toLowerCase().includes(keyword)
                );
            }

            // 3. Map dữ liệu trả về theo Schema mới
            const result = products.map((p: any) => ({
                id: p.item_id,          // ✅ item_id trong Schema
                name: p.item_name,      // ✅ item_name trong Schema
                price: p.price,
                description: p.description,
                icon: p.icon_url,
                item_code: p.item_code  // ✅ Bổ sung thêm item_code nếu cần
            }));

            // 4. Ghi Log vào MongoDB (collection: item_actions)
            ItemLogger.info('VIEW_LIST', { 
                userId: userData?.id || 'Guest',
                userName: userData?.name || 'N/A',
                resourceId: parsedGameId, 
                count: result.length,
                details: `User xem danh sách sản phẩm game ${parsedGameId}`
            });

            return ServiceResponse.Success(result, "Lấy danh sách thành công");

        } catch (err: any) {
            // ✅ Log lỗi vào file và MongoDB
            ItemLogger.error('ERROR_LIST', { error: err.message, stack: err.stack });
            return ServiceResponse.Fail(err.message || "Lỗi hệ thống");
        }
    }

    /**
     * Lấy chi tiết một sản phẩm
     */
    async getProductDetail(gameId: number | string, productId: number | string, userData: UserData) {
        try {
            const parsedGameId = Number(gameId);
            const parsedProductId = Number(productId);

            if (isNaN(parsedGameId) || isNaN(parsedProductId)) {
                return ServiceResponse.Fail("ID không hợp lệ");
            }

            // 1. Gọi Manager tìm item theo ID
            const product = await storeManager.findItemById(parsedProductId);

            // 2. Kiểm tra tồn tại
            if (!product) {
                return ServiceResponse.Fail("Vật phẩm không tồn tại");
            }

            // 3. Ghi Log chi tiết vào item_actions
            ItemLogger.info('VIEW_DETAIL', {
                userId: userData?.id || 'Guest',
                userName: userData?.name || 'N/A',
                resourceId: parsedProductId,
                itemName: product.item_name,
                price: product.price,
                details: `User xem chi tiết vật phẩm: ${product.item_name}`
            });

            // 4. Trả về kết quả khớp với Schema
            const result = {
                id: product.item_id,
                name: product.item_name,
                price: product.price,
                description: product.description,
                metadata: product.metadata,
                max_stack: product.max_stack,
                category_id: product.category_id
            };

            return ServiceResponse.Success(result, "Lấy chi tiết thành công");

        } catch (err: any) {
            ItemLogger.error('SYSTEM_ERROR', { error: err.message });
            return ServiceResponse.Fail(err.message || "Lỗi hệ thống");
        }
    }
}

export default new ProductService();