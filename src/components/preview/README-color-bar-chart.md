# 🎨 Color Bar Chart Component

## I. Tổng quan

Component **ColorBarChart** hiển thị bảng thanh màu cho puzzle level, giúp người dùng dễ dàng theo dõi phân bố màu sắc và số lượng thanh cần thiết.

## II. Tính năng chính

### 🎯 **Logic phân tích màu sắc (Thanh xen kẽ + Drag & Drop)**

- **Quét board từ trên xuống dưới, từ trái qua phải** (theo yêu cầu)
- **Đếm tất cả block có màu** (bao gồm cả nội dung trong Pipe)
- **Mỗi thanh 1 màu duy nhất**: Không trộn màu trong cùng 1 thanh
- **Thanh liên tiếp khác màu**: Sử dụng round-robin để xen kẽ màu sắc
- **Thứ tự ưu tiên**: Theo thứ tự xuất hiện đầu tiên của màu trên board
- **🔄 Kéo thả để sắp xếp**: Có thể thay đổi vị trí thanh bằng drag & drop

### 📊 **Tính toán thanh màu**

- **Số thanh = Math.ceil(số block / 3)** (làm tròn lên)
- **Mỗi thanh chứa tối đa 3 block**
- **Hiển thị số thứ tự thanh** (1, 2, 3, ...)
- **Hiển thị số block trong mỗi thanh**

### 🔄 **Tính năng Drag & Drop (Swap)**

- **Đổi chỗ 2 thanh**: Kéo thanh này vào thanh khác để đổi chỗ với nhau
- **Logic đơn giản**: Chỉ swap 2 vị trí, không dịch chuyển các thanh khác
- **Visual feedback**: Thanh đang kéo sẽ có opacity và border khác
- **Auto-update**: Tự động cập nhật số thứ tự cho 2 thanh đã đổi chỗ
- **Reset button**: Nút "↺ Reset" để khôi phục thứ tự ban đầu
- **Tooltip hướng dẫn**: "Kéo vào thanh khác để đổi chỗ"

### 📈 **Thống kê chi tiết**

- **Tỷ lệ phần trăm** của mỗi màu
- **Vị trí xuất hiện đầu tiên** của màu
- **Cảnh báo** nếu màu không chia hết cho 3
- **Hiệu quả tổng thể** (% màu chia hết cho 3)

## III. Giao diện

### 🎨 **Thanh màu**

```
[3] [2] [1]  ← Số block trong thanh
 ①   ②   ③   ← Số thứ tự thanh
```

### 📋 **Thông tin màu**

