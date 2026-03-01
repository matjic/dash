<template>
  <span class="rich-text">
    <template v-for="(segment, index) in segments" :key="index">
      <span v-if="segment.type === 'text'" class="text-segment">{{ segment.content }}</span>
      <a v-else class="link-segment" @click.prevent="onLinkClick(segment.url!)">{{
        segment.content
      }}</a>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { parseTextWithLinks, openLink, type LinkSegment } from '../services/linkService';

const props = defineProps<{
  text: string;
}>();

const segments = computed<LinkSegment[]>(() => {
  return parseTextWithLinks(props.text || '');
});

async function onLinkClick(url: string) {
  await openLink(url);
}
</script>

<style scoped>
.rich-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.text-segment {
  /* Preserve whitespace and newlines */
}

.link-segment {
  color: var(--ion-color-primary);
  text-decoration: underline;
  cursor: pointer;
}

.link-segment:active {
  opacity: 0.7;
}
</style>
