# QUY TRÌNH LÀM VIỆC VỚI DATABASE & PRISMA

## Cài đặt môi trường (Setup)
1. clone project từ git: git clone <repo-url>
2. cài đặt các dependencies: `npm install`
3. Cấu hình môi trường db local:
`DATABASE_URL="mysql://user:password@localhost:3306/mysterybox"`

Mọi người dùng local riêng không push env lên git
4. Khởi tạo lần đầu:
**`npx prisma migrate dev`**
5. Quy định khi làm db:
- Trước khi push code db mới lên localDB hoặc serverDB cần xem src tree hoặc hỏi trong nhóm xem có ai push code db mới lên không. nếu có thì pull code db mới về. Sau đó chạy lệnh:
**`npx prisma migrate dev`** để đồng bộ với db mới (nếu có)
sau đó mới chạy lệnh: 
**`npx prisma migrate dev --name "commit"`** (commit là message để lại giống github commit, nên để ngắn chút)
- Khi đó thì prisma sẽ sinh ra thư mục migration(đối với người update db đầu tiên) và các file migration tương ứng theo mẫu là: Date_commit
- Sau khi tạo xong db trong local hoặc server sẽ có bảng mới đã thêm và 1 bảng prisma tự sinh để quản lý các migration**
- Sau khi check đã đủ thì push code lên gitlab bao gồm cả các file trong migration và các thay đổi model.
- Sau khi push thành công check gitlab và báo cho người up db sau là có thay đổi.
Không được dùng lệnh: Lệnh này bỏ qua lịch sử migration, dễ gây mất dữ liệu 
**`npx prisma db push`**

# CHẠY DỰ ÁN
1. Đối với bên làm CORE_GAMESERVICE thì chạy bằng lệnh `npm run dev:core`
2. Đối với bên làm CMS thì chạy bằng lệnh `npm run dev:cms`