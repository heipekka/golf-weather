import { Stack } from 'expo-router';

export default function CourseLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* dangerouslySingular keeps this stack at exactly one entry: opening
          another course reuses the existing screen instead of pushing a new
          one, so it never accumulates stale detail screens to go "back"
          through. */}
      <Stack.Screen
        name="[id]"
        options={{ headerShown: true }}
        dangerouslySingular
      />
    </Stack>
  );
}
