<script setup lang="ts">
const { user, fetchUser } = useAuth();

await fetchUser();

if (user.value) {
  await navigateTo('/plans');
} else {
  await navigateTo('/login');
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-muted-foreground">Redirecting...</div>
  </div>
</template>
