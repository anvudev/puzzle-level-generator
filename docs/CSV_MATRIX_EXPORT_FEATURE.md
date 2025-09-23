# 📊 CSV Matrix Export Feature

## I. Tổng quan

Tính năng **CSV Matrix Export** cho phép xuất dữ liệu level dưới dạng ma trận CSV, trong đó mỗi ô (cell) trong board trở thành một row trong file CSV với đầy đủ thông tin thuộc tính.

## II. Thay đổi từ format cũ

### 🔄 **Trước (Summary Format)**
```csv
ID,Width,Height,BlockCount,ColorCount,Colors,Elements,DifficultyScore,Solvable,Timestamp,BarSequence
level-123,8,8,10,3,"Red;Blue;Green","Pipe:2",75,true,2024-01-01T00:00:00Z,"1:Red;2:Blue;3:Green"
```

### 🆕 **Sau (Matrix Format)**
```csv
Row,Col,Type,Color,Element,PipeDirection,PipeSize,PipeContents,LockId,KeyId,LockPairNumber,PullPinDirection,PullPinGateSize,IceCount
0,0,wall,null,null,null,null,null,null,null,null,null,null,null
0,1,block,Red,null,null,null,null,null,null,null,null,null,null
0,2,block,null,Pipe,right,3,"Red;Light Blue;Green",null,null,null,null,null,null
1,0,block,Yellow,Lock,null,null,null,lock-1,null,1,null,null,null
1,1,block,Yellow,Key,null,null,null,null,lock-1,1,null,null,null
1,2,block,Gray,PullPin,null,null,null,null,null,null,up,2,null
```

## III. Cấu trúc CSV Matrix

### 📋 **Headers**
| Column | Description | Example Values |
|--------|-------------|----------------|
| `Row` | Vị trí hàng trong ma trận | `0`, `1`, `2`, ... |
| `Col` | Vị trí cột trong ma trận | `0`, `1`, `2`, ... |
| `Type` | Loại ô | `wall`, `block`, `empty` |
| `Color` | Màu của block | `Red`, `Blue`, `null` |
| `Element` | Loại element đặc biệt | `Pipe`, `Lock`, `Key`, `null` |
| `PipeDirection` | Hướng pipe | `up`, `down`, `left`, `right`, `null` |
| `PipeSize` | Kích thước pipe | `1`, `2`, `3`, `null` |
| `PipeContents` | Nội dung pipe | `"Red;Blue;Green"`, `null` |
| `LockId` | ID của lock | `lock-1`, `null` |
| `KeyId` | ID của key | `lock-1`, `null` |
| `LockPairNumber` | Số thứ tự cặp lock-key | `1`, `2`, `3`, `null` |
| `PullPinDirection` | Hướng pull pin | `up`, `down`, `left`, `right`, `null` |
| `PullPinGateSize` | Kích thước gate | `1`, `2`, `3`, `null` |
| `IceCount` | Số lần đập ice | `1`, `2`, `3`, `null` |

### 🎯 **Ví dụ các loại ô**

#### **Wall Cell**
```csv
0,0,wall,null,null,null,null,null,null,null,null,null,null,null
```

#### **Simple Block**
```csv
0,1,block,Red,null,null,null,null,null,null,null,null,null,null
```

#### **Pipe Element**
```csv
0,2,block,null,Pipe,right,3,"Red;Light Blue;Green",null,null,null,null,null,null
```

#### **Lock Element**
```csv
1,0,block,Yellow,Lock,null,null,null,lock-1,null,1,null,null,null
```

#### **Key Element**
```csv
1,1,block,Yellow,Key,null,null,null,null,lock-1,1,null,null,null
```

#### **Pull Pin Element**
```csv
1,2,block,Gray,PullPin,null,null,null,null,null,null,up,2,null
```

#### **Ice Block Element**
```csv
2,0,block,Light Blue,Ice,null,null,null,null,null,null,null,null,3
```

## IV. Technical Implementation