- **Tên màu** + **Thứ hạng** (#1, #2, #3...)
- **Số block** + **Tỷ lệ %** + **Số thanh**
- **Trạng thái chia hết cho 3** (✅ hoặc ⚠️)

### 📊 **Tổng kết**

- Tổng blocks, tổng thanh, số màu
- Hiệu quả (% màu chia hết cho 3)

## IV. Props Interface

```typescript
interface ColorBarChartProps {
  level: GeneratedLevel; // Level data để phân tích
}
```

## V. Cách sử dụng

```tsx
import { ColorBarChart } from "./preview/color-bar-chart";

function LevelPreview({ level }) {
  return (
    <div>
      {/* Other components */}
      <ColorBarChart level={level} />
    </div>
  );
}
```

## VI. Ví dụ output

### 📊 **Level với 3 màu:**

```
🎨 Bảng thanh màu (3 thanh)

🔴 Red #1
3 blocks (37.5%) → 1 thanh
[3] ①
✅ Chia hết cho 3

🟢 Green #2
3 blocks (37.5%) → 1 thanh
[3] ①
✅ Chia hết cho 3

🔵 Blue #3
2 blocks (25.0%) → 1 thanh
[2] ①
⚠️ Không chia hết cho 3 (2 block dư)

📈 Tổng kết:
- Tổng blocks: 8
- Tổng thanh: 3
- Số màu: 3
- Hiệu quả: 67%
```

## VII. Testing

Component đã được test với:

- ✅ Render đúng dữ liệu
- ✅ Tính toán số thanh chính xác
- ✅ Hiển thị tỷ lệ phần trăm
- ✅ Xử lý trường hợp empty level

```bash
npm test -- color-bar-chart.test.tsx
```

## VIII. Responsive Design

- **Desktop**: Hiển thị đầy đủ thông tin
- **Mobile**: Thanh màu wrap xuống dòng mới
- **Hover effects**: Scale + shadow cho thanh màu
- **Tooltips**: Thông tin chi tiết khi hover

## IX. Performance

- **Memoization**: Tính toán chỉ khi level thay đổi
- **Efficient rendering**: Chỉ render khi cần thiết
- **Lightweight**: Không dependencies nặng

## X. Ví dụ Logic Thanh Xen kẽ

### 🎯 **Board mẫu 3x3:**

```
R R G
G B B
B R G
```

### 📊 **Quét theo thứ tự (trên → dưới, trái → phải):**

```
Vị trí: 1  2  3  4  5  6  7  8  9
Màu:    R  R  G  G  B  B  B  R  G
```

### 🎨 **Nhóm theo màu:**

```
Nhóm R: [R₁, R₂, R₈] (3 blocks)
Nhóm G: [G₃, G₄, G₉] (3 blocks)
Nhóm B: [B₅, B₆, B₇] (3 blocks)
```

### 🔄 **Tạo thanh xen kẽ (round-robin):**

```
Lượt 1: Lấy 3 blocks từ R → Thanh 1: [R, R, R] (đỏ thuần)
Lượt 2: Lấy 3 blocks từ G → Thanh 2: [G, G, G] (xanh lá thuần)
Lượt 3: Lấy 3 blocks từ B → Thanh 3: [B, B, B] (xanh dương thuần)
```

### 📈 **Kết quả:**

```
Thanh 1: [R, R, R] ← Màu đỏ thuần
Thanh 2: [G, G, G] ← Màu xanh lá thuần
Thanh 3: [B, B, B] ← Màu xanh dương thuần
```

### 🔄 **So sánh các logic:**

**❌ Logic gradient (trộn màu trong thanh):**

```
Thanh 1: [R, G, B] (gradient)
Thanh 2: [R, G, B] (gradient)
Thanh 3: [R, G, B] (gradient)
→ Mỗi thanh có nhiều màu
```

**✅ Logic mới (thanh xen kẽ + drag & drop):**

```
Thanh 1: [R, R, R] (đỏ thuần) 🔄
Thanh 2: [G, G, G] (xanh lá thuần) 🔄
Thanh 3: [B, B, B] (xanh dương thuần) 🔄
→ Mỗi thanh 1 màu, thanh liên tiếp khác màu
→ Có thể kéo thả để thay đổi thứ tự
```

### 🎮 **Cách sử dụng Drag & Drop (Swap):**

1. **Chọn thanh**: Click và giữ thanh muốn đổi chỗ
2. **Kéo vào thanh khác**: Kéo vào thanh đích để đổi chỗ
3. **Thả để swap**: Thả chuột để 2 thanh đổi chỗ cho nhau
4. **Xem kết quả**: 2 thanh sẽ đổi vị trí và cập nhật số thứ tự
5. **Reset**: Click nút "↺ Reset" để khôi phục thứ tự ban đầu

### 🔄 **Ví dụ Swap Logic:**

**Trước khi drag:**

```
Thanh 1: [R, R, R] (đỏ)
Thanh 2: [G, G, G] (xanh lá)
Thanh 3: [B, B, B] (xanh dương)
```

**Kéo Thanh 1 vào Thanh 3:**

```
Thanh 1: [B, B, B] (xanh dương) ← đã đổi chỗ
Thanh 2: [G, G, G] (xanh lá)    ← không thay đổi
Thanh 3: [R, R, R] (đỏ)         ← đã đổi chỗ
```

**Kết quả**: Chỉ 2 thanh được chọn đổi chỗ, các thanh khác giữ nguyên vị trí!

### 📱 **Responsive & Accessibility:**

- **Touch support**: Hoạt động trên mobile và tablet
- **Visual feedback**: Border và opacity thay đổi khi drag
- **Cursor**: Hiển thị cursor "move" khi hover
- **Tooltip**: Hướng dẫn rõ ràng cho người dùng

## XI. Tích hợp

Component đã được tích hợp vào:

- `src/components/level-preview.tsx` (dòng 162)
- Hiển thị ngay dưới BoardPreview
- Tự động cập nhật khi level thay đổi
