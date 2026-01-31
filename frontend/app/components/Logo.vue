<template>
  <NuxtLink to="/plans">
    <div class="flex text-xl font-bold">
      <div class="flex items-end" :style="{ paddingBottom: '0.06em', gap: '0.25em' }">
        <div class="bg-foreground" :style="{ width: '0.6em', height: '97%' }" />
        <div class="bg-foreground" :style="{ width: '0.6em', height: '59%' }" />
        <div class="bg-foreground" :style="{ width: '0.6em', height: '24%' }" />
      </div>
      <div
        class="text-foreground flex flex-col items-end uppercase"
        :style="{ marginLeft: '-1.2em', lineHeight: '0.9' }"
      >
        <span>Money</span>
        <span>Math</span>
        <span>Lab</span>
      </div>
    </div>
  </NuxtLink>
</template>
