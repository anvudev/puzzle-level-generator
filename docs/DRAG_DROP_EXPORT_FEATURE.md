# 🎯 Drag & Drop Export Feature

## I. Tổng quan

Tính năng **Drag & Drop Export** cho phép người dùng kéo thả để sắp xếp lại thứ tự các thanh màu trong ColorBarChart, và thứ tự mới này sẽ được phản ánh trong dữ liệu export (JSON/CSV).

## II. Cách hoạt động

### 🎨 **ColorBarChart Component**
- Người dùng có thể kéo thả các thanh màu để thay đổi vị trí
- Thứ tự mới được lưu vào `colorBarStore` 
- Button "Reset" để khôi phục về thứ tự ban đầu

### 📁 **Export System**
- **JSON Export**: Sử dụng thứ tự đã sắp xếp từ store
- **CSV Export**: Cột `BarSequence` phản ánh thứ tự mới
- **Copy JSON**: Clipboard chứa dữ liệu với thứ tự đã sắp xếp
- **Preview**: Hiển thị thứ tự hiện tại (đã sắp xếp)

## III. Technical Implementation

### 🗄️ **Color Bar Store**
```typescript
// Simple module-level store (no external dependencies)
export const colorBarStore = {
  setCustomBarOrder: (bars: BarData[], levelId: string) => void,
  getBarOrder: (defaultBars: BarData[], levelId: string) => BarData[],
  clearCustomBarOrder: () => void,
};
```

### 🔄 **Export Functions**
```typescript
// Updated to accept custom bar order
formatLevelForExport(level: GeneratedLevel, customBars?: BarData[])
generateCSVRow(level: GeneratedLevel, customBars?: BarData[])
```

### 🎯 **Data Structure**
```typescript
interface BarData {
  barIndex: number;  // Thứ tự thanh
  color: string;     // Màu của thanh
}
```

## IV. User Experience

### 🖱️ **Drag & Drop**
1. **Kéo**: Click và giữ thanh màu
2. **Thả**: Thả vào vị trí thanh khác để đổi chỗ
3. **Visual**: Thanh đang kéo có opacity giảm và scale nhỏ lại
4. **Feedback**: Tooltip hiển thị thông tin thanh

### 📊 **Export Workflow**
1. **Tạo level** → Xem ColorBarChart với thứ tự mặc định
2. **Kéo thả** → Sắp xếp lại theo ý muốn
3. **Export** → File chứa thứ tự đã sắp xếp
4. **Reset** → Về thứ tự ban đầu nếu cần

## V. Export Data Examples

### 📄 **JSON Export**
```json
{
  "id": "level-123",
  "colorBarChart": {
    "bars": [
      { "barIndex": 1, "color": "Blue" },    // Đã đổi chỗ
      { "barIndex": 2, "color": "Red" },     // Đã đổi chỗ  
      { "barIndex": 3, "color": "Green" }
    ]
  }
}
```

### 📊 **CSV Export**
```csv
ID,Width,Height,...,BarSequence
level-123,8,8,...,"1:Blue;2:Red;3:Green"
```

## VI. Benefits

### 🎯 **For Users**
- **Tùy chỉnh**: Sắp xếp thanh theo ý muốn
- **Trực quan**: Thấy ngay thứ tự trong export
- **Linh hoạt**: Reset về mặc định bất cứ lúc nào
- **Nhất quán**: Export luôn phản ánh UI hiện tại

### 🔧 **For Developers**
- **Simple**: Không cần external dependencies
- **Efficient**: Module-level store nhẹ
- **Maintainable**: Logic rõ ràng, dễ debug
- **Extensible**: Dễ mở rộng cho nhiều level

## VII. Technical Notes

### 🏗️ **Architecture**
- **Store**: Module-level variables (không cần Zustand)
- **State**: Lưu theo `levelId` để tránh conflict
- **Sync**: ColorBarChart ↔ Export Panel ↔ Store

### 🔄 **Data Flow**
```
User Drag & Drop → ColorBarChart → Store → Export Functions → File
```

### 🎨 **UI Updates**
- **Real-time**: Preview cập nhật ngay khi kéo thả
- **Visual**: Badge hiển thị thứ tự mới
- **Feedback**: Tooltip và visual indicators

## VIII. Future Enhancements

- [ ] **Undo/Redo**: History của các thao tác sắp xếp
- [ ] **Presets**: Lưu các pattern sắp xếp thường dùng
- [ ] **Bulk Operations**: Sắp xếp nhiều level cùng lúc
- [ ] **Import**: Khôi phục thứ tự từ file JSON

---

**🎉 Tính năng hoàn chỉnh và sẵn sàng sử dụng!**

Người dùng giờ có thể:
1. Kéo thả sắp xếp thanh màu theo ý muốn
2. Export file với thứ tự đã tùy chỉnh
3. Thấy thứ tự mới trong preview và export data
4. Reset về thứ tự ban đầu khi cần
