<script setup lang="ts">
/**
 * Language switch: sliding EN / 中文 pill, applies instantly.
 * 语言切换器：EN / 中文 滑块胶囊，切换即时生效。
 */
import { useI18n } from '../i18n'

const { locale, setLocale } = useI18n()
</script>

<template>
  <div class="lang-switch" role="group" aria-label="Language / 语言">
    <span class="thumb" :class="{ zh: locale === 'zh' }" />
    <button type="button" :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button>
    <button type="button" :class="{ active: locale === 'zh' }" @click="setLocale('zh')">中文</button>
  </div>
</template>

<style scoped>
.lang-switch {
  position: relative;
  display: inline-flex;
  padding: 3px;
  border-radius: 999px;
  border: 1px solid var(--iot-line);
  background: rgba(11, 20, 36, 0.72);
  backdrop-filter: blur(8px);
}
.thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 46px;
  height: 24px;
  border-radius: 999px;
  background: linear-gradient(135deg, #22d3ee, #8b5cf6);
  box-shadow: 0 2px 10px rgba(34, 211, 238, 0.35);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.thumb.zh {
  transform: translateX(46px);
}
button {
  position: relative;
  z-index: 1;
  width: 46px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: transparent;
  font-size: 12px;
  font-family: inherit;
  color: var(--iot-text-dim);
  cursor: pointer;
  transition: color 0.2s ease;
}
button:hover {
  color: var(--iot-text);
}
button.active {
  color: #04121a;
  font-weight: 700;
}
</style>