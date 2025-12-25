# 🏔️ Blueprint: The Practice Nexus Consolidation

Chiến dịch hợp nhất toàn diện hệ thống luyện tập Hanabira, chuyển đổi từ mô hình phân tán (`/jlpt`, `/quiz`) sang một trung tâm huấn luyện thống nhất (`/practice`) tại Nexus Hub.

---

## 🏛️ Phase 1: Neural Infrastructure (Core Data & Logic)
**Mục tiêu:** Xây dựng nền móng dữ liệu hợp nhất, loại bỏ sự chồng chéo giữa JLPT và Quiz.

- [ ] **Unified Type Definition**: Cập nhật `src/types/practice.ts` để sử dụng cấu trúc `PracticeNode` (gộp `ExamConfig` và `QuizListItem`).
- [ ] **Tag-based Metadata**: Triển khai `PracticeTags` (Level, Skills, Origin) làm trung tâm định danh cho bài tập.
- [ ] **Service Consolidation**: Tạo `src/services/practiceService.ts` để gộp logic từ `jlptService` và `quizService`. 
- [ ] **Mock Data Migration**: Chuyển đổi dữ liệu mẫu (`mockPractice`) sang định dạng `PracticeNode` mới.
- [ ] **Identity Logic**: Tích hợp `UserContext` vào service để xử lý phân cấp dữ liệu Guest vs. User (Highest score, progress).

---

## 🎨 Phase 2: Design Language (UI Components)
**Mục tiêu:** Thiết kế các thành phần giao diện theo phong cách "Neural-Premium" và hỗ trợ bố cục dọc.

- [ ] **Advanced Filter Lab**: Xây dựng bộ lọc nâng cao hỗ trợ: 
    - [ ] Protocol (Full Exam, Quick Quiz, AI Synthesis).
    - [ ] Execution Rules (Timed, Unlimited).
    - [ ] Personal Status (Never attempted, Completed).
- [ ] **The Neural Row**: Phát triển `PracticeListCard.tsx` (Component dạng dọc):
    - [ ] Hỗ trợ identity badges (Level N1-N5).
    - [ ] Hiển thị personal stats (Best score, Status).
    - [ ] Chế độ khóa (Locked) dành cho Guest.
- [ ] **Global CSS Audit**: Đảm bảo toàn bộ component sử dụng `neutral-ink` và không có opacity thấp cho văn bản/icon.

---

## 🚀 Phase 3: The Nexus Deployment (Main Page)
**Mục tiêu:** Triển khai trang `/practice` và xử lý chuyển hướng hệ thống cũ.

- [ ] **Practice Hub implementation**: Xây dựng `src/app/practice/page.tsx` với bố cục dọc.
- [ ] **Data Fetching Layer**: Cài đặt logic tải dữ liệu từ `practiceService` dựa trên bộ lọc nâng cao.
- [ ] **View Switcher**: Thêm tùy chọn chuyển đổi giữa List và Grid (mặc định là List).
- [ ] **System-wide Redirects**: 
    - [ ] Redirect `/jlpt` -> `/practice`.
    - [ ] Redirect `/quiz` -> `/practice`.
- [ ] **Sidebar Sync**: Cập nhật icon và link trong `CollapsibleSidebar` để trỏ về Hub duy nhất.

---

## 🏁 Phase 4: Polish & Performance
**Mục tiêu:** Tối ưu hóa trải nghiệm và đảm bảo tính mượt mà.

- [ ] **Smooth Transitions**: Thêm hiệu ứng `AnimatePresence` khi lọc bài tập.
- [ ] **Skeleton Loaders**: Xây dựng trạng thái chờ (Loading) theo cấu trúc hàng dọc.
- [ ] **Mobile Optimization**: Đảm bảo danh sách dọc hiển thị hoàn hảo trên điện thoại.
- [ ] **Final Visual Audit**: Kiểm tra độ tương phản đen-trắng trên tất cả các trạng thái hover/active.

---

## 📊 Summary of Evolution

| Feature | Old System (/jlpt & /quiz) | New Nexus Hub (/practice) |
| :--- | :--- | :--- |
| **Data Model** | Split (ExamConfig vs QuizListItem) | Unified (`PracticeNode`) |
| **Filtering** | Basic (Level, Category) | Advanced (Mode, Timing, Status, Origin) |
| **Card Layout** | 3-Column Grid | **Premium Vertical List** (Neural Row) |
| **Identity** | Basic session tracking | High-score & Progress persistence |
| **Navigation** | Two separate hubs | One Central Command Center |
