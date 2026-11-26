/**
 * IoT API layer: types derived from openapi.json and typed call functions.
 * IoT 接口层：依据 openapi.json 推导的类型定义与 API 调用函数。
 */
import { http } from '../utils/request'

/** POST /admin/auth/login body. / 管理员登录请求体。 */
export interface LoginRequest {
    /** Admin username. / 管理员用户名。 */
    username: string
    /** Admin password. / 管理员密码。 */
    password: string
}

/** Login response payload. / 登录响应数据。 */
export interface LoginResponse {
    /** Bearer access token. / Bearer 访问令牌。 */
    token: string
    /** Display nickname. / 显示昵称。 */
    nickname: string
}

/** Open platform entity. / 第三方开放平台实体。 */
export interface AdminOpenPlatform {
    id: number
    appId: string
    appSecret: string
    platformName: string
    quotaRemain: number
    /** 1 = enabled, 0 = disabled. / 1 启用，0 禁用。 */
    status: number
}

/** 4G command log entity. / 4G 远控指令日志实体。 */
export interface AdminCommandLog {
    id: number
    cmdId: string
    deviceSn: string
    cmdType: string
    /** 0 = sending, 1 = success, 2 = expired. / 0 下发中，1 执行成功，2 超时失效。 */
    status: number
    expireTimestamp: number
    createTime: string
}

/** Current auth context. / 当前认证上下文。 */
export interface AuthContext {
    authType: string
    subjectId: string
    subjectName: string
}

/** Command status enum for UI mapping. / 指令状态枚举，用于界面映射。 */
export const CommandStatus = {
    SENDING: 0,
    SUCCESS: 1,
    EXPIRED: 2,
} as const

/**
 * Admin login, returns token & nickname.
 * 管理员登录，返回令牌与昵称。
 */
export function login(payload: LoginRequest): Promise<LoginResponse> {
    return http.post<LoginResponse>('/admin/auth/login', payload)
}

/**
 * Get current authenticated user context.
 * 获取当前登录用户上下文。
 */
export function getCurrentUser(): Promise<AuthContext> {
    return http.get<AuthContext>('/admin/auth/me')
}

/**
 * List all third-party open platforms.
 * 获取第三方开放平台列表。
 */
export function listPlatforms(): Promise<AdminOpenPlatform[]> {
    return http.get<AdminOpenPlatform[]>('/admin/platform/list')
}

/**
 * Recharge quota for a platform, returns backend message.
 * 为指定平台充值配额，返回后端提示信息。
 */
export function rechargeQuota(appId: string, addQuantity: number): Promise<string> {
    return http.post<string>('/admin/platform/recharge', null, { appId, addQuantity })
}

/**
 * List 4G remote command logs.
 * 查询 4G 远控指令日志列表。
 */
export function listCommandLogs(): Promise<AdminCommandLog[]> {
    return http.get<AdminCommandLog[]>('/admin/platform/command-logs')
}