/**
 * App bootstrap: Element Plus (dark) + router; locale driven by App's config provider.
 * 应用入口：注册 Element Plus（暗色）与路由；语言由 App 中的 ConfigProvider 驱动。
 */
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import router from './router'
import './style.css'

document.documentElement.classList.add('dark')

createApp(App).use(ElementPlus).use(router).mount('#app')
