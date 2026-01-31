<script setup lang="ts">
import { Maximize2, Minimize2 } from "lucide-vue-next";
import { Button } from "@/components/ui/button";

const isFullscreen = ref(false);

function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error("Error attempting to enable fullscreen:", err);
    });
  } else {
    document.exitFullscreen().catch((err) => {
      console.error("Error attempting to exit fullscreen:", err);
    });
  }
}

onMounted(() => {
  document.addEventListener("fullscreenchange", handleFullscreenChange);
});

onUnmounted(() => {
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
});
</script>

<template>
  <Button
    :title="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
    class="text-muted-foreground hidden hover:bg-transparent lg:block"
    size="icon-sm"
    variant="ghost"
    @click="toggleFullscreen"
  >
    <Minimize2 v-if="isFullscreen" />
    <Maximize2 v-else />
  </Button>
</template>
