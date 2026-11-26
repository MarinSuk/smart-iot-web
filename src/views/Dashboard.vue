<script setup lang="ts">
/**
 * Dashboard: platform quota table (top) + realtime 4G command monitor (bottom).
 * 仪表盘：上半部分开放平台配额表格，下半部分 4G 远控指令实时监控表格。
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Coin,
  Cpu,
  Connection,
  Promotion,
  Refresh,
  Search,
  SwitchButton,
  TrendCharts,
} from '@element-plus/icons-vue'
import {
  getCurrentUser,
  listCommandLogs,
  listPlatforms,
  rechargeQuota,
  type AdminCommandLog,
  type AdminOpenPlatform,
} from '../api/iot'
import { clearAuth, getNickname, setNickname } from '../utils/auth'
import { useI18n, type MessageKey } from '../i18n'
import LangSwitch from '../components/LangSwitch.vue'

const { t } = useI18n()
const router = useRouter()

const platforms = ref<AdminOpenPlatform[]>([])
const logs = ref<AdminCommandLog[]>([])
const platformLoading = ref(false)
const logLoading = ref(false)
const nickname = ref(getNickname())

const keyword = ref('')
const statusFilter = ref<number | ''>('')
const autoRefresh = ref(true)
const AUTO_REFRESH_MS = 10000
let refreshTimer: number | undefined

/** Command status → i18n key & tag type mapping. / 指令状态 → 文案 key 与标签样式映射。 */
const COMMAND_STATUS: Record<number, { key: MessageKey; type: 'warning' | 'success' | 'danger' | 'info' }> = {
  0: { key: 'status.sending', type: 'warning' },
  1: { key: 'status.success', type: 'success' },
  2: { key: 'status.expired', type: 'danger' },
}

/** Resolve localized tag meta with fallback. / 获取本地化状态标签元信息（含兜底）。 */
function statusMeta(status: number) {
  const meta = COMMAND_STATUS[status]
  if (!meta) return { label: t('status.unknown', { status }), type: 'info' as const }
  return { label: t(meta.key), type: meta.type }
}

const totalQuota = computed(() => platforms.value.reduce((sum, p) => sum + (p.quotaRemain ?? 0), 0))
const pendingCount = computed(() => logs.value.filter((l) => l.status === 0).length)
const successRate = computed(() => {
  const finished = logs.value.filter((l) => l.status === 1 || l.status === 2)
  if (!finished.length) return '—'
  return `${Math.round((finished.filter((l) => l.status === 1).length / finished.length) * 100)}%`
})
const maxQuota = computed(() => Math.max(1, ...platforms.value.map((p) => p.quotaRemain ?? 0)))

const filteredLogs = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return logs.value.filter((l) => {
    const matchStatus = statusFilter.value === '' || l.status === statusFilter.value
    const matchKw =
        !kw ||
        [l.cmdId, l.deviceSn, l.cmdType].some((v) => (v ?? '').toLowerCase().includes(kw))
    return matchStatus && matchKw
  })
})

/**
 * Format ISO string or epoch millis to local datetime text.
 * 将 ISO 字符串或毫秒时间戳格式化为本地时间文本。
 */
