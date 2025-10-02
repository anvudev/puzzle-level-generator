# 📡 API Services Documentation

## 🎯 Overview

This directory contains all API service functions for communicating with the backend.

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### HTTP Client

The `httpRequest` instance is configured with:
- ✅ Base URL from environment variable
- ✅ JSON content type headers
- ✅ Query string serialization
- ✅ 30-second timeout
- ✅ Request/Response interceptors
- ✅ Error handling

## 📚 Histories Service

### `getHistories(skip?, limit?)`

Fetch paginated list of level histories.

**Parameters:**
- `skip` (number, optional): Number of items to skip (default: 0)
- `limit` (number, optional): Number of items to return (default: 10)

**Returns:** `Promise<SavedLevelList>`

**Example:**
```typescript
import { getHistories } from "@/app/api/services/historiesService";

// Get first 10 histories
const data = await getHistories();

// Get next 10 histories (pagination)
const nextPage = await getHistories(10, 10);
```

**Response Structure:**
```typescript
{
  items: [
    {
      id: string,
      name: string,
      level: GeneratedLevel,
      createdAt: string,
      updatedAt: string
    }
  ],
  pagination: {
    skip: number,
    limit: number,
    total: number,
    has_more: boolean
  }
}
```

---

### `updateHistoryName(history_id, name)`

Update the name of a history.

**Parameters:**
- `history_id` (string): ID of the history to update
- `name` (string): New name for the history

**Returns:** `Promise<{ success: boolean; message: string }>`

**Example:**
```typescript
import { updateHistoryName } from "@/app/api/services/historiesService";

try {
  const result = await updateHistoryName("level_123", "New Level Name");
  console.log(result.message); // "History name updated successfully"
} catch (error) {
  console.error("Failed to update:", error);
}
```

---

### `deleteHistory(history_id)`

Delete a history by ID.

**Parameters:**
- `history_id` (string): ID of the history to delete

**Returns:** `Promise<{ success: boolean; message: string }>`

**Example:**
```typescript
import { deleteHistory } from "@/app/api/services/historiesService";

try {
  const result = await deleteHistory("level_123");
  console.log(result.message); // "History deleted successfully"
} catch (error) {
  console.error("Failed to delete:", error);
}
```

---

## 🎨 TypeScript Types

### `HistoryValue`
```typescript
interface HistoryValue {
  id: string;
  name: string;
  level: GeneratedLevel;
  createdAt: string;
  updatedAt: string;
}
```

### `HistoryItem`
```typescript
interface HistoryItem {
  _id: string;
  key: string;
  value: HistoryValue;
  updatedAt: string;
}
```

### `SavedLevel`
```typescript
interface SavedLevel {
  id: string;
  name: string;
  level: GeneratedLevel;
  createdAt: string;
  updatedAt: string;
}
```

### `SavedLevelList`
```typescript
interface SavedLevelList {
  items: SavedLevel[];
  pagination: {
    skip: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}
```

---

## 🚨 Error Handling

All service functions include try-catch blocks and will:
1. ✅ Log errors to console
2. ✅ Throw the error for component-level handling
3. ✅ Check API response `success` field

**Example Error Handling in Component:**
```typescript
const [error, setError] = useState<string | null>(null);

try {
  const data = await getHistories();
  setSavedLevels(data);
} catch (err) {
  setError(err instanceof Error ? err.message : "Failed to fetch histories");
  console.error(err);
}
```

---

## 🔄 API Response Format

All backend APIs follow this structure:

```typescript
{
  success: boolean,
  timestamp: string,
  message: string,
  data: {
    // Actual data here
  }
}
```

---

## 🧪 Testing

### Manual Testing with curl

```bash
# Get histories
curl http://localhost:8000/api/histories?skip=0&limit=10

# Update history name
curl -X PUT http://localhost:8000/api/histories/level_123/name \
  -H "Content-Type: application/json" \
  -d '{"name": "New Name"}'

# Delete history
curl -X DELETE http://localhost:8000/api/histories/level_123
```

---

## 📝 Best Practices

1. **Always use environment variables** for API URLs
2. **Handle errors gracefully** in components
3. **Show loading states** during API calls
4. **Use TypeScript types** for type safety
5. **Log errors** for debugging
6. **Add timeout** for long-running requests
7. **Implement retry logic** for critical operations (if needed)

---

## 🔗 Related Files

- `src/lib/utils/httpRequest.ts` - Axios instance configuration
- `src/components/level-history.tsx` - Main consumer of histories service
- `.env.local` - Environment configuration

---

## 🐛 Troubleshooting

### "Unsupported protocol localhost"
**Solution:** Make sure `NEXT_PUBLIC_API_URL` includes the protocol (`http://` or `https://`)

### "Network Error"
**Solution:** 
1. Check if backend is running on port 8000
2. Verify CORS is enabled on backend
3. Check firewall settings

### "Timeout Error"
**Solution:** Increase timeout in `httpRequest.ts` or optimize backend response time

---

**Meo meo!** 🐈 Happy coding! ✨

