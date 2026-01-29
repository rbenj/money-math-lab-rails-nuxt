<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-vue-next';

const { user, logout } = useAuth();
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div class="container flex h-14 items-center justify-between">
        <NuxtLink to="/plans" class="font-semibold">
          Money Math Lab
        </NuxtLink>

        <div class="flex items-center gap-4">
          <ThemeSwitcher />

          <template v-if="user">
            <span class="text-sm text-muted-foreground">{{ user.email }}</span>
            <Button variant="ghost" size="icon" @click="logout" title="Logout">
              <LogOut class="h-4 w-4" />
            </Button>
          </template>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main>
      <slot />
    </main>
  </div>
</template>
