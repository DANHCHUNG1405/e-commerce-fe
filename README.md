# E-commerce Frontend

## Bắt đầu

1. Sao chép `.env.example` thành `.env.local` và cập nhật API URL nếu cần.
2. Chạy `npm run dev`.

## Cấu trúc

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
- Checkout COD giữ idempotency key và địa chỉ trong lần thử hiện tại. Không tải lại/rời trang khi kết quả đặt hàng chưa rõ; kiểm tra lịch sử đơn hàng trước khi đặt lại.
- API giỏ hàng thiếu tên/giá/product ID, nên hiện hiển thị variant ID và số lượng. Không tự tính tổng giá từ dữ liệu thiếu. Cần backend bổ sung hydrate cart/checkout preview để hoàn thiện trải nghiệm.
- Seller/admin đã có API adapters; chưa có màn hình quản trị. Không có endpoint upload ảnh, lọc nâng cao, thanh toán online hoặc coupon.

Kiểm tra: `npm run typecheck`, `npm run lint`, `npm run build`. Cần backend và database chạy để xác minh end-to-end với tài khoản/sản phẩm thật.
