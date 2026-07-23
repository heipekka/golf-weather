import { Stack } from 'expo-router';

export default function CourseLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* dangerouslySingular dedupes by name + params by default, so two
          different course ids would each get their own stack entry instead
          of reusing the screen. Returning a constant key here makes every
          course id share the same singular slot, keeping this stack at
          exactly one entry no matter which course was opened last. This
          also means the back button falls through to the tab navigator
          (backBehavior="history") instead of popping to a previously
          viewed course. */}
      <Stack.Screen
        name="[id]"
        options={{ headerShown: true }}
        dangerouslySingular={() => "course"}
      />
    </Stack>
  );
}
