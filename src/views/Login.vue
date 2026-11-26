<script setup lang="ts">
/**
 * Login view: brand showcase + credential form, stores token then redirects.
 * 登录视图：品牌展示区 + 账号表单，登录成功保存 Token 并跳转首页。
 */
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Cpu, Lock, User, Connection, Odometer, Bell } from '@element-plus/icons-vue'
import { login } from '../api/iot'
import { setNickname, setToken } from '../utils/auth'
import { useI18n } from '../i18n'
import LangSwitch from '../components/LangSwitch.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({ username: '', password: '' })

/** Localized validation rules, re-evaluated on locale change. / 本地化校验规则，随语言切换重新生成。 */
const rules = computed<FormRules>(() => ({
  username: [{ required: true, message: t('login.usernameRequired'), trigger: 'blur' }],
  password: [
    { required: true, message: t('login.passwordRequired'), trigger: 'blur' },
    { min: 6, message: t('login.passwordMin'), trigger: 'blur' },
  ],
}))

/**
 * Validate form, call login API, persist token and redirect.
 * 校验表单，调用登录接口，保存 Token 并跳转目标页。
 */
async function handleLogin(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const res = await login({ username: form.username, password: form.password })
    setToken(res.token)
    setNickname(res.nickname)
    ElMessage.success(t('login.welcomeBack', { name: res.nickname }))
    router.replace((route.query.redirect as string) || '/')
  } catch {
    /* Error toast handled by interceptor / 错误提示由拦截器统一处理 */
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="aurora aurora-a" />
    <div class="aurora aurora-b" />
    <LangSwitch class="login-lang" />

    <section class="showcase">
      <div class="showcase-brand">
        <div class="brand-mark"><el-icon><Cpu /></el-icon></div>
        <span class="showcase-name">Smart IoT<span class="gradient-text"> {{ t('login.brandSuffix') }}</span></span>
      </div>

      <h1 class="showcase-title">
        {{ t('login.heroTop') }}<br />
        <span class="gradient-text">{{ t('login.heroAccent') }}</span>
      </h1>
      <p class="showcase-desc">{{ t('login.heroDesc') }}</p>

      <svg class="network" viewBox="0 0 420 260" fill="none" aria-hidden="true">
        <g stroke="rgba(34,211,238,0.35)" stroke-width="1.2">
          <path d="M210 130 L70 60" /><path d="M210 130 L350 55" />
          <path d="M210 130 L60 200" /><path d="M210 130 L360 205" />
          <path d="M210 130 L210 30" /><path d="M70 60 L210 30" />
          <path d="M350 55 L210 30" /><path d="M60 200 L360 205" stroke-dasharray="4 6" />
        </g>
        <circle class="node-pulse" cx="210" cy="130" r="26" fill="rgba(34,211,238,0.12)" />
        <circle cx="210" cy="130" r="12" fill="#22d3ee" />
        <circle class="node-pulse delay-1" cx="70" cy="60" r="8" fill="#8b5cf6" />
        <circle class="node-pulse delay-2" cx="350" cy="55" r="8" fill="#e879f9" />
        <circle class="node-pulse delay-3" cx="60" cy="200" r="8" fill="#34d399" />
        <circle class="node-pulse delay-1" cx="360" cy="205" r="8" fill="#fbbf24" />
        <circle class="node-pulse delay-2" cx="210" cy="30" r="6" fill="#38bdf8" />
      </svg>

      <ul class="showcase-points">
        <li><el-icon><Connection /></el-icon>{{ t('login.point1') }}</li>
        <li><el-icon><Odometer /></el-icon>{{ t('login.point2') }}</li>
        <li><el-icon><Bell /></el-icon>{{ t('login.point3') }}</li>
      </ul>
    </section>

    <section class="form-side">
      <div class="glass-panel form-card">
        <h2>{{ t('login.welcome') }}</h2>
        <p class="form-sub">{{ t('login.subtitle') }}</p>

        <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            size="large"
            label-position="top"
            @submit.prevent="handleLogin"
        >
          <el-form-item :label="t('login.username')" prop="username">
            <el-input
                v-model="form.username"
                placeholder="admin"
                :prefix-icon="User"
                clearable
                autocomplete="username"
            />
          </el-form-item>
          <el-form-item :label="t('login.password')" prop="password">
            <el-input
                v-model="form.password"
                type="password"
                placeholder="••••••"
                :prefix-icon="Lock"
                show-password
                autocomplete="current-password"
                @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-button
              type="primary"
              size="large"
              class="submit-btn"
              :loading="loading"
              native-type="submit"
          >
            {{ loading ? t('login.submitting') : t('login.submit') }}
          </el-button>
        </el-form>

        <p class="form-hint">{{ t('login.hint') }} <span class="mono">admin / 123456</span></p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  min-height: 100vh;
  overflow: hidden;
}

.login-lang {
  position: absolute;
  top: 20px;
  right: 24px;
  z-index: 5;
}

.aurora {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.5;
  pointer-events: none;
  animation: drift 14s ease-in-out infinite alternate;
}
.aurora-a {
  width: 480px;
  height: 480px;
  left: -120px;
  top: -100px;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.35), transparent 70%);
}
.aurora-b {
  width: 520px;
  height: 520px;
  right: -140px;
  bottom: -160px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.32), transparent 70%);
  animation-delay: -7s;
}
@keyframes drift {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(50px, 36px) scale(1.12); }
}

.showcase {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 64px 72px;
  gap: 22px;
}
.showcase-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  font-size: 18px;
}
.showcase-title {
  margin: 8px 0 0;
  font-size: clamp(36px, 4.5vw, 56px);
  line-height: 1.16;
  font-weight: 800;
  letter-spacing: 0.01em;
}
.showcase-desc {
  margin: 0;
  max-width: 460px;
  color: var(--iot-text-dim);
  line-height: 1.8;
}
.network {
  width: min(420px, 100%);
  margin: 4px 0;
}
.node-pulse {
  transform-box: fill-box;
  transform-origin: center;
  animation: pulse 3s ease-in-out infinite;
}
.delay-1 { animation-delay: 0.6s; }
.delay-2 { animation-delay: 1.2s; }
.delay-3 { animation-delay: 1.8s; }
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.35); opacity: 0.55; }
}
.showcase-points {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
  color: var(--iot-text-dim);
  font-size: 14px;
}
.showcase-points li {
  display: flex;
  align-items: center;
  gap: 10px;
}
.showcase-points .el-icon {
  color: var(--iot-cyan);
  font-size: 17px;
}

.form-side {
  display: grid;
  place-items: center;
  padding: 48px 32px;
}
.form-card {
  width: min(400px, 100%);
  padding: 40px 36px 28px;
  animation: rise 0.5s ease both;
}
@keyframes rise {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
.form-card h2 {
  margin: 0;
  font-size: 26px;
}
.form-sub {
  margin: 6px 0 26px;
  color: var(--iot-text-dim);
  font-size: 14px;
}
.submit-btn {
  width: 100%;
  margin-top: 6px;
  height: 44px;
  font-size: 15px;
  letter-spacing: 0.3em;
}
.form-hint {
  margin: 18px 0 0;
  text-align: center;
  font-size: 12px;
  color: var(--iot-text-dim);
}
.form-hint .mono {
  color: var(--iot-cyan);
}

@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
  }
  .showcase {
    padding: 48px 28px 0;
  }
  .network,
  .showcase-points {
    display: none;
  }
  .form-side {
    padding: 28px 20px 48px;
  }
}
</style>