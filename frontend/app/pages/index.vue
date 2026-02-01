<script setup lang="ts">
const { user, fetchUser } = useAuth();

if (!user.value) {
  await fetchUser();
}

await navigateTo(user.value ? "/plans" : "/login", { replace: true });
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="text-muted-foreground">Redirecting...</div>
  </div>
</template>
