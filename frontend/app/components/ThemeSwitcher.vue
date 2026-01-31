<script setup lang="ts">
import { Laptop, Moon, Sun } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const colorMode = useColorMode();
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button class="text-muted-foreground hover:bg-transparent" size="icon-sm" variant="ghost">
        <ClientOnly>
          <Sun v-if="colorMode.value === 'light'" />
          <Moon v-else-if="colorMode.value === 'dark'" />
          <Laptop v-else />
        </ClientOnly>
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="start" class="w-content">
      <DropdownMenuRadioGroup v-model="colorMode.preference">
        <DropdownMenuRadioItem value="light" class="flex gap-2">
          <Sun class="text-muted-foreground" />
          <span>Light</span>
        </DropdownMenuRadioItem>

        <DropdownMenuRadioItem value="dark" class="flex gap-2">
          <Moon class="text-muted-foreground" />
          <span>Dark</span>
        </DropdownMenuRadioItem>

        <DropdownMenuRadioItem value="system" class="flex gap-2">
          <Laptop class="text-muted-foreground" />
          <span>System</span>
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
