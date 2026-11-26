/**
 * Router with token-based navigation guard.
 * 路由配置：基于 token 的导航守卫。
 */
import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '../utils/auth'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'dashboard',
            component: () => import('../views/Dashboard.vue'),
            meta: { requiresAuth: true },
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/Login.vue'),
        },
        { path: '/:pathMatch(.*)*', redirect: '/' },
    ],
})

/**
 * Guard: unauthenticated users go to /login; logged-in users skip /login.
 * 守卫：未登录跳转登录页；已登录访问登录页时重定向首页。
 */
router.beforeEach((to) => {
    const token = getToken()
    if (to.meta.requiresAuth && !token) {
        return { path: '/login', query: { redirect: to.fullPath } }
    }
    if (to.path === '/login' && token) {
        return { path: '/' }
    }
    return true
})

export default router