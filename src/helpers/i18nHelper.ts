import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';
import { Logger } from "../utils/Logger"

export class I18nHelper {
    private static instance: I18nHelper;
    private isInitialized = false;

    public static getInstance(): I18nHelper {
        if (!I18nHelper.instance) {
            I18nHelper.instance = new I18nHelper();
        }
        return I18nHelper.instance;
    }

    public async init() {
        if (this.isInitialized) return;

        try {
            await i18next
                .use(Backend) // Dùng plugin đọc file hệ thống
                .init({
                    // Cấu hình đường dẫn file ngôn ngữ
                    // %s tương ứng với language (en, vi)
                    // {{ns}} tương ứng với namespace (mặc định là translation)
                    backend: {
                        loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json')
                    },
                    fallbackLng: 'en',
                    preload: ['vi', 'en', 'khmer'],
                    ns: ['translation'],
                    defaultNS: 'translation',
                    interpolation: {
                        escapeValue: false
                    }
                });
            
            this.isInitialized = true;
            Logger.info('✅ [I18n] Server Localization Initialized');
        } catch (error) {
            Logger.error('❌ [I18n] Init failed', error);
        }
    }

    /**
     * Hàm dịch quan trọng nhất cho Server
     * @param key Key trong file json (VD: "errors.not_enough_money")
     * @param lang Ngôn ngữ đích (Lấy từ Request của user)
     * @param options Các biến truyền vào (VD: { quantity: 5 })
     */
    public t(key: string, lang: string = 'en', options?: any): string {
        // Dùng getFixedT để lấy hàm dịch cố định cho ngôn ngữ đó
        // Hoặc gọi trực tiếp t với option lng (An toàn cho đa luồng)
        return i18next.t(key, { ...options, lng: lang }) as string;
    }
}

// Export instance
export const I18n = I18nHelper.getInstance();