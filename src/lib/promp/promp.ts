import { LevelConfig } from "@/config/game-types";

export const createLevelPrompt = (config: LevelConfig): string => {
  const specialElements = Object.entries(config.elements)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}:${count}`)
    .join(", ");

  const symmetryInstructions =
    config.generationMode === "symmetric"
      ? `

BỐI CẢNH GAME (THREAD JAM):
- Mục tiêu: pick 3 block cùng màu để mở khóa bức tranh.
- Board là lưới, chỉ kết nối 4 hướng (không tính chéo) khi xét đường đi/va chạm.
- Pick được thực hiện từ trên xuống (ưu tiên các block “exposed”). Không được sinh block lẻ vô nghiệm.

QUAN TRỌNG - QUY TẮC LIÊN KẾT KHỐI:
- TẤT CẢ các khối phải liên kết với nhau thành 1 nhóm duy nhất
- Liên kết chỉ tính theo 4 hướng (trên, dưới, trái, phải) - KHÔNG tính chéo
- KHÔNG được có khối rời rạc, cô lập
- Mỗi khối phải có ít nhất 1 khối khác kề cạnh (4 hướng)
- Toàn bộ board phải tạo thành 1 vùng liên thông

`
      : "";

  const elementDistributionRules = specialElements
    ? `

QUY TẮC PHÂN BỐ ELEMENT ĐẶC BIỆT:
- KHÔNG được đẩy tất cả elements lên đầu board
- Phân bố đều elements theo các vùng:
  * Vùng trên (0-33% height): tối đa 30% elements
  * Vùng giữa (33-66% height): 40-50% elements  
  * Vùng dưới (66-100% height): 20-30% elements
- Các element cùng loại sẽ đứng cạnh nhau nhiều hơn nhưng không phải tất cả, vẫn phải phân bổ đều
- Elements phải tạo thành pattern tự nhiên, không cluster
- Ưu tiên đặt elements ở vị trí chiến lược (góc, giữa, cạnh)
- Với level đối xứng: elements phải đối xứng qua trục dọc

