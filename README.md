# SmartIoT-Web 智联设备云管理平台前端

基于 **Vue 3 + TypeScript + Vite** 构建的物联网（IoT）设备云后台管理前端，与后端 **SmartIoT-Cloud 智联开放网关与设备云平台**（JDK 17 + Spring Boot 3）配套，依据 Knife4j 输出的 OpenAPI 3.0 协议文档驱动生成，覆盖管理员登录、第三方开放平台配额管控与 4G 远控指令实时监控的运维闭环。

## 核心功能

* **OpenAPI 驱动的类型安全接口层**：依据后端 `openapi.json` 推导全部请求/响应 TypeScript Interface（`LoginRequest`、`AdminOpenPlatform`、`AdminCommandLog`、`AuthContext` 等），API 调用函数端到端类型提示，解包 `Result<T>` 后直接返回业务数据。
* **双轨鉴权对接（管理端）**：Axios 请求拦截器自动注入 `Authorization: Bearer <token>`；响应拦截器统一处理 `code !== 200` 的 `ElMessage.error` 提示；HTTP 401 与业务 401 双通道识别，自动清除失效凭证并携带 `redirect` 跳转登录页，登录成功后回到原页面。
* **路由级访问守卫**：基于 `vue-router` 的 `beforeEach` 守卫，未登录访问受保护页面自动重定向登录页，已登录访问登录页自动跳转首页。
* **开放平台配额管控**：平台列表展示 AppId、平台名称、剩余配额（分级变色进度条：充足/偏低/告急）与启用状态；“配额充值”弹窗支持快捷金额与充值后配额实时预览，提交成功后乐观更新行数据并重新同步列表。
* **4G 远控指令实时监控**：指令日志表格以 `el-tag` 区分状态（0-下发中 `warning`、1-执行成功 `success`、2-超时失效 `danger`），下发中指令带呼吸圆点与行高亮；默认 10 秒静默轮询自动刷新（可开关），支持按设备 SN / 指令 ID / 类型搜索与状态筛选，组件卸载自动清理定时器。
* **运维态势统计**：顶部统计卡片实时汇总接入平台数、剩余配额总量、指令成功率与下发中指令数。
* **国际化（默认英语）**：零依赖轻量响应式 i18n，`EN / 中文` 滑块切换器全站即时生效，同步驱动 Element Plus 内置语言包、表单校验规则、`<html lang>` 与浏览器标题，语言选择持久化至 `localStorage`。
* **主题化设计系统**：「深空蓝 × 电光青」IoT 监控暗色主题，定制 Element Plus Dark 变量、主题化滚动条、玻璃拟态面板、极光背景与设备网络动效登录页。

## 技术栈

* **核心框架**：Vue 3.5（`<script setup lang="ts">` 组合式 API）、TypeScript 6.0
* **构建工具**：Vite 5.4.11（锁定版本以兼容较低 Node 环境）、vue-tsc 类型检查
* **UI 组件库**：Element Plus 2.14（暗色主题 + 中文/英文语言包）、@element-plus/icons-vue
* **路由与请求**：vue-router（History 模式 + 导航守卫）、Axios 1.x（拦截器统一封装）
* **国际化**：自研轻量响应式 i18n 模块（无第三方依赖）

## 目录结构

```
smart-iot-web 
├── public/ # 静态资源（favicon 等） 
├── src 
│ ├── api 
│ │ └── iot.ts # OpenAPI 推导的类型定义与 API 调用函数 
│ ├── components 
│ │ └── LangSwitch.vue # EN / 中文 语言切换器 
│ ├── i18n 
│ │ └── index.ts # 语言状态、双语文案字典、Element Plus 语言包同步 
│ ├── router 
│ │ └── index.ts # 路由表与 Token 导航守卫 
│ ├── utils 
│ │ ├── auth.ts # Token / 昵称的 localStorage 统一存取 
│ │ └── request.ts # Axios 实例：鉴权注入、Result 解包、401 处理 
│ ├── views 
│ │ ├── Login.vue # 登录页：品牌展示区 + 账号表单 
│ │ └── Dashboard.vue # 控制台：平台配额表格 + 4G 指令实时监控 
│ ├── App.vue # 根组件：ConfigProvider 语言提供者 + 路由出口 
│ ├── main.ts # 应用入口：Element Plus（暗色）与路由注册 
│ └── style.css # 全局设计系统（暗色变量、滚动条、共享样式） 
├── openapi.json # 后端 Knife4j 导出的 OpenAPI 3.0 协议文档 
├── vite.config.ts # /api 代理转发配置 
└── package.json
```
## 运行环境

* **Node.js**：18+（推荐 20 / 22 LTS；项目已将 Vite 锁定为 `5.4.11`，规避旧版 Node 下 `crypto.hash is not a function` 报错）
* **包管理器**：npm 9+
* **配套后端**：SmartIoT-Cloud 网关服务运行于 `http://localhost:8081`（需先行启动 MySQL / Redis / RabbitMQ 相关环境，详见后端 README）

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（默认 http://localhost:5173）
npm run dev