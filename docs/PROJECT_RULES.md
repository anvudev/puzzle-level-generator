# 🏗️ Puzzle Level Generator - Project Structure & Development Rules

## I. Project Structure

```
puzzle-level-generator-tool/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (dashboard)/              # Route groups
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   ├── api/                      # API routes
│   │   │   ├── generate/
│   │   │   ├── export/
│   │   │   └── validate/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/                   # React components
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── features/                 # Feature-specific components
│   │   │   ├── level-generator/
│   │   │   ├── level-preview/
│   │   │   └── export-system/
│   │   ├── layout/                   # Layout components
│   │   └── common/                   # Shared components
│   ├── lib/                          # Utilities & business logic
│   │   ├── generators/               # Level generation algorithms
│   │   ├── validators/               # Data validation
│   │   ├── exporters/                # Export functionality
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── stores/                   # State management (Zustand)
│   │   ├── utils/                    # Helper functions
│   │   └── constants/                # App constants
│   ├── config/                       # Configuration files
│   │   ├── game-types.ts
│   │   ├── game-constants.ts
│   │   └── app-config.ts
│   ├── styles/                       # Additional styles
│   └── test/                         # Test utilities
├── docs/                             # Documentation
├── public/                           # Static assets
└── scripts/                          # Build & deployment scripts
```

## II. TypeScript Rules & Standards

### 🎯 Strict Type Definitions

```typescript
// 1. BRANDED TYPES cho validation
type PositiveInteger = number & { __brand: "PositiveInteger" };
type GameColor = string & { __brand: "GameColor" };

// 2. STRICT INTERFACES
export interface StrictGameConfig {
  readonly width: number;
  readonly height: number;
  readonly blockCount: number;
  readonly colorCount: PositiveInteger;
  readonly selectedColors: readonly GameColor[];
}

// 3. UTILITY TYPES
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// 4. RESULT PATTERN cho error handling
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// 5. VALIDATION FUNCTIONS
function createPositiveInteger(value: number): PositiveInteger {
  if (value <= 0) throw new Error("Must be positive");
  return value as PositiveInteger;
}
```

### 🧩 Component Architecture Rules

```tsx
// COMPONENT STRUCTURE TEMPLATE
interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  // Specific props here
}

export function ComponentName({
  className,
  children,
  ...props
}: ComponentProps) {
  // 1. HOOKS ở đầu (state -> effects -> custom hooks)
  const [state, setState] = useState();
  const { data, isLoading, error } = useCustomHook();

  // 2. EVENT HANDLERS với useCallback
  const handleClick = useCallback(() => {
    // Logic here
  }, [dependencies]);

  // 3. EARLY RETURNS cho loading/error states
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorBoundary error={error} />;

  // 4. MAIN RENDER
  return (
    <div className={cn("base-styles", className)} {...props}>
      {children}
    </div>
  );
}

// 5. EXPORT với displayName
ComponentName.displayName = "ComponentName";
```

## III. File Naming Conventions

| Type                  | Convention                | Example                   |
| --------------------- | ------------------------- | ------------------------- |
| **React Components**  | `PascalCase.tsx`          | `LevelGenerator.tsx`      |
| **Page Components**   | `kebab-case.tsx`          | `level-preview.tsx`       |
| **Utility Functions** | `camelCase.ts`            | `levelUtils.ts`           |
| **Custom Hooks**      | `use-kebab-case.ts`       | `use-level-generator.ts`  |
| **Type Definitions**  | `kebab-case.types.ts`     | `game-types.ts`           |
| **Constants**         | `SCREAMING_SNAKE_CASE.ts` | `GAME_CONSTANTS.ts`       |
| **Configuration**     | `kebab-case.config.ts`    | `app.config.ts`           |
| **Tests**             | `ComponentName.test.tsx`  | `LevelGenerator.test.tsx` |
| **Barrel Exports**    | `index.ts`                | `components/index.ts`     |

## IV. Business Logic Rules

### 🎮 Level Generation Architecture

