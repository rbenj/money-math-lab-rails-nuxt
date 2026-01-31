<script setup lang="ts">
import { APP_VERSION } from "@/constants";

const currentYear = new Date().getFullYear();
</script>

<template>
  <main class="flex min-h-screen flex-col">
    <div class="flex w-full flex-1 flex-col">
      <!-- Nav -->
      <nav class="bg-background sticky top-0 z-50 h-20 w-full">
        <div class="flex w-full items-center justify-between px-6 py-3">
          <Logo />

          <div class="flex items-center">
            <FullscreenToggle />

            <ThemeSwitcher />

            <AvatarMenu class="ml-3" />
          </div>
        </div>
      </nav>

      <!-- Main -->
      <div class="mx-auto h-full w-full max-w-[1700px] flex-1">
        <slot />
      </div>

      <!-- Footer -->
      <footer class="text-muted-foreground flex w-full items-center justify-between p-6 text-xs">
        <div>&copy; {{ currentYear }} All Rights Reserved</div>

        <div>Version {{ APP_VERSION }}</div>
      </footer>
    </div>
  </main>
</template>
