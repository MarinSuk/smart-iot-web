<script setup lang="ts">
/**
 * Root component: Element Plus locale provider + routed views with fade transition.
 * 根组件：Element Plus 语言配置提供者 + 路由视图出口（淡入淡出过渡）。
 */
import { useI18n } from './i18n'

const { elementLocale } = useI18n()
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <router-view v-slot="{ Component }">
      <transition name="page-fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </el-config-provider>
</template>
