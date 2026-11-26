/**
 * Axios instance with auth injection and unified result/error handling.
 * Axios 实例封装：自动注入认证头，统一处理业务码与错误提示。
 */
import axios from 'axios'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'
import { clearAuth, getToken } from './auth'
import { t } from '../i18n'

/** Unified backend envelope. / 后端统一响应包装结构。 */
export interface ApiResult<T = unknown> {
    code: number
    message: string
    data: T
}

const service = axios.create({
    baseURL: '/api',
    timeout: 15000,
})

/**
 * Request interceptor: inject Authorization: Bearer <token>.
 * 请求拦截器：自动注入 Authorization: Bearer <token> 请求头。
 */
service.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

/**
 * Redirect to login once on 401 and drop stale credentials.
 * 401 时清除失效凭证并跳转登录页（防止重复跳转）。
 */
function redirectToLogin(): void {
    clearAuth()
    if (router.currentRoute.value.path !== '/login') {
        ElMessage.warning(t('request.sessionExpired'))
        router.replace({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
    }
}

/**
 * Response interceptor: unwrap Result<T>, toast on code !== 200, handle 401.
 * 响应拦截器：解包 Result<T>，code !== 200 统一 ElMessage.error，401 自动跳登录。
 */
service.interceptors.response.use(
    (response: AxiosResponse<ApiResult>) => {
        const result = response.data
        if (result.code === 401) {
            redirectToLogin()
            return Promise.reject(new Error(t('request.unauthorized')))
        }
        if (result.code !== 200) {
            ElMessage.error(result.message || t('request.failed'))
            return Promise.reject(new Error(result.message || t('request.failed')))
        }
        return result.data as unknown as AxiosResponse
    },
    (error: unknown) => {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
                redirectToLogin()
            } else {
                const msg =
                    (error.response?.data as ApiResult | undefined)?.message ||
                    error.message ||
                    t('request.network')
                ElMessage.error(msg)
            }
        } else {
            ElMessage.error(t('request.unknown'))
        }
        return Promise.reject(error)
    },
)

/**
 * Typed HTTP helpers: resolve directly to the unwrapped payload T.
 * 类型化请求工具：Promise 直接解析为解包后的业务数据 T。
 */
export const http = {
    /** GET request returning payload T. / GET 请求，返回业务数据 T。 */
    get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
        return service.get(url, { params }) as unknown as Promise<T>
    },
    /** POST request returning payload T. / POST 请求，返回业务数据 T。 */
    post<T>(url: string, data?: unknown, params?: Record<string, unknown>): Promise<T> {
        return service.post(url, data, { params }) as unknown as Promise<T>
    },
}

export default service