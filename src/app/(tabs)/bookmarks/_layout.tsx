import { Stack } from 'expo-router';

export default function BookmarksLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: true }} />
      {/* dangerouslySingular keeps this stack at exactly one detail entry: opening
          another tee time reuses the existing screen instead of pushing a new
          one, matching the course/[id] stack behavior. */}
      <Stack.Screen
        name="[id]"
        options={{ headerShown: true }}
        dangerouslySingular
      />
    </Stack>
  );
}