function formatTime(value?: string | number): string {
  if (value === undefined || value === null || value === '') return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/**
 * Quota bar percentage relative to the richest platform.
 * 配额进度条百分比（相对当前最大配额）。
 */
function quotaPercent(row: AdminOpenPlatform): number {
  return Math.round(((row.quotaRemain ?? 0) / maxQuota.value) * 100)
}

/** Quota bar color by remaining level. / 按剩余配额水平返回进度条颜色。 */
function quotaColor(row: AdminOpenPlatform): string {
  if (row.quotaRemain <= 10) return '#fb7185'
  if (row.quotaRemain <= 100) return '#fbbf24'
  return '#22d3ee'
}

/**
 * Fetch platform list with loading state.
 * 加载开放平台列表（带 loading 状态）。
 */
async function fetchPlatforms(): Promise<void> {
  platformLoading.value = true
  try {
    platforms.value = (await listPlatforms()) ?? []
  } catch {
    /* Toast handled by interceptor / 错误提示由拦截器处理 */
  } finally {
    platformLoading.value = false
  }
}

/**
 * Fetch command logs; silent mode skips loading flicker for polling.
 * 加载指令日志；静默模式用于轮询，避免 loading 闪烁。
 */
async function fetchLogs(silent = false): Promise<void> {
  if (logLoading.value) return
  if (!silent) logLoading.value = true
  try {
    logs.value = (await listCommandLogs()) ?? []
  } catch {
    /* Toast handled by interceptor / 错误提示由拦截器处理 */
  } finally {
    logLoading.value = false
  }
}

/**
 * Load current auth context and refresh cached nickname.
 * 获取当前认证上下文并刷新缓存昵称。
 */
async function fetchMe(): Promise<void> {
  try {
    const me = await getCurrentUser()
    if (me?.subjectName) {
      nickname.value = me.subjectName
      setNickname(me.subjectName)
    }
  } catch {
    /* Non-blocking / 非阻塞失败 */
  }
}

/** Start polling timer for realtime monitor. / 启动实时监控轮询定时器。 */
function startAutoRefresh(): void {
  stopAutoRefresh()
  refreshTimer = window.setInterval(() => fetchLogs(true), AUTO_REFRESH_MS)
}

/** Stop polling timer. / 停止轮询定时器。 */
function stopAutoRefresh(): void {
  if (refreshTimer !== undefined) {
    window.clearInterval(refreshTimer)
    refreshTimer = undefined
  }
}

watch(autoRefresh, (on) => (on ? startAutoRefresh() : stopAutoRefresh()))

/* ---- Recharge dialog / 配额充值弹窗 ---- */
const rechargeVisible = ref(false)
const rechargeLoading = ref(false)
const rechargeTarget = ref<AdminOpenPlatform | null>(null)
const rechargeForm = reactive({ addQuantity: 500 })
const QUICK_AMOUNTS = [100, 500, 1000, 5000]

/**
 * Open recharge dialog for a platform row.
 * 打开指定平台的配额充值弹窗。
 */
function openRecharge(row: AdminOpenPlatform): void {
  rechargeTarget.value = row
  rechargeForm.addQuantity = 500
  rechargeVisible.value = true
}

/**
 * Submit recharge, optimistically update quota then re-sync list.
 * 提交充值：先乐观更新配额，再重新同步平台列表。
 */
async function submitRecharge(): Promise<void> {
  const target = rechargeTarget.value
  if (!target) return
  if (!rechargeForm.addQuantity || rechargeForm.addQuantity <= 0) {
    ElMessage.warning(t('recharge.invalid'))
    return
  }
  rechargeLoading.value = true
  try {
    const msg = await rechargeQuota(target.appId, rechargeForm.addQuantity)
    target.quotaRemain += rechargeForm.addQuantity
    ElMessage.success(
      msg || t('recharge.success', { name: target.platformName, amount: rechargeForm.addQuantity }),
    )
    rechargeVisible.value = false
    fetchPlatforms()
  } catch {
    /* Toast handled by interceptor / 错误提示由拦截器处理 */
  } finally {
    rechargeLoading.value = false
  }
}

/**
 * Logout: clear credentials and go to login page.
 * 退出登录：清除凭证并跳转登录页。
 */
function handleLogout(): void {
  clearAuth()
  stopAutoRefresh()
  router.replace('/login')
}

onMounted(() => {
  fetchPlatforms()
  fetchLogs()
  fetchMe()
  if (autoRefresh.value) startAutoRefresh()
})

onBeforeUnmount(() => stopAutoRefresh())
</script>

<template>
  <div class="dashboard">
    <header class="topbar">
      <div class="topbar-brand">
        <div class="brand-mark"><el-icon><Cpu /></el-icon></div>
        <div class="topbar-titles">
          <strong>{{ t('dashboard.title') }}</strong>
          <span>{{ t('dashboard.subtitle') }}</span>
        </div>
      </div>
      <div class="topbar-right">
        <span class="live-dot" :class="{ paused: !autoRefresh }" />
        <span class="live-text">{{ autoRefresh ? t('dashboard.live') : t('dashboard.paused') }}</span>
        <el-divider direction="vertical" />
        <LangSwitch />
        <el-divider direction="vertical" />
        <span class="user-chip">
          <span class="user-avatar">{{ nickname.charAt(0).toUpperCase() }}</span>
          {{ nickname }}
        </span>
        <el-button text :icon="SwitchButton" @click="handleLogout">{{ t('dashboard.logout') }}</el-button>
      </div>
    </header>

    <main class="content">
      <section class="stats">
        <div class="glass-panel stat-card stat-cyan">
          <div class="stat-icon"><el-icon><Connection /></el-icon></div>
          <div><span class="stat-value">{{ platforms.length }}</span><span class="stat-label">{{ t('stats.platforms') }}</span></div>
        </div>
        <div class="glass-panel stat-card stat-violet">
          <div class="stat-icon"><el-icon><Coin /></el-icon></div>
          <div><span class="stat-value mono">{{ totalQuota.toLocaleString() }}</span><span class="stat-label">{{ t('stats.quota') }}</span></div>
        </div>
        <div class="glass-panel stat-card stat-green">
          <div class="stat-icon"><el-icon><TrendCharts /></el-icon></div>
          <div><span class="stat-value mono">{{ successRate }}</span><span class="stat-label">{{ t('stats.successRate') }}</span></div>
        </div>
        <div class="glass-panel stat-card stat-amber">
          <div class="stat-icon"><el-icon><Promotion /></el-icon></div>
          <div><span class="stat-value mono">{{ pendingCount }}</span><span class="stat-label">{{ t('stats.pending') }}</span></div>
        </div>
      </section>

      <!-- Top: open platform list / 上半部分：开放平台列表 -->
      <section class="glass-panel panel">
        <div class="panel-head">
          <div class="panel-title">
            <h2>{{ t('platform.title') }}</h2>
            <el-tag size="small" effect="dark" round>{{ t('platform.count', { count: platforms.length }) }}</el-tag>
          </div>
          <el-button :icon="Refresh" :loading="platformLoading" @click="fetchPlatforms">{{ t('common.refresh') }}</el-button>
        </div>

        <el-table v-loading="platformLoading" :data="platforms" :empty-text="t('platform.empty')">
          <el-table-column :label="t('platform.appId')" prop="appId" min-width="160">
            <template #default="{ row }"><span class="mono cyan-text">{{ row.appId }}</span></template>
          </el-table-column>
          <el-table-column :label="t('platform.name')" prop="platformName" min-width="180" show-overflow-tooltip />
          <el-table-column :label="t('platform.quota')" min-width="220">
            <template #default="{ row }">
              <div class="quota-cell">
                <span class="mono quota-num" :style="{ color: quotaColor(row) }">
                  {{ (row.quotaRemain ?? 0).toLocaleString() }}
                </span>
                <el-progress
                    :percentage="quotaPercent(row)"
                    :color="quotaColor(row)"
                    :stroke-width="6"
                    :show-text="false"
                    class="quota-bar"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="t('platform.status')" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light" round>
                {{ row.status === 1 ? t('platform.enabled') : t('platform.disabled') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('platform.actions')" width="150" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" :icon="Coin" @click="openRecharge(row)">
                {{ t('platform.recharge') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <!-- Bottom: realtime 4G command monitor / 下半部分：4G 指令实时监控 -->
      <section class="glass-panel panel">
        <div class="panel-head">
          <div class="panel-title">
            <h2>{{ t('monitor.title') }}</h2>
            <el-tag size="small" type="warning" effect="dark" round v-if="pendingCount">
              {{ t('monitor.pendingTag', { count: pendingCount }) }}
            </el-tag>
          </div>
          <div class="panel-tools">
            <el-input
                v-model="keyword"
                :placeholder="t('monitor.search')"
                :prefix-icon="Search"
                clearable
                class="tool-search"
            />
            <el-select v-model="statusFilter" :placeholder="t('monitor.allStatus')" clearable class="tool-select">
              <el-option :label="t('status.sending')" :value="0" />
              <el-option :label="t('status.success')" :value="1" />
              <el-option :label="t('status.expired')" :value="2" />
            </el-select>
            <div class="tool-auto">
              <span>{{ t('monitor.autoRefresh') }}</span>
              <el-switch v-model="autoRefresh" />
            </div>
            <el-button type="primary" :icon="Refresh" :loading="logLoading" @click="fetchLogs()">
              {{ t('common.refresh') }}
            </el-button>
          </div>
        </div>

        <el-table
            v-loading="logLoading"
            :data="filteredLogs"
            max-height="420"
            :empty-text="t('monitor.empty')"
            :row-class-name="({ row }: { row: AdminCommandLog }) => (row.status === 0 ? 'row-pending' : '')"
        >
          <el-table-column :label="t('monitor.cmdId')" prop="cmdId" min-width="200" show-overflow-tooltip>
            <template #default="{ row }"><span class="mono">{{ row.cmdId }}</span></template>
          </el-table-column>
          <el-table-column :label="t('monitor.deviceSn')" prop="deviceSn" min-width="160">
            <template #default="{ row }"><span class="mono cyan-text">{{ row.deviceSn }}</span></template>
          </el-table-column>
          <el-table-column :label="t('monitor.cmdType')" prop="cmdType" min-width="130">
            <template #default="{ row }">
              <el-tag effect="plain" size="small">{{ row.cmdType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('monitor.status')" width="140" align="center">
            <template #default="{ row }">
              <el-tag :type="statusMeta(row.status).type" effect="dark" round>
                <span class="status-dot" :class="`dot-${statusMeta(row.status).type}`" />
                {{ statusMeta(row.status).label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('monitor.expireAt')" min-width="170">
            <template #default="{ row }">
              <span class="mono dim-text">{{ formatTime(row.expireTimestamp) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('monitor.createdAt')" min-width="170">
            <template #default="{ row }">
              <span class="mono dim-text">{{ formatTime(row.createTime) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </main>

    <!-- Recharge dialog / 配额充值弹窗 -->
    <el-dialog
        v-model="rechargeVisible"
        :title="t('recharge.title')"
        width="440px"
        :close-on-click-modal="false"
        destroy-on-close
    >
      <div v-if="rechargeTarget" class="recharge-body">
        <div class="recharge-target">
          <div>
            <strong>{{ rechargeTarget.platformName }}</strong>
            <span class="mono dim-text">{{ rechargeTarget.appId }}</span>
          </div>
          <div class="recharge-current">
            {{ t('recharge.current') }}
            <span class="mono cyan-text">{{ rechargeTarget.quotaRemain.toLocaleString() }}</span>
          </div>
        </div>

        <el-input-number
            v-model="rechargeForm.addQuantity"
            :min="1"
            :max="100000"
            :step="100"
            size="large"
            class="recharge-input"
        />
        <div class="quick-amounts">
          <el-button
              v-for="amount in QUICK_AMOUNTS"
              :key="amount"
              size="small"
              :type="rechargeForm.addQuantity === amount ? 'primary' : 'default'"
              @click="rechargeForm.addQuantity = amount"
          >
            +{{ amount }}
          </el-button>
        </div>

        <p class="recharge-preview">
          {{ t('recharge.after') }}
          <span class="mono gradient-text preview-num">
            {{ (rechargeTarget.quotaRemain + (rechargeForm.addQuantity || 0)).toLocaleString() }}
          </span>
        </p>
      </div>
      <template #footer>
        <el-button @click="rechargeVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="rechargeLoading" @click="submitRecharge">
          {{ t('recharge.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 28px;
  background: rgba(5, 8, 15, 0.78);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--iot-line);
}
.topbar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.topbar-titles {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.topbar-titles strong {
  font-size: 16px;
}
.topbar-titles span {
  font-size: 11px;
  color: var(--iot-text-dim);
  letter-spacing: 0.05em;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--iot-text-dim);
}
.live-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--iot-green);
  box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.6);
  animation: beat 2s ease-out infinite;
}
.live-dot.paused {
  background: var(--iot-amber);
  animation: none;
}
@keyframes beat {
  0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.55); }
  70% { box-shadow: 0 0 0 9px rgba(52, 211, 153, 0); }
  100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
}
.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--iot-text);
}
.user-avatar {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  color: #04121a;
  background: linear-gradient(135deg, #22d3ee, #e879f9);
}

.content {
  display: grid;
  gap: 20px;
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 28px 48px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  animation: rise 0.45s ease both;
}
.stat-card:nth-child(2) { animation-delay: 0.06s; }
.stat-card:nth-child(3) { animation-delay: 0.12s; }
.stat-card:nth-child(4) { animation-delay: 0.18s; }
@keyframes rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
.stat-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 13px;
  font-size: 22px;
}
.stat-cyan .stat-icon { color: #22d3ee; background: rgba(34, 211, 238, 0.12); }
.stat-violet .stat-icon { color: #a78bfa; background: rgba(139, 92, 246, 0.14); }
.stat-green .stat-icon { color: #34d399; background: rgba(52, 211, 153, 0.12); }
.stat-amber .stat-icon { color: #fbbf24; background: rgba(251, 191, 36, 0.12); }
.stat-card > div:last-child {
  display: flex;
  flex-direction: column;
}
.stat-value {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.2;
}
.stat-label {
  font-size: 12px;
  color: var(--iot-text-dim);
}

.panel {
  padding: 20px 22px 22px;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.panel-title h2 {
  margin: 0;
  font-size: 17px;
}
.panel-tools {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.tool-search {
  width: 220px;
}
.tool-select {
  width: 130px;
}
.tool-auto {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--iot-text-dim);
}

.quota-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.quota-num {
  min-width: 56px;
  font-weight: 700;
}
.quota-bar {
  flex: 1;
  max-width: 140px;
}
.cyan-text {
  color: var(--iot-cyan);
}
.dim-text {
  color: var(--iot-text-dim);
  font-size: 12.5px;
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: 1px;
  background: currentColor;
}
.dot-warning {
  animation: blink 1.1s ease-in-out infinite;
}
@keyframes blink {
  50% { opacity: 0.25; }
}

:deep(.row-pending) {
  background: rgba(251, 191, 36, 0.045);
}

.recharge-body {
  display: grid;
  gap: 16px;
}
.recharge-target {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--iot-line);
  border-radius: 12px;
  background: rgba(34, 211, 238, 0.05);
}
.recharge-target > div:first-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.recharge-current {
  font-size: 12px;
  color: var(--iot-text-dim);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.recharge-current .mono {
  font-size: 18px;
  font-weight: 700;
}
.recharge-input {
  width: 100%;
}
.quick-amounts {
  display: flex;
  gap: 8px;
}
.recharge-preview {
  margin: 0;
  font-size: 13px;
  color: var(--iot-text-dim);
}
.preview-num {
  font-size: 20px;
  font-weight: 800;
}

@media (max-width: 1000px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .live-text {
    display: none;
  }
}
@media (max-width: 640px) {
  .content {
    padding: 16px 14px 40px;
  }
  .topbar {
    padding: 10px 14px;
  }
  .topbar-titles span {
    display: none;
  }
  .stats {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .tool-search {
    width: 100%;
  }
}
</style>
