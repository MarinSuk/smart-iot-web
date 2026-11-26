/**
 * Lightweight reactive i18n: locale state, dictionaries, Element Plus locale sync.
 * 轻量响应式国际化：语言状态、文案字典、Element Plus 语言包同步。
 */
import { computed, ref, watchEffect } from 'vue'
import enLocale from 'element-plus/es/locale/lang/en'
import zhCnLocale from 'element-plus/es/locale/lang/zh-cn'

export type Locale = 'en' | 'zh'

const STORAGE_KEY = 'smart-iot-lang'

/** Current locale, defaults to English, persisted across sessions. / 当前语言，默认英语，跨会话持久化。 */
export const locale = ref<Locale>(localStorage.getItem(STORAGE_KEY) === 'zh' ? 'zh' : 'en')

const en = {
    'app.title': 'Smart IoT Console',
    'common.refresh': 'Refresh',
    'common.cancel': 'Cancel',
    'login.brandSuffix': 'Console',
    'login.heroTop': 'Everything Connected,',
    'login.heroAccent': 'Fully Under Control',
    'login.heroDesc':
        'Manage third-party open platform quotas in one place and monitor the 4G remote command pipeline in real time — every device dispatch leaves a trace.',
    'login.point1': 'Open platform access · AppId & quota in one place',
    'login.point2': '4G command monitoring · sending, success and expiry end to end',
    'login.point3': 'Realtime refresh · anomalies visible instantly',
    'login.welcome': 'Welcome Back',
    'login.subtitle': 'Sign in to the Smart IoT admin console',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.usernameRequired': 'Username is required',
    'login.passwordRequired': 'Password is required',
    'login.passwordMin': 'At least 6 characters',
    'login.submit': 'Sign In',
    'login.submitting': 'Signing in…',
    'login.hint': 'Default account',
    'login.welcomeBack': 'Welcome back, {name}',
    'dashboard.title': 'Smart IoT Console',
    'dashboard.subtitle': 'Open Platform & 4G Command Center',
    'dashboard.live': 'Live Monitoring',
    'dashboard.paused': 'Monitoring Paused',
    'dashboard.logout': 'Logout',
    'stats.platforms': 'Connected Platforms',
    'stats.quota': 'Total Quota Remaining',
    'stats.successRate': 'Command Success Rate',
    'stats.pending': 'Commands In Flight',
    'platform.title': 'Open Platforms',
    'platform.count': '{count} connected',
    'platform.empty': 'No platforms connected yet',
    'platform.appId': 'AppId',
    'platform.name': 'Platform Name',
    'platform.quota': 'Quota Remaining',
    'platform.status': 'Status',
    'platform.enabled': 'Enabled',
    'platform.disabled': 'Disabled',
    'platform.actions': 'Actions',
    'platform.recharge': 'Recharge',
    'monitor.title': '4G Command Monitor',
    'monitor.pendingTag': '{count} in flight',
    'monitor.search': 'Search SN / command ID / type',
    'monitor.allStatus': 'All statuses',
    'monitor.autoRefresh': 'Auto refresh',
    'monitor.empty': 'No command logs yet',
    'monitor.cmdId': 'Command ID',
    'monitor.deviceSn': 'Device SN',
    'monitor.cmdType': 'Command Type',
    'monitor.status': 'Status',
    'monitor.expireAt': 'Expire Time',
    'monitor.createdAt': 'Created Time',
    'status.sending': 'Sending',
    'status.success': 'Succeeded',
    'status.expired': 'Expired',
    'status.unknown': 'Unknown ({status})',
    'recharge.title': 'Recharge Quota',
    'recharge.current': 'Currently remaining',
    'recharge.invalid': 'Please enter a valid quantity',
    'recharge.success': 'Recharged {amount} quota for {name}',
    'recharge.after': 'Quota after recharge:',
    'recharge.confirm': 'Confirm Recharge',
    'request.sessionExpired': 'Session expired, please sign in again',
    'request.failed': 'Request failed',
    'request.network': 'Network error',
    'request.unknown': 'Unknown error',
    'request.unauthorized': 'Unauthorized',
}

export type MessageKey = keyof typeof en