```typescript
// 1. VALIDATION PIPELINE
export class LevelValidationPipeline {
  private validators: LevelValidator[] = [
    new BoardSizeValidator(),
    new ColorCountValidator(),
    new ElementPlacementValidator(),
    new SolvabilityValidator(),
  ];

  validate(level: GeneratedLevel): ValidationResult {
    for (const validator of this.validators) {
      const result = validator.validate(level);
      if (!result.isValid) return result;
    }
    return { isValid: true };
  }
}

// 2. GENERATOR STRATEGY PATTERN
export abstract class LevelGenerator {
  abstract generate(config: LevelConfig): Promise<GeneratedLevel>;

  protected validateConfig(config: LevelConfig): void {
    if (config.width < 5 || config.width > 15) {
      throw new InvalidConfigError("Width must be between 5-15");
    }
  }
}

// 3. CUSTOM ERROR CLASSES
export class LevelGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "LevelGenerationError";
  }
}

// 4. FACTORY PATTERN cho generators
export class LevelGeneratorFactory {
  static create(type: "ai" | "fallback" | "symmetric"): LevelGenerator {
    switch (type) {
      case "ai":
        return new AILevelGenerator();
      case "fallback":
        return new FallbackLevelGenerator();
      case "symmetric":
        return new SymmetricLevelGenerator();
      default:
        throw new Error(`Unknown generator type: ${type}`);
    }
  }
}
```

## V. State Management Rules (Zustand)

```typescript
// STORE STRUCTURE TEMPLATE
interface FeatureStore {
  // State
  data: DataType | null;
  isLoading: boolean;
  error: string | null;

  // Actions (grouped by feature)
  actions: {
    fetch: () => Promise<void>;
    update: (data: Partial<DataType>) => void;
    reset: () => void;
  };

  // Computed values
  computed: {
    isReady: boolean;
    hasData: boolean;
  };
}

// IMPLEMENTATION với immer
export const useFeatureStore = create<FeatureStore>()(
  immer((set, get) => ({
    // State
    data: null,
    isLoading: false,
    error: null,

    // Actions
    actions: {
      fetch: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const data = await fetchData();
          set((state) => {
            state.data = data;
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error.message;
            state.isLoading = false;
          });
        }
      },
    },

    // Computed
    computed: {
      get isReady() {
        return !get().isLoading && !get().error;
      },
      get hasData() {
        return get().data !== null;
      },
    },
  }))
);
```

## VI. Testing Rules

### 🧪 Test Structure Template

```typescript
// TEST FILE STRUCTURE
describe("ComponentName", () => {
  // Setup
  const defaultProps = {
    /* ... */
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset stores, clear localStorage, etc.
  });

  // Happy path tests first
  describe("when rendering with valid props", () => {
    it("should display correctly", () => {
      render(<ComponentName {...defaultProps} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should handle user interactions", async () => {
      const user = userEvent.setup();
      render(<ComponentName {...defaultProps} />);

      await user.click(screen.getByRole("button"));
      expect(mockFunction).toHaveBeenCalledWith(expectedArgs);
    });
  });

  // Edge cases
  describe("when handling edge cases", () => {
    it("should handle empty state", () => {
      render(<ComponentName {...defaultProps} data={null} />);
      expect(screen.getByText("No data available")).toBeInTheDocument();
    });
  });

  // Error cases
  describe("when encountering errors", () => {
    it("should display error message", () => {
      render(<ComponentName {...defaultProps} error="Something went wrong" />);
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });
});

// CUSTOM RENDER HELPER
export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClient>
        <ThemeProvider>{children}</ThemeProvider>
      </QueryClient>
    ),
    ...options,
  });
}

// MOCK TEMPLATES
export const mockLevelConfig: LevelConfig = {
  width: 8,
  height: 8,
  blockCount: 24,
  colorCount: 4,
  selectedColors: ["red", "blue", "green", "yellow"],
  difficulty: "medium",
  generationMode: "balanced",
  elements: {},
};
```

### 📊 Test Coverage Rules

- **Components**: 90%+ coverage
- **Utilities**: 95%+ coverage
- **Business Logic**: 100% coverage
- **Integration Tests**: Critical user flows
- **E2E Tests**: Main happy paths

## VII. Performance Rules

### ⚡ Optimization Guidelines

