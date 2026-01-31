<script setup lang="ts">
import { APP_VERSION } from '@/constants';

const currentYear = new Date().getFullYear();
</script>

<template>
  <main class="min-h-screen flex flex-col">
    <div class="flex-1 flex flex-col w-full">
      <!-- Nav -->
      <nav class="sticky top-0 z-50 h-20 w-full bg-background">
        <div class="flex justify-between items-center w-full px-6 py-3">
          <Logo />

          <div class="flex items-center">
            <FullscreenToggle />

            <ThemeSwitcher />

            <AvatarMenu class="ml-3" />
          </div>
        </div>
      </nav>

      <!-- Main -->
      <div class="flex-1 w-full h-full max-w-[1700px] mx-auto">
        <slot />
      </div>

      <!-- Footer -->
      <footer class="flex items-center justify-between w-full p-6 text-xs text-muted-foreground">
        <div>&copy; {{ currentYear }} All Rights Reserved</div>

        <div>Version {{ APP_VERSION }}</div>
      </footer>
    </div>
  </main>
</template>