const zh: Record<MessageKey, string> = {
    'app.title': 'Smart IoT 管理控制台',
    'common.refresh': '刷新',
    'common.cancel': '取消',
    'login.brandSuffix': '控制台',
    'login.heroTop': '万物互联',
    'login.heroAccent': '尽在掌控',
    'login.heroDesc':
        '统一管理第三方开放平台配额，实时监控 4G 远控指令链路，让每一次设备下发都有迹可循。',
    'login.point1': '开放平台接入 · AppId / 配额一站管理',
    'login.point2': '4G 指令监控 · 下发 / 成功 / 超时全链路',
    'login.point3': '实时刷新 · 异常状态即时可见',
    'login.welcome': '欢迎回来',
    'login.subtitle': '登录 Smart IoT 管理控制台',
    'login.username': '用户名',
    'login.password': '密码',
    'login.usernameRequired': '请输入用户名',
    'login.passwordRequired': '请输入密码',
    'login.passwordMin': '密码至少 6 位',
    'login.submit': '登 录',
    'login.submitting': '登录中…',
    'login.hint': '默认账号',
    'login.welcomeBack': '欢迎回来，{name}',
    'dashboard.title': 'Smart IoT 控制台',
    'dashboard.subtitle': '开放平台 · 4G 指令中心',
    'dashboard.live': '实时监控中',
    'dashboard.paused': '监控已暂停',
    'dashboard.logout': '退出',
    'stats.platforms': '接入平台',
    'stats.quota': '剩余配额总量',
    'stats.successRate': '指令成功率',
    'stats.pending': '下发中指令',
    'platform.title': '第三方开放平台',
    'platform.count': '{count} 个接入',
    'platform.empty': '暂无接入平台',
    'platform.appId': 'AppId',
    'platform.name': '平台名称',
    'platform.quota': '剩余配额',
    'platform.status': '状态',
    'platform.enabled': '启用',
    'platform.disabled': '禁用',
    'platform.actions': '操作',
    'platform.recharge': '配额充值',
    'monitor.title': '4G 远控指令监控',
    'monitor.pendingTag': '{count} 条下发中',
    'monitor.search': '搜索 SN / 指令 ID / 类型',
    'monitor.allStatus': '全部状态',
    'monitor.autoRefresh': '自动刷新',
    'monitor.empty': '暂无指令日志',
    'monitor.cmdId': '指令 ID',
    'monitor.deviceSn': '设备 SN',
    'monitor.cmdType': '指令类型',
    'monitor.status': '状态',
    'monitor.expireAt': '过期时间',
    'monitor.createdAt': '创建时间',
    'status.sending': '下发中',
    'status.success': '执行成功',
    'status.expired': '超时失效',
    'status.unknown': '未知({status})',
    'recharge.title': '配额充值',
    'recharge.current': '当前剩余',
    'recharge.invalid': '请输入有效的充值数量',
    'recharge.success': '已为 {name} 充值 {amount} 配额',
    'recharge.after': '充值后配额：',
    'recharge.confirm': '确认充值',
    'request.sessionExpired': '登录已过期，请重新登录',
    'request.failed': '请求失败',
    'request.network': '网络异常',
    'request.unknown': '未知错误',
    'request.unauthorized': '未认证',
}

const messages: Record<Locale, Record<MessageKey, string>> = { en, zh }

/**
 * Translate a key with optional {placeholder} params; reactive to locale.
 * 按 key 翻译文案，支持 {占位符} 参数；随语言切换响应式更新。
 */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
    let text = messages[locale.value][key] ?? en[key] ?? key
    if (params) {
        for (const [name, value] of Object.entries(params)) {
            text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value))
        }
    }
    return text
}

/**
 * Switch locale and persist the choice.
 * 切换语言并持久化选择。
 */
export function setLocale(next: Locale): void {
    locale.value = next
    localStorage.setItem(STORAGE_KEY, next)
}

/** Element Plus built-in locale, follows current language. / Element Plus 内置语言包，跟随当前语言。 */
export const elementLocale = computed(() => (locale.value === 'zh' ? zhCnLocale : enLocale))

/**
 * Composable entry for components.
 * 组件使用的组合式入口。
 */
export function useI18n() {
    return { locale, t, setLocale, elementLocale }
}

/**
 * Keep <html lang> and document title in sync with locale.
 * 保持 <html lang> 与浏览器标题随语言同步。
 */
watchEffect(() => {
    document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en'
    document.title = t('app.title')
})