```typescript
// 1. MEMOIZATION RULES
// Memo cho expensive computations
export const calculateDifficultyScore = useMemo(() => {
  return heavyCalculation(config);
}, [config.width, config.height, config.elements]);

// Memo cho stable references
const stableCallbacks = useMemo(
  () => ({
    onGenerate: handleGenerate,
    onExport: handleExport,
  }),
  [handleGenerate, handleExport]
);

// 2. LAZY LOADING
const LevelPreview = lazy(() => import("./level-preview"));
const ExportPanel = lazy(() => import("./export-panel"));
const AnalyticsDashboard = lazy(() => import("./analytics-dashboard"));

// 3. DEBOUNCING cho user input
export function useDebounceConfig(config: LevelConfig, delay = 300) {
  return useMemo(() => debounce(config, delay), [config, delay]);
}

// 4. VIRTUAL SCROLLING cho large lists
export function VirtualizedLevelHistory() {
  return (
    <FixedSizeList
      height={400}
      itemCount={levels.length}
      itemSize={80}
      overscanCount={5}
    >
      {LevelHistoryItem}
    </FixedSizeList>
  );
}

// 5. WEB WORKERS cho heavy computations
export function useLevelGenerationWorker() {
  const workerRef = useRef<Worker>();

  useEffect(() => {
    workerRef.current = new Worker("/workers/level-generator.js");
    return () => workerRef.current?.terminate();
  }, []);

  const generateLevel = useCallback((config: LevelConfig) => {
    return new Promise((resolve) => {
      workerRef.current?.postMessage(config);
      workerRef.current?.addEventListener(
        "message",
        (e) => {
          resolve(e.data);
        },
        { once: true }
      );
    });
  }, []);

  return { generateLevel };
}
```

### 🎯 Bundle Optimization

```typescript
// 1. TREE SHAKING - Import specific functions
import { debounce } from "lodash/debounce"; // ✅ Good
import _ from "lodash"; // ❌ Bad

// 2. DYNAMIC IMPORTS cho conditional features
const loadAdvancedFeatures = async () => {
  if (user.isPremium) {
    const { AdvancedGenerator } = await import("./advanced-generator");
    return AdvancedGenerator;
  }
};

// 3. CODE SPLITTING by routes
const routes = [
  {
    path: "/analytics",
    component: lazy(() => import("./pages/analytics")),
  },
  {
    path: "/settings",
    component: lazy(() => import("./pages/settings")),
  },
];
```

## VIII. Git & Development Workflow

### 📝 Commit Convention

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: new feature
- `fix`: bug fix
- `docs`: documentation
- `style`: formatting, missing semi colons, etc
- `refactor`: code change that neither fixes a bug nor adds a feature
- `test`: adding missing tests
- `chore`: maintain
- `perf`: performance improvements

**Scopes:**

- `generator`: level generation logic
- `ui`: user interface components
- `export`: export functionality
- `validation`: data validation
- `config`: configuration changes
- `api`: API related changes

**Examples:**

```
feat(generator): add AI-powered level generation with Gemini
fix(ui): resolve level preview rendering issue on mobile
docs(readme): update installation instructions
perf(export): optimize CSV generation for large datasets
```

### 🌿 Branch Naming Convention

```
<type>/<scope>-<description>

Examples:
feature/generator-ai-integration
bugfix/level-validation-error
hotfix/export-crash-issue
chore/update-dependencies
docs/api-documentation
```

### 🔧 Development Workflow

```bash
# 1. Pre-commit hooks (setup in package.json)
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}

# 2. PR Template requirements
# - [ ] Tests added/updated
# - [ ] Documentation updated
# - [ ] Performance impact considered
# - [ ] Accessibility checked
# - [ ] Breaking changes documented

# 3. Release workflow
npm run build
npm run test:run
npm run type-check
npm run lint
```

## IX. Code Quality Rules

### 🔍 ESLint Configuration

```javascript
// eslint.config.mjs
export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // TypeScript specific
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-explicit-any": "error",

      // React specific
      "react-hooks/exhaustive-deps": "error",
      "react/prop-types": "off",
      "react/display-name": "error",

      // General
      "prefer-const": "error",
      "no-var": "error",
      "no-console": "warn",

      // Import organization
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling"],
          "newlines-between": "always",
        },
      ],
    },
  },
];
```

### 🎨 Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

## X. Documentation Rules

### 📚 Code Documentation