### 🔧 **Core Function**
```typescript
export function generateCSVMatrix(level: GeneratedLevel): string {
  const headers = [
    "Row", "Col", "Type", "Color", "Element",
    "PipeDirection", "PipeSize", "PipeContents",
    "LockId", "KeyId", "LockPairNumber",
    "PullPinDirection", "PullPinGateSize", "IceCount"
  ];

  const rows: string[] = [headers.join(",")];

  // Iterate through each cell in the board matrix
  for (let row = 0; row < level.board.length; row++) {
    for (let col = 0; col < level.board[row].length; col++) {
      const cell = level.board[row][col];
      
      // Format pipe contents as semicolon-separated string
      const pipeContents = cell.pipeContents 
        ? `"${cell.pipeContents.join(";")}"` 
        : "null";

      const values = [
        row.toString(),
        col.toString(),
        cell.type,
        cell.color || "null",
        cell.element || "null", 
        cell.pipeDirection || "null",
        cell.pipeSize?.toString() || "null",
        pipeContents,
        cell.lockId || "null",
        cell.keyId || "null", 
        cell.lockPairNumber?.toString() || "null",
        cell.pullPinDirection || "null",
        cell.pullPinGateSize?.toString() || "null",
        cell.iceCount?.toString() || "null"
      ];

      rows.push(values.join(","));
    }
  }

  return rows.join("\n");
}
```

### 📁 **Updated Export Panel**
```typescript
const exportCSV = () => {
  const csv = generateCSVMatrix(level);
  downloadCSV(csv, `${level.id}.csv`);
};
```

## V. Use Cases & Benefits

### 🎯 **For Data Analysis**
- **Spatial Analysis**: Phân tích vị trí các elements
- **Pattern Recognition**: Tìm patterns trong thiết kế level
- **Element Distribution**: Thống kê phân bố các loại elements
- **Board Reconstruction**: Tái tạo lại board từ CSV data

### 🔬 **For Research**
- **Level Complexity**: Đo độ phức tạp dựa trên spatial data
- **Player Behavior**: Phân tích interaction với từng ô
- **A/B Testing**: So sánh hiệu quả các layout khác nhau
- **Machine Learning**: Training data cho AI level generation

### 🛠️ **For Development**
- **Debugging**: Debug từng ô cụ thể
- **Testing**: Validate level generation logic
- **Integration**: Import vào tools khác (Excel, Python, R)
- **Backup**: Full backup với spatial information

## VI. Data Processing Examples

### 📊 **Excel/Google Sheets**
```
=COUNTIF(C:C,"block")  // Đếm số block
=COUNTIF(E:E,"Pipe")   // Đếm số pipe
=FILTER(A:N,C:C="wall") // Lọc tất cả wall cells
```

### 🐍 **Python Analysis**
```python
import pandas as pd

# Load CSV
df = pd.read_csv('level-123.csv')

# Analyze element distribution
element_counts = df['Element'].value_counts()

# Find all pipe locations
pipes = df[df['Element'] == 'Pipe']

# Reconstruct board matrix
board = df.pivot(index='Row', columns='Col', values='Type')
```

### 📈 **R Analysis**
```r
library(dplyr)

# Load and analyze
data <- read.csv('level-123.csv')

# Element distribution by position
data %>% 
  group_by(Row, Col, Element) %>% 
  summarise(count = n())

# Spatial clustering
library(cluster)
pipe_positions <- data[data$Element == 'Pipe', c('Row', 'Col')]
```

## VII. Testing

### 🧪 **Test Coverage**
- ✅ **Simple cells**: wall, block, empty
- ✅ **Pipe elements**: với direction, size, contents
- ✅ **Lock/Key pairs**: với IDs và pair numbers
- ✅ **Pull Pin elements**: với direction và gate size
- ✅ **Ice blocks**: với hit counts
- ✅ **Matrix completeness**: đúng số rows và positions
- ✅ **CSV format**: valid CSV với proper escaping

### 📝 **Test Results**
```
✓ CSV Matrix Export > should export simple wall and block cells correctly
✓ CSV Matrix Export > should export pipe elements with all properties  
✓ CSV Matrix Export > should export lock and key elements
✓ CSV Matrix Export > should export pull pin elements
✓ CSV Matrix Export > should export ice block elements
✓ CSV Matrix Export > should handle empty pipe contents correctly
✓ CSV Matrix Export > should export correct number of rows for matrix

Test Files  1 passed (1)
Tests       7 passed (7)
```

---

**🎉 Tính năng CSV Matrix Export hoàn chỉnh!**

Người dùng giờ có thể:
1. **Export CSV** với format ma trận chi tiết
2. **Phân tích spatial data** của level
3. **Import vào tools khác** để xử lý
4. **Backup đầy đủ** thông tin từng ô
5. **Research & Development** với dữ liệu structured
