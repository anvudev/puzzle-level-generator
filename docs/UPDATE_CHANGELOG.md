# 📝 Hướng dẫn cập nhật Changelog

## 📍 Vị trí file

File changelog nằm ở: `/public/changelog.json`

## 🎯 Cấu trúc file

```json
{
  "version": "1.2.0",           // Phiên bản hiện tại
  "lastUpdate": "2025-10-01",   // Ngày cập nhật gần nhất
  "updates": [...]              // Danh sách các update
}
```

## ✨ Các loại update type

- `"feature"` - Tính năng mới (màu xanh)
- `"bugfix"` - Sửa lỗi (màu đỏ)
- `"release"` - Phát hành phiên bản (màu tím)
- `"improvement"` - Cải thiện (màu xanh lá)

## 📋 Template thêm update mới

Khi có bản build mới, thêm object mới vào đầu mảng `updates`:

```json
{
  "version": "X.Y.Z",
  "date": "YYYY-MM-DD",
  "title": "Tiêu đề ngắn gọn",
  "type": "feature",
  "items": [
    "✨ Mô tả tính năng 1",
    "🔧 Mô tả tính năng 2",
    "🎨 Mô tả tính năng 3"
  ]
}
```

## 🎨 Emoji gợi ý

- ✨ Tính năng mới
- 🔧 Sửa lỗi / Cải thiện
- 🎨 UI/UX
- 🎮 Game mechanics
- 🤖 AI related
- 📊 Analytics/Data
- 🚀 Performance
- 📝 Documentation
- 🔒 Security
- ⚡ Speed improvements

## 📝 Ví dụ cập nhật

### 1. Cập nhật version và lastUpdate

```json
{
  "version": "1.3.0",           // Tăng version
  "lastUpdate": "2025-10-05",   // Cập nhật ngày mới
  ...
}
```

### 2. Thêm update mới vào đầu mảng

```json
{
  "version": "1.3.0",
  "lastUpdate": "2025-10-05",
  "updates": [
    {
      "version": "1.3.0",
      "date": "2025-10-05",
      "title": "Thêm Ice Block Editor",
      "type": "feature",
      "items": [
        "✨ Thêm chức năng chỉnh sửa Ice Block",
        "🎯 Có thể điều chỉnh số lần phá băng (1-3)",
        "🎨 Cải thiện UI cho element editor",
        "🔧 Fix lỗi khi export level có ice"
      ]
    }
    // ... các update cũ
  ]
}
```

## 🚀 Quy trình release

1. **Hoàn thành code** - Merge tất cả PR vào main
2. **Cập nhật changelog** - Thêm update mới vào `public/changelog.json`
3. **Tăng version** - Cập nhật version trong:
   - `public/changelog.json`
   - `package.json`
4. **Build & Deploy** - Chạy build và deploy
5. **Thông báo** - Người dùng sẽ thấy dấu chấm đỏ "New" ở nút "Cập nhật"

## 💡 Tips

- **Luôn thêm update mới ở đầu mảng** để hiển thị đúng thứ tự
- **Sử dụng emoji** để làm nổi bật các tính năng
- **Viết rõ ràng, ngắn gọn** - Mỗi item nên là 1 câu ngắn
- **Gom nhóm theo chức năng** - Các tính năng liên quan nên gom lại
- **Test trước khi deploy** - Chạy dev mode để xem changelog hiển thị đúng không

## 🔍 Kiểm tra

Sau khi cập nhật, mở browser và:

1. Clear localStorage (để test trạng thái "new")
2. Refresh trang
3. Kiểm tra nút "Cập nhật" có dấu đỏ không
4. Click vào xem changelog hiển thị đúng không
5. Click vào lần 2 để xem dấu đỏ có mất không

## 📸 Screenshot flow

```
User lần đầu tiên:
  → Thấy dấu đỏ "New" ở nút "Cập nhật"
  → Click vào xem changelog
  → Dấu đỏ biến mất
  → localStorage lưu version đã xem

User quay lại:
  → Không thấy dấu đỏ (đã xem rồi)

Deploy version mới:
  → Thấy dấu đỏ "New" lại
  → Chu kỳ lặp lại
```

## 🎯 Best Practices

### ✅ Good

```json
{
  "version": "1.3.0",
  "title": "Cải thiện Level Editor",
  "items": [
    "✨ Thêm keyboard shortcuts (1-6) cho tools",
    "🎨 Redesign toolbar layout",
    "⚡ Tăng tốc render board 50%"
  ]
}
```

### ❌ Bad

```json
{
  "version": "1.3.0",
  "title": "Updates",
  "items": ["Added some stuff", "Fixed things", "Other improvements"]
}
```

---

**Happy Updating! 🎉**
