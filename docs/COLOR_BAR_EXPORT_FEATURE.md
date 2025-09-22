# 🎨 Color Bar Chart Export Feature

## I. Tổng quan

Tính năng **Color Bar Chart Export** đã được thêm vào hệ thống xuất file, cho phép xuất đầy đủ dữ liệu về bảng thanh màu cùng với thông tin level.

## II. Dữ liệu được thêm vào Export

### 🎯 **JSON Export**

Khi xuất file JSON, dữ liệu bảng thanh màu được thêm vào trường `colorBarChart`:

```json
{
  "id": "level-123",
  "config": { ... },
  "board": [ ... ],
  "containers": [ ... ],
  "difficultyScore": 75,
  "solvable": true,
  "colorBarChart": {
    "bars": [
      {
        "barIndex": 1,
        "blocks": [
          { "color": "Red", "position": 0 },
          { "color": "Red", "position": 4 },
          { "color": "Red", "position": 5 }
        ]
      }
    ],
    "colorSummary": [
      {
        "color": "Red",
        "totalCount": 4,
        "percentage": 40.0
      }
    ],
    "totalBlocks": 10,
    "totalBars": 4,
    "efficiency": 66.7,
    "analysis": {
      "colorsUsed": 3,
      "averageBlocksPerColor": 3.33,
      "averageBlocksPerBar": 2.5,
      "colorDistribution": [
        {
          "color": "Red",
          "count": 4,
          "percentage": 40.0,
          "barsNeeded": 2,
          "isDivisibleBy3": false
        }
      ]
    }
  }
}
```

### 📊 **CSV Export**

CSV được mở rộng với các cột mới:

| Cột mới | Mô tả | Ví dụ |
|---------|-------|-------|
| `TotalBars` | Tổng số thanh màu | `4` |
| `TotalColorBlocks` | Tổng số block có màu | `10` |
| `ColorEfficiency` | Hiệu quả (% màu chia hết cho 3) | `66.7%` |
| `ColorsUsed` | Số màu được sử dụng | `3` |
| `AvgBlocksPerColor` | Trung bình block/màu | `3.3` |
| `AvgBlocksPerBar` | Trung bình block/thanh | `2.5` |
| `ColorDistribution` | Phân bố chi tiết màu | `"Red:4:40.0%:✗;Blue:3:30.0%:✓"` |
| `BarSequence` | Chuỗi thanh | `"Bar1[Red,Red,Red:3];Bar2[Blue,Blue,Blue:3]"` |

## III. Thuật toán phân tích

### 🔍 **Logic quét Board**

```typescript
// Quét từ trên xuống dưới, từ trái qua phải
for (let row = 0; row < level.board.length; row++) {
  for (let col = 0; col < level.board[row].length; col++) {
    const cell = level.board[row][col];
    
    if (cell.type === "block" && cell.color) {
      if (cell.element === "Pipe") {
        // Đếm nội dung bên trong Pipe
        cell.pipeContents?.forEach(pipeColor => {
          allBlocks.push({ color: pipeColor, position });
        });
      } else {
        // Block thường
        allBlocks.push({ color: cell.color, position });
      }
    }
  }
}
```

### 🎨 **Tạo thanh xen kẽ**

```typescript
// Mỗi thanh 1 màu, thanh liên tiếp khác màu
while (colors.some(color => colorGroups[color].length > 0)) {
  const currentColor = colors[colorIndex % colors.length];
  const colorGroup = colorGroups[currentColor];
  
  if (colorGroup.length > 0) {
    // Lấy tối đa 3 blocks cùng màu cho thanh này
    const barBlocks = colorGroup.splice(0, 3);
    bars.push({ barIndex, blocks: barBlocks });
    barIndex++;
  }
  
  colorIndex = (colorIndex + 1) % colors.length;
}
```

### 📈 **Tính toán hiệu quả**

```typescript
// Hiệu quả = % màu chia hết cho 3
const divisibleBy3Count = colorSummary.filter(
  color => color.totalCount % 3 === 0
).length;

const efficiency = colorSummary.length > 0 
  ? (divisibleBy3Count / colorSummary.length) * 100 
  : 0;
```

## IV. Giao diện Export Panel

### 📋 **Thông tin mới được hiển thị**

