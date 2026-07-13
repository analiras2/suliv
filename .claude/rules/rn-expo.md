# React Native & Expo AI Coding Rules

You are an expert Senior React Native and Expo developer. Follow these strict rules for all code generation, refactoring, and debugging.

## 1. Native vs. JavaScript Boundaries

* **No Unauthorized Native Changes**: You may freely modify JavaScript/TypeScript files (`.js`, `.ts`, `.tsx`).
* **Explicit Diff Requirement**: Any changes to native directories (`/ios`, `/android`) or Expo config plugins (`app.json`, `app.config.js`) require an explicit breakdown and verification plan before execution.
* **Never Mix Architecture Styles**: Do not hallucinate or mix legacy React Native Bridge configurations with the New Architecture (TurboModules/Fabric).

## 2. Component Design & Composition

Prefer passing `children` or explicit ReactNode slots over a multiplying list of boolean flag props.

**Bad:**

```tsx
// Over-configured component
<CustomCard 
  title="Profile" 
  hasHeader={true} 
  showLeftIcon={false} 
  hasFooter={true} 
/>

```

**Good:**

```tsx
// Compositional component
<Card>
  <Card.Header title="Profile" />
  <Card.Content>
    <ProfileDetails />
  </Card.Content>
  <Card.Footer />
</Card>

```

## 3. Decouple Business Logic (MVVM Pattern)

Do not place network fetches, state orchestration, or heavy data-filtering inside the UI file. Move logic to custom hooks acting as ViewModels.

**Bad:**

```tsx
function UserProfile() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetch('/api/user').then(res => res.json()).then(setUser);
  }, []);

  return <Text>{user?.name}</Text>;
}

```

**Good:**

```tsx
// UI Component (View)
function UserProfile() {
  const { user, isLoading } = useUserViewModel();
  
  if (isLoading) return <Spinner />;
  return <Text>{user?.name}</Text>;
}

```

## 4. State Management & Data Fetching

Use specific tools for different types of state. Utilize **React Query** for server-state (fetching, caching, synchronization) and **Zustand** for lightweight, global client-state. Do not use `useEffect` for basic data fetching.

**Bad:**

```tsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
// ... useEffect fetch logic

```

**Good:**

```tsx
const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
const activeTheme = useStore(state => state.theme); // Zustand

```

## 5. List Performance Guardrails

Never use inline functions, inline objects, or arrow functions inside `renderItem` or `keyExtractor` for `FlatList` or `FlashList`. Ensure `renderItem` is a reference-stable function or a memoized component. Always implement `getItemLayout` when possible.

**Bad:**

```tsx
<FlatList
  data={items}
  keyExtractor={(item) => item.id.toString()}
  renderItem={({ item }) => (
    <Button onPress={() => console.log(item.name)} title={item.name} />
  )}
/>

```

**Good:**

```tsx
const keyExtractor = useCallback((item: Item) => item.id, []);

// Memoized standalone component for the item
const renderItem = useCallback(({ item }: { item: Item }) => {
  return <ListItem item={item} />;
}, []);

<FlatList
  data={items}
  keyExtractor={keyExtractor}
  renderItem={renderItem}
  getItemLayout={getItemLayout}
/>

```

## 6. Offline-First Resilience

Always design network interactions with offline-first capabilities in mind. Handle missing network states gracefully rather than allowing unhandled promise rejections or infinite loading states.

**Bad:**

```tsx
const submitData = async (payload) => {
  await api.post('/sync', payload); // Fails silently or crashes if offline
};

```

**Good:**

```tsx
const submitData = async (payload) => {
  if (!isConnected) {
    saveToLocalQueue(payload); // Store locally to sync later
    notifyUser("Saved offline. Will sync when connected.");
    return;
  }
  await api.post('/sync', payload);
};

```

## 7. UI, Styling & Animations

* **Layout Systems**: Utilize Flexbox exclusively with `StyleSheet.create()` or NativeWind. Eliminate magic strings/numbers for dimensions; use central theme tokens.
* **Responsiveness**: Use `useWindowDimensions` for dynamic UI scaling.
* **Animations**: All high-performance animations and gesture systems must utilize `react-native-reanimated` and `react-native-gesture-handler`. Never generate layout-blocking animations on the JS thread.
* **Images**: Use `expo-image` or `react-native-fast-image` instead of the base `Image` component.

## 8. TypeScript & Code Standards

Strict mode is enabled. The use of `any` is strictly banned. Keep all files under 150 lines of code. If a component exceeds this, break down child UI fragments into standalone components.

## 9. Execution & Session Workflow

* **Context Preservation**: Read the project structure, `package.json`, and navigation maps before generating routing code or installing dependencies.
* **Small Batches**: Implement changes in incremental, PR-sized steps. Do not attempt full-screen rewrites unless explicitly asked.
