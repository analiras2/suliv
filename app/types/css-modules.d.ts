// Expo declares this through `expo/types`, which reaches the compiler only via the generated
// expo-env.d.ts — a gitignored file that exists after running the app locally but never in CI.
// Declaring it here keeps `npm run typecheck` independent of generated files.
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}