1. **Card "Thông tin Bảng thanh màu"**:
   - Tổng thanh, tổng block màu
   - Hiệu quả, số màu sử dụng
   - Phân bố màu với badge màu sắc
   - Chuỗi thanh (5 thanh đầu)

2. **JSON Preview được cập nhật**:
   - Bao gồm trường `colorBarChart`
   - Hiển thị đầy đủ cấu trúc dữ liệu

### 🎨 **Visual Indicators**

- **Badge xanh (✓)**: Màu chia hết cho 3 blocks
- **Badge xám (⚠️)**: Màu không chia hết cho 3 blocks
- **Số thứ tự thanh**: `#1`, `#2`, `#3`...
- **Hiệu quả %**: Tỷ lệ màu tối ưu

## V. Ví dụ sử dụng

### 📁 **File JSON xuất ra**

```json
{
  "id": "level-abc123",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "colorBarChart": {
    "bars": [
      {
        "barIndex": 1,
        "blocks": [
          { "color": "Red", "position": 0 },
          { "color": "Red", "position": 4 },
          { "color": "Red", "position": 5 }
        ]
      },
      {
        "barIndex": 2,
        "blocks": [
          { "color": "Blue", "position": 1 },
          { "color": "Blue", "position": 6 },
          { "color": "Blue", "position": 8 }
        ]
      }
    ],
    "colorSummary": [
      { "color": "Red", "totalCount": 4, "percentage": 40.0 },
      { "color": "Blue", "totalCount": 3, "percentage": 30.0 },
      { "color": "Green", "totalCount": 3, "percentage": 30.0 }
    ],
    "totalBlocks": 10,
    "totalBars": 4,
    "efficiency": 66.67
  }
}
```

### 📊 **File CSV xuất ra**

```csv
ID,Width,Height,BlockCount,ColorCount,Colors,Elements,DifficultyScore,Solvable,Timestamp,TotalBars,TotalColorBlocks,ColorEfficiency,ColorsUsed,AvgBlocksPerColor,AvgBlocksPerBar,ColorDistribution,BarSequence
level-abc123,4,4,12,3,Red;Blue;Green,,75,true,2024-01-01T12:00:00.000Z,4,10,66.7%,3,3.3,2.5,"Red:4:40.0%:✗;Blue:3:30.0%:✓;Green:3:30.0%:✓","Bar1[Red,Red,Red:3];Bar2[Blue,Blue,Blue:3];Bar3[Green,Green,Green:3];Bar4[Red:1]"
```

## VI. Testing

### 🧪 **Test Coverage**

- ✅ **formatLevelForExport**: Kiểm tra cấu trúc dữ liệu
- ✅ **generateCSVRow**: Kiểm tra format CSV
- ✅ **Color counting**: Đếm block chính xác
- ✅ **Bar creation**: Tạo thanh đúng logic
- ✅ **Efficiency calculation**: Tính hiệu quả chính xác
- ✅ **Edge cases**: Xử lý trường hợp đặc biệt
- ✅ **Pipe elements**: Hỗ trợ element Pipe

### 🔧 **Chạy test**

```bash
npm test src/test/utils/level-utils-color-bar.test.ts
```

## VII. Lợi ích

### 🎯 **Cho người dùng**

1. **Phân tích chi tiết**: Hiểu rõ phân bố màu sắc
2. **Tối ưu hóa**: Biết màu nào cần điều chỉnh
3. **Theo dõi hiệu quả**: Đánh giá chất lượng level
4. **Dữ liệu đầy đủ**: Có thể tái tạo bảng thanh màu

### 🔧 **Cho developer**

1. **Debugging**: Dễ dàng debug logic màu sắc
2. **Analytics**: Phân tích xu hướng thiết kế level
3. **Integration**: Tích hợp với hệ thống khác
4. **Backup**: Sao lưu đầy đủ thông tin level

## VIII. Kết luận

Tính năng **Color Bar Chart Export** hoàn thiện hệ thống xuất file bằng cách thêm dữ liệu quan trọng về phân bố màu sắc. Điều này giúp người dùng có cái nhìn toàn diện về level và có thể tối ưu hóa thiết kế tốt hơn.

### 🚀 **Next Steps**

- [ ] Thêm import/restore từ file JSON có dữ liệu color bar
- [ ] Tạo analytics dashboard từ dữ liệu CSV
- [ ] Hỗ trợ export multiple levels với color bar data
- [ ] Tối ưu hóa performance cho level lớn