VÍ DỤ PHÂN BỐ TỐT:
\`\`\`
. . B . . . B . .  ← Barrel ở trên (30%)
. . . . . . . . .
. . . . P . . . .  ← Pipe ở giữa
. . . . . . . . .
. P . . . . . P .  ← Pipe đối xứng
. . . . . . . . .
. . . B . . B . .  ← Barrel ở dưới (20%)
\`\`\`

VÍ DỤ PHÂN BỐ XẤU (TRÁNH):
\`\`\`
B B P P B P B P .  ← Tất cả elements ở trên
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
\`\`\`
`
    : "";

  return `Tạo puzzle level ${config.width}x${config.height}, ${
    config.blockCount
  } blocks, màu: ${config.selectedColors.join(",")}.
${
  config.generationMode === "symmetric"
    ? "MODE: ĐỐI XỨNG - Tạo hình pixel art đối xứng"
    : "MODE: NGẪU NHIÊN"
}

${symmetryInstructions}
${elementDistributionRules}

QUAN TRỌNG - HƯỚNG DẪN ĐỐI XỨNG:
Khi tạo level đối xứng, hãy tạo các hình dạng pixel art đối xứng qua trục dọc (bilateral symmetry):

VÍ DỤ CÁC HÌNH ĐỐI XỨNG:
1. HÌNH CÂY: Thân cây ở giữa, cành lá đối xứng hai bên
   \`\`\`
   . . G G G . .
   . G G G G G .
   G G G G G G G
   . . G G G . .
   . . B B B . .
   \`\`\`

2. HÌNH HOA: Cánh hoa đối xứng quanh tâm
   \`\`\`
   . R . G . R .
   R G G G G G R
   . G G Y G G .
   R G G G G G R
   . R . G . R .
   \`\`\`

3. HÌNH NHÀ: Mái nhà tam giác, cửa sổ đối xứng
   \`\`\`
   . . R R R . .
   . R R R R R .
   R R R R R R R
   B B G B G B B
   B B G B G B B
   \`\`\`

4. HÌNH BƯỚM: Cánh đối xứng hoàn hảo
   \`\`\`
   R G . . . G R
   R G G . G G R
   . R G B G R .
   . . R B R . .7
   \`\`\`

QUY TẮC ĐỐI XỨNG:
- Mỗi block ở vị trí (x,y) phải có block tương ứng ở vị trí (width-1-x,y) với cùng màu
- Tạo hình dạng nhận diện được: cây, hoa, nhà, bướm, mây, lá
- Trục đối xứng ở giữa board (x = width/2)
- Có thể để trống một số vị trí để tạo hình rõ ràng hơn
- Ưu tiên tạo hình có ý nghĩa thay vì chỉ đối xứng ngẫu nhiên


ĐỊNH NGHĨA & LUẬT ELEMENT (áp dụng khi có trong “Elements đặc biệt”):
- Barrel: block ẩn màu, đã định nghĩa sẵn màu. Chỉ khi có block được pick ở **bất kỳ ô kề 8 hướng** quanh Barrel thì Barrel **lộ màu** (vẫn là block thường sau khi lộ).
- Ice block: block bị đóng băng, hiển thị số X. Mỗi lần pick **một block nằm kề 8 hướng** quanh ô Ice thì X - 1. Khi về 0, Ice unlock và lộ màu có sẵn. Bản thân Ice không thể được pick khi chưa unlock.
- Pipe: ống có **duy nhất 1 hướng** được random từ đầu game (↑/→/↓/←). Khi **block ở ô cửa của Pipe được pick**, Pipe tự động **đẩy 1 block tiếp theo** ra theo hướng đó vào ô Pipe (tuần tự theo **thứ tự màu đã định sẵn** trong ống). Khi số đếm của Pipe về 0 thì Pipe rỗng (không đẩy nữa). Nếu ô phía trước bị tường (Pull Pin) hoặc ra ngoài board → **không sinh map như vậy** (invalid).
- Block lock + Key: mỗi Lock đi kèm **1 Key**. **Key chỉ được đặt lên block thường** (không đặt trên Barrel/Ice/Pipe/Bomb/Moving). Khi pick block chứa Key, Lock tương ứng mở. **Bắt buộc** Key phải reachable (không bị pull pin cứng cô lập) trước thời điểm cần mở Lock.
- Pull Pin: là **tường cứng** có hướng như pipe. Có đầu–đuôi, chắn thẳng đến hết cột hoặc hết dòng theo hướng của pull pin. Phía trước hướng của Pull Pin có 1-3 ô trống tạo hiệu ứng "cổng" hoặc "lối mở". Chỉ biến mất khi pick block “kẹp” ở đầu pull pin. Không cho phép sinh pull pin cắt board thành vùng không thể tiếp cận mục tiêu/Key.
- Bomb: có số đếm. **Mỗi lần pick bất kỳ block**, Bomb - 1. Khi về 0 → THUA ngay. Bomb không reset số đếm. Không sinh level có Bomb mà countdown quá thấp đến mức không thể hoàn thành mục tiêu tối thiểu.
- Moving (băng chuyền): chỉ **kích hoạt khi pick block liên quan** (đứng trên băng chuyền hoặc ô trigger). Khi kích hoạt, nó **đẩy liên tiếp** theo hướng cho đến khi hết cột/dòng hoặc gặp vật cản cứng (Pull Pin). Không tạo tình huống đẩy block xuyên tường.


CÁCH KIỂM TRA:
- Bắt đầu từ 1 khối bất kỳ
- Duyệt 4 hướng kề cạnh
- Phải đi được đến tất cả khối khác
- Nếu có khối không đi được → SAI

Quy tắc chung:
- Mỗi màu chia hết cho 3 blocks
- Container 3-5 slots, không trống
- Level phải solvable
- Elements đặc biệt: ${specialElements || "không"}

JSON format:
{
  "board": [[{"type":"block|empty","color":"color|null","element":"element|null"}]],
  "containers": [{"id":"container_0","slots":4,"contents":[{"color":"red","type":"block"}]}],
  "solvable": true,
  "reasoning": "brief explanation"
}`;
};
