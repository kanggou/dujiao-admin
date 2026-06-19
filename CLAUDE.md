# Admin Web

Vue 3 + TypeScript + Vite 后台管理面板。

## 启动与构建

```bash
# 开发(端口 5174,代理 /api 与 /uploads 到 :8080)
npm run dev

# 类型检查 + 生产构建
npm run build

# 全栈打包模式(嵌入到 Go 二进制内)
npm run build:fullstack

# 预览 dist
npm run preview
```

依赖 API 后端运行在 `http://localhost:8080`(见 `vite.config.ts` 的 proxy)。

## 技术栈

- Vue 3.5 + `<script setup>` + TypeScript
- Vite 7
- Pinia(状态)
- Vue Router 4
- Vue I18n 9
- reka-ui + tailwind(CSS via class-variance-authority + tailwind-merge)
- Lucide 图标
- Tiptap 富文本(table/link/image/text-align 扩展)
- Marked + DOMPurify(Markdown 渲染)
- @tanstack/vue-table(表格)

## 目录结构

```
src/
├── api/          后端接口封装
├── components/   通用组件(含 reka-ui 二次封装)
├── composables/  组合式函数
├── constants/    常量
├── i18n/         多语言资源(index.ts 集中导出)
├── layouts/      布局组件
├── lib/          工具库(utils for cn class merge 等)
├── router/       路由定义
├── stores/       Pinia stores
├── views/        页面级组件
├── utils/
├── App.vue / main.ts
```

## 全栈打包说明

`VITE_FULLSTACK=1` 模式下,vite 会把 `<base href="__DJ_ADMIN_BASE__/">` 占位符注入 `index.html`,Go 后端 `internal/web` 包启动时把占位符替换为实际 admin 路径。本地开发不要带这个变量。

`cfasync-module-script` 插件给 module 类型的 `<script>` 加 `data-cfasync="false"`,绕过 Cloudflare Rocket Loader。

## 约定

- TypeScript 严格模式(`tsconfig.json`)
- 路径别名 `@/` → `src/`
- API 调用统一走 `src/api/` 下封装,不直接 `fetch`
- 表单/验证一般依赖 reka-ui 的原语 + 自定义组合
- 多语言键通过 `useI18n()` 调用,新增文案先加 i18n 资源

## 常见任务

- 新增页面 → `views/` 下加文件 + `router/` 注册 + 必要时加菜单项
- 调用新 API → `src/api/<module>.ts` 定义请求函数,在组件里 await
- 富文本编辑器 → 复用现有 Tiptap 封装组件,不要重复初始化
