# E-commerce Frontend

## Bắt đầu

1. Sao chép `.env.example` thành `.env.local` và cập nhật API URL nếu cần.
2. Chạy `npm run dev`.

## Format code

Chạy `npm run format` để format toàn bộ mã nguồn hoặc `npm run format:check` để kiểm tra mà không sửa file. Prettier dùng thụt lề 2 spaces, dấu chấm phẩy và độ rộng dòng mục tiêu 100 ký tự. ESLint kiểm tra chất lượng code, Prettier phụ trách định dạng.

Trong VS Code, cài extension **Prettier - Code formatter** (`esbenp.prettier-vscode`) theo đề xuất của workspace để tự format khi lưu. Các file `.env`, file sinh tự động và lockfile được bỏ qua.

## Thư mục

- `src/app`: App Router và các route.
- `src/components`: các component dùng chung.
- `src/features`: mã theo domain (cart, auth, product, checkout...).
- `src/lib`: API client và utilities.
- `src/types`: kiểu dữ liệu dùng chung.

## Tích hợp API

Browser gọi `/api/v1`; Next.js rewrite chuyển tiếp đến `BACKEND_API_URL` (mặc định `http://localhost:8080`). Khởi động backend trước khi thử luồng mua hàng; thay đổi cấu hình proxy cần khởi động lại Next.js.

- `src/lib/api/types.ts` giữ nguyên tên field response backend; request body dùng camelCase.
- `src/features/*/api` chứa adapters auth, catalog, cart, account/orders/wishlist, seller và admin. Adapter unwrap `data.content`.
- Token chỉ giữ trong memory, refresh single-flight và retry protected request tối đa một lần khi 401. Tải lại trang cần đăng nhập lại; chưa có BFF HttpOnly session.
- Giao diện: `/products`, `/products/[id]`, `/login`, `/register`, `/account`, `/cart`, `/wishlist`, `/orders`, `/orders/[id]`.
- Checkout hỗ trợ chọn từng dòng, một voucher và COD/SePay. Key và toàn bộ payload được giữ trong sessionStorage theo user để retry; nếu storage không khả dụng thì giữ trong memory. Kiểm tra lịch sử trước khi bắt đầu lần đặt mới khi kết quả cũ chưa rõ.
- API giỏ hàng thiếu tên/giá/product ID, nên hiện hiển thị variant ID và số lượng. Không tự tính tổng giá từ dữ liệu thiếu. Cần backend bổ sung hydrate cart/checkout preview để hoàn thiện trải nghiệm.
- Seller/admin có màn hình quản lý voucher; các phần quản trị khác mới có API adapters. Chưa có upload ảnh hoặc lọc nâng cao.

Kiểm tra: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`. Cần backend và database chạy để xác minh end-to-end với tài khoản/sản phẩm thật.

## Voucher, SePay và chat

- `/vouchers`: mã sàn public; `/sellers/[id]/vouchers`: mã shop; `/manage/vouchers`: tạo và bật/tắt theo UUID, backend xác minh quyền. Không có danh sách quản trị đầy đủ từ backend.
- Preview được gọi theo mã, tập variant và số lượng; request cũ được hủy, lỗi không giữ giá giảm. Chọn rỗng chặn preview và đặt hàng. Preview không giữ kho hoặc lượt voucher.
- Sau checkout SePay, `/orders/[id]` lấy QR/ngân hàng/nội dung từ `/orders/:id/payment`, kiểm tra mỗi 4 giây khi pending và dừng khi lỗi, rời trang, logout hoặc đã kết thúc. Không tự xác nhận thanh toán. Đơn tổng 0 từ preview chuyển sang COD.
- `/chat` và `/chat/[id]`: inbox chung cho buyer/thành viên shop, mở chat từ sản phẩm. Chỉ plain text, không có ảnh/online presence/sửa tin.
- Một WebSocket dùng chung khi đăng nhập. Auth bằng frame; ACK có timeout, gửi lại cùng clientMessageId; typing có throttle và hết hạn; reconnect backoff và chia sẻ refresh single-flight với HTTP. 429 chặn gửi WS 30 giây.
- Tin hiển thị được tải từ REST, merge theo id/sequence. Push và reconnect kích hoạt tải bù sau cursor REST, không nâng cursor bằng push. Hội thoại đang mở cũng kiểm tra REST mỗi 15 giây để bù push bị mất. Read marker chỉ gửi khi tab có focus và cuộn đến cuối lịch sử.

Thêm vào môi trường frontend:

```dotenv
NEXT_PUBLIC_WS_URL=ws://localhost:8080/api/v1/ws
```

Production dùng `wss://` với host backend/reverse proxy hỗ trợ Upgrade. Next HTTP rewrite không được giả định là WebSocket proxy. Backend cần `WEBSOCKET_ORIGINS` chứa origin frontend. Biến `NEXT_PUBLIC_*` được đưa vào bundle; sau thay đổi cần restart/build lại. Không đưa token vào URL.

Trước nghiệm thu, dùng hai tài khoản buyer/shop để xác minh quyền chat, ngắt mạng/reconnect, retry ACK, đọc tin, voucher đã dùng/hết lượt, checkout timeout và trạng thái SePay thật. Test tự động hiện kiểm tra merge tin, giới hạn Unicode và payload checkout; chưa thay thế kiểm thử backend/SePay end-to-end.