````typescript
/**
 * Generates a puzzle level based on the provided configuration
 *
 * @param config - The level configuration parameters
 * @param options - Additional generation options
 * @returns Promise that resolves to the generated level
 *
 * @example
 * ```typescript
 * const level = await generateLevel({
 *   width: 8,
 *   height: 8,
 *   blockCount: 24,
 *   colorCount: 4
 * });
 * ```
 *
 * @throws {LevelGenerationError} When configuration is invalid
 * @throws {NetworkError} When AI service is unavailable
 */
export async function generateLevel(
  config: LevelConfig,
  options?: GenerationOptions
): Promise<GeneratedLevel> {
  // Implementation
}

// Interface documentation
/**
 * Configuration for puzzle level generation
 */
export interface LevelConfig {
  /** Board width (5-15) */
  width: number;
  /** Board height (5-15) */
  height: number;
  /** Total number of blocks to place */
  blockCount: number;
  /** Number of different colors to use */
  colorCount: number;
  /** Specific colors to use in the level */
  selectedColors: string[];
}
````

### 📖 README Structure

````markdown
# Project Name

Brief description of what the project does.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
pnpm install
pnpm dev
```
````

## 📁 Project Structure

[Link to detailed structure]

## 🧪 Testing

```bash
pnpm test          # Run tests
pnpm test:ui       # Run tests with UI
pnpm test:coverage # Generate coverage report
```

## 🚀 Deployment

[Deployment instructions]

## 🤝 Contributing

[Contributing guidelines]

## 📄 License

[License information]

````

## XI. Security Rules

### 🔒 Security Best Practices

```typescript
// 1. INPUT VALIDATION
export function validateLevelConfig(config: unknown): LevelConfig {
  const schema = z.object({
    width: z.number().min(5).max(15),
    height: z.number().min(5).max(15),
    blockCount: z.number().positive(),
    colorCount: z.number().min(2).max(8),
    selectedColors: z.array(z.string()).min(2),
  });

  return schema.parse(config);
}

// 2. SANITIZATION
export function sanitizeUserInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .slice(0, 100); // Limit length
}

// 3. API KEY MANAGEMENT
// ❌ Never commit API keys
const API_KEY = process.env.GEMINI_API_KEY;

// ✅ Validate environment variables
if (!API_KEY) {
  throw new Error('GEMINI_API_KEY is required');
}

// 4. CORS CONFIGURATION
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE' },
        ],
      },
    ];
  },
};
````

## XII. Accessibility Rules

### ♿ A11y Guidelines

```tsx
// 1. SEMANTIC HTML
export function LevelPreview({ level }: LevelPreviewProps) {
  return (
    <section aria-labelledby="level-preview-title">
      <h2 id="level-preview-title">Level Preview</h2>
      <div role="grid" aria-label="Puzzle board">
        {level.board.map((row, rowIndex) => (
          <div key={rowIndex} role="row">
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                role="gridcell"
                aria-label={`Cell ${rowIndex + 1}, ${colIndex + 1}: ${
                  cell.type
                }`}
                tabIndex={0}
              >
                {/* Cell content */}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

// 2. KEYBOARD NAVIGATION
export function useKeyboardNavigation() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight":
          event.preventDefault();
          // Handle navigation
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          // Handle selection
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}

// 3. FOCUS MANAGEMENT
export function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
      // Trap focus within modal
    }
  }, [isOpen]);

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabIndex={-1}
    >
      {children}
    </div>
  );
}
```

## 🎯 Summary Checklist

### ✅ Before Starting Development

- [ ] Project structure setup
- [ ] ESLint & Prettier configured
- [ ] Git hooks setup (Husky)
- [ ] Testing framework configured
- [ ] Environment variables setup

### ✅ During Development

- [ ] Follow naming conventions
- [ ] Write tests for new features
- [ ] Document complex functions
- [ ] Use TypeScript strictly
- [ ] Follow component architecture rules

### ✅ Before Committing

- [ ] Run linter and fix issues
- [ ] Run tests and ensure they pass
- [ ] Check bundle size impact
- [ ] Verify accessibility
- [ ] Write meaningful commit message

### ✅ Before Deploying

- [ ] Run full test suite
- [ ] Check performance metrics
- [ ] Verify environment variables
- [ ] Test in production-like environment
- [ ] Update documentation if needed

---
