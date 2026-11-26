/**
 * Auth storage helpers: single source of truth for token & nickname keys.
 * 认证存储工具：统一管理 token 与昵称的 localStorage 键。
 */
const TOKEN_KEY = 'smart-iot-token'
const NICKNAME_KEY = 'smart-iot-nickname'

/** Read the bearer token from localStorage. / 从 localStorage 读取 token。 */
export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
}

/** Persist the bearer token. / 持久化保存 token。 */
export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
}

/** Read the cached display nickname. / 读取缓存的显示昵称。 */
export function getNickname(): string {
    return localStorage.getItem(NICKNAME_KEY) || 'Administrator'
}

/** Persist the display nickname. / 保存显示昵称。 */
export function setNickname(nickname: string): void {
    localStorage.setItem(NICKNAME_KEY, nickname)
}

/** Clear all auth state (logout / 401). / 清空全部认证状态（登出 / 401）。 */
export function clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(NICKNAME_KEY)
}