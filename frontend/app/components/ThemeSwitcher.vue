<script setup lang="ts">
import { Laptop, Moon, Sun } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const colorMode = useColorMode()

const ICON_SIZE = 16
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button class="hover:bg-transparent" size="icon" variant="ghost">
        <Sun v-if="colorMode.value === 'light'" :size="ICON_SIZE" class="text-muted-foreground" />
        <Moon v-else-if="colorMode.value === 'dark'" :size="ICON_SIZE" class="text-muted-foreground" />
        <Laptop v-else :size="ICON_SIZE" class="text-muted-foreground" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent class="w-content" align="start">
      <DropdownMenuRadioGroup v-model="colorMode.preference">
        <DropdownMenuRadioItem class="flex gap-2" value="light">
          <Sun :size="ICON_SIZE" class="text-muted-foreground" />
          <span>Light</span>
        </DropdownMenuRadioItem>

        <DropdownMenuRadioItem class="flex gap-2" value="dark">
          <Moon :size="ICON_SIZE" class="text-muted-foreground" />
          <span>Dark</span>
        </DropdownMenuRadioItem>

        <DropdownMenuRadioItem class="flex gap-2" value="system">
          <Laptop :size="ICON_SIZE" class="text-muted-foreground" />
          <span>System</span>
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
