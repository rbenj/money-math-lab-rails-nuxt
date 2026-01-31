<script setup lang="ts">
import { MoreVertical, Pencil, Trash2 } from "lucide-vue-next";
import { cn } from "@/lib/utils";
import type { Entity } from "@/features/entity/entity";
import { getEntityTemplate } from "@/features/entity/entity-templates";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const props = defineProps<{
  entity: Entity;
  displayName: string;
  displayValue: string;
  isActive: boolean;
  isChild: boolean;
  isMuted: boolean;
  isSoloed: boolean;
}>();

const emit = defineEmits<{
  mute: [entityId: string];
  solo: [entityId: string];
  edit: [];
  delete: [];
}>();

const template = computed(() => getEntityTemplate(props.entity.templateKey));
const category = computed(() => template.value?.category);
const Icon = computed(() => template.value?.icon);

const CATEGORY_OUTER_CLASSES: Record<string, string> = {
  debt: "bg-entity-debt",
  expense: "bg-entity-expense",
  income: "bg-entity-income",
  investment: "bg-entity-investment",
};

const CATEGORY_INNER_CLASSES: Record<string, string> = {
  debt: "bg-entity-debt text-entity-debt-foreground",
  expense: "bg-entity-expense text-entity-expense-foreground",
  income: "bg-entity-income text-entity-income-foreground",
  investment: "bg-entity-investment text-entity-investment-foreground",
};

const categoryOuterClass = computed(() => {
  if (props.isChild || !category.value) return "";
  return CATEGORY_OUTER_CLASSES[category.value] ?? "";
});

const categoryInnerClass = computed(() => {
  if (!category.value) return "bg-muted";
  return CATEGORY_INNER_CLASSES[category.value] ?? "bg-muted";
});
</script>

<template>
  <div
    :class="cn('flex w-full rounded-md pl-2', categoryOuterClass)"
    :style="{ opacity: isActive ? 1 : 0.4 }"
  >
    <!-- Mute/Solo buttons -->
    <div class="flex items-center gap-1">
      <Button
        :class="
          cn(
            'h-6 w-6 rounded-sm p-0 text-xs',
            isMuted && 'bg-cyan-200 hover:bg-cyan-300 dark:bg-cyan-800 dark:hover:bg-cyan-700',
          )
        "
        size="icon"
        variant="outline"
        @click="emit('mute', entity.id)"
      >
        M
      </Button>
      <Button
        :class="
          cn(
            'h-6 w-6 rounded-sm p-0 text-xs',
            isSoloed && 'bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700',
          )
        "
        size="icon"
        variant="outline"
        @click="emit('solo', entity.id)"
      >
        S
      </Button>
    </div>

    <!-- Entity content -->
    <div
      :class="
        cn(
          'ml-2 flex w-full items-center justify-between rounded-md py-2 pr-2 pl-3',
          categoryInnerClass,
        )
      "
      :style="{ opacity: isActive ? 1 : 0.3 }"
    >
      <div class="flex items-center gap-2">
        <component :is="Icon" v-if="Icon" class="h-4 w-4" />
        <div class="leading-none font-medium">{{ displayName }}</div>
      </div>

      <div class="flex items-center">
        <div class="font-bold">{{ displayValue }}</div>

        <!-- Hamburger -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="hover:bg-transparent">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="emit('edit')">
              <Pencil class="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem @click="emit('delete')">
              <Trash2 class="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>
</template>
