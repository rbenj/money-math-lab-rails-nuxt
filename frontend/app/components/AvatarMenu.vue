<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
});

const attrs = useAttrs();
const { user, logout } = useAuth();

const initial = computed(() => {
  return user.value?.email.charAt(0).toUpperCase() || "?";
});

async function handleLogout() {
  await logout();
}
</script>

<template>
  <ClientOnly>
    <Avatar v-if="!user" v-bind="attrs">
      <AvatarFallback class="bg-muted" />
    </Avatar>

    <template v-else>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" class="rounded-full" v-bind="attrs">
            <Avatar>
              <AvatarFallback class="text-background bg-foreground font-semibold">
                {{ initial }}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" class="w-32">
          <DropdownMenuGroup>
            <DropdownMenuItem as-child>
              <NuxtLink to="/plans">Plans</NuxtLink>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem class="text-destructive" @click="handleLogout">
              Logout
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
  </ClientOnly>
</template>
