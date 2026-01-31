<script setup lang="ts">
const { user, fetchUser } = useAuth();

await fetchUser();

if (user.value) {
  await navigateTo("/plans");
} else {
  await navigateTo("/login");
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="text-muted-foreground">Redirecting...</div>
  </div>
</template>
