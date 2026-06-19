<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDiscordBotSettings } from '@/composables/useDiscordBotSettings'
import { botTextCatalog, botTextGroups } from './discordBotTextCatalog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, RotateCcw, Save, Plus, Trash2, ArrowUp, ArrowDown, ImageIcon, ScrollText, ListOrdered, Workflow, ArrowDownToLine, ChevronDown, Type, Search } from 'lucide-vue-next'

const {
  currentLang, fetchConfig, form, languages, loading, saving, saveConfig, resetPanelTemplate,
  addHelpItem, removeHelpItem, moveHelpItem,
  addMenuItem, removeMenuItem, moveMenuItem, menuActionTypes,
} = useDiscordBotSettings()

type TabKey = 'panel' | 'help' | 'menu' | 'flow' | 'texts'
const tabs = [
  { key: 'panel' as TabKey, label: '交互模板', icon: ImageIcon, desc: '频道面板文案、按钮、弹窗与交互文字' },
  { key: 'help' as TabKey, label: '帮助中心', icon: ScrollText, desc: '自助说明、订单帮助与客服入口' },
  { key: 'menu' as TabKey, label: '菜单设置', icon: ListOrdered, desc: '内置指令菜单与自定义跳转' },
  { key: 'texts' as TabKey, label: '全部词条', icon: Type, desc: '逐条设置 Bot 所有交互文案（按分组与搜索）' },
  { key: 'flow' as TabKey, label: '流程浏览', icon: Workflow, desc: '查看每个面板按钮点击后的交互流程' },
]
const activeTab = ref<TabKey>('panel')

const interactionTextFields = [
  ['product_list_title', '商品列表标题'],
  ['product_list_empty', '商品为空提示'],
  ['product_list_choose', '商品列表选择提示'],
  ['product_select_placeholder', '商品下拉占位'],
  ['sku_select_placeholder', '规格下拉占位'],
  ['buy_quantity_button', '填写数量购买按钮'],
  ['back_button', '返回按钮'],
  ['back_product_list_button', '返回商品列表按钮'],
  ['order_lookup_button', '查询订单按钮'],
  ['prev_page_button', '上一页按钮'],
  ['next_page_button', '下一页按钮'],
  ['order_modal_title', '订单查询弹窗标题'],
  ['order_modal_label', '订单号输入框标题'],
  ['order_modal_placeholder', '订单号输入框提示'],
  ['quantity_modal_title', '数量弹窗标题'],
  ['quantity_modal_label', '数量输入框标题'],
  ['profile_required', '未绑定账号提示'],
  ['profile_edit_button', '修改邮箱密码按钮'],
  ['profile_language_button', '账号页语言按钮'],
  ['language_title', '语言设置标题'],
  ['language_placeholder', '语言下拉占位'],
  ['wallet_title', '钱包标题'],
  ['wallet_recharge_title', '钱包充值弹窗标题'],
] as const

const previewText = computed(() => {
  const panel = form.value.panel
  const lang = currentLang.value
  const parts = [`**${panel.title[lang]}**`, panel.intro[lang], '']
  if (panel.shop_section_title[lang]) parts.push(`**${panel.shop_section_title[lang]}**`)
  if (panel.shop_section_body[lang]) parts.push(panel.shop_section_body[lang])
  if (panel.show_important) {
    parts.push('')
    if (panel.important_title[lang]) parts.push(`**${panel.important_title[lang]}**`)
    if (panel.important_body[lang]) parts.push(panel.important_body[lang])
  }
  return parts.join('\n')
})

onMounted(fetchConfig)

// ===== 面板外观:分区显示开关 + 排序 =====
const sectionLabels: Record<string, string> = {
  title: '面板标题',
  intro: '开场说明',
  shop: '快速入口',
  important: '重要提示',
}
const sectionShowKey: Record<string, 'show_title' | 'show_intro' | 'show_shop' | 'show_important'> = {
  title: 'show_title',
  intro: 'show_intro',
  shop: 'show_shop',
  important: 'show_important',
}
const sectionShow = computed(() => {
  const ap = form.value.panel_appearance
  return {
    get title() { return ap.show_title }, set title(v: boolean) { ap.show_title = v },
    get intro() { return ap.show_intro }, set intro(v: boolean) { ap.show_intro = v },
    get shop() { return ap.show_shop }, set shop(v: boolean) { ap.show_shop = v },
    get important() { return ap.show_important }, set important(v: boolean) { ap.show_important = v },
  } as Record<string, boolean>
})
void sectionShowKey
const moveSection = (idx: number, dir: number) => {
  const arr = form.value.panel_appearance.section_order
  const target = idx + dir
  if (target < 0 || target >= arr.length) return
  const next = [...arr]
  const a = next[idx]
  const b = next[target]
  if (a === undefined || b === undefined) return
  next[idx] = b
  next[target] = a
  form.value.panel_appearance.section_order = next
}

// ===== 全部词条：逐条设置 bot 所有交互文案 =====
const textSearch = ref('')
const textGroup = ref<string>('全部')
const textGroupOptions = ['全部', ...botTextGroups]

// 保证 interaction_texts[key] 存在且是多语言对象（按当前启用语言补齐空串）
const ensureText = (key: string) => {
  const it = form.value.panel.interaction_texts
  if (!it[key]) it[key] = { 'en-US': '', 'zh-TW': '', 'es-ES': '' }
  return it[key]!
}

const filteredTextEntries = computed(() => {
  const kw = textSearch.value.trim().toLowerCase()
  return botTextCatalog.filter((e) => {
    if (textGroup.value !== '全部' && e.group !== textGroup.value) return false
    if (!kw) return true
    return e.key.toLowerCase().includes(kw) || e.def.toLowerCase().includes(kw)
  })
})


// ===== 流程浏览：每个面板入口按钮点击后的交互步骤 =====
// label 取自当前语言下用户配置的按钮/文案，跟随实时编辑变化。
interface FlowStep {
  label: string        // 步骤标题（用户看到的界面）
  detail: string       // 这一步展示/发生了什么
  actions?: string[]   // 该步骤里用户可点的下一步（按钮/选项）
}
const t = (obj: Record<string, string>, fallback: string) =>
  (obj?.[currentLang.value] || obj?.['en-US'] || fallback).trim() || fallback

const flows = computed<{ key: string; entry: string; color: string; steps: FlowStep[] }[]>(() => {
  const p = form.value.panel
  return [
    {
      key: 'shop', color: 'bg-primary text-primary-foreground',
      entry: t(p.shop_button_label, '🛒 购买商品'),
      steps: [
        { label: t(p.shop_button_label, '🛒 购买商品'), detail: '用户在频道面板点击「购买商品」入口。', actions: [t(p.interaction_texts?.product_select_placeholder || {}, '选择商品')] },
        { label: t(p.interaction_texts?.product_list_title || {}, '🛍️ 商品列表'), detail: '私密展示分页商品列表，每页 8 个，可翻页或下拉选择商品。', actions: [t(p.interaction_texts?.prev_page_button || {}, '上一页'), t(p.interaction_texts?.next_page_button || {}, '下一页'), '选择某个商品'] },
        { label: '商品详情', detail: '展示所选商品标题、价格、库存与简介；有多规格时出现规格下拉。', actions: [t(p.interaction_texts?.sku_select_placeholder || {}, '选择规格'), t(p.interaction_texts?.buy_quantity_button || {}, '填写数量购买'), t(p.interaction_texts?.back_product_list_button || {}, '返回商品列表')] },
        { label: t(p.interaction_texts?.quantity_modal_title || {}, '购买数量'), detail: '弹出数量输入弹窗，提交后创建订单并返回支付渠道按钮。', actions: ['选择支付渠道'] },
        { label: '订单已创建 / 支付', detail: '展示订单号与支付链接按钮；支付成功后通过私信发送发货内容。', actions: ['查询订单状态'] },
      ],
    },
    {
      key: 'order', color: 'bg-secondary text-secondary-foreground',
      entry: t(p.order_button_label, '📦 我的订单'),
      steps: [
        { label: t(p.order_button_label, '📦 我的订单'), detail: '用户点击「我的订单」入口。', actions: ['未绑定 → 提示绑定', '已绑定 → 订单列表'] },
        { label: t(p.interaction_texts?.order_modal_title || {}, '订单查询'), detail: '也可通过订单号弹窗精确查询：输入订单号后展示该订单。', actions: [t(p.interaction_texts?.order_lookup_button || {}, '查询订单')] },
        { label: '订单列表 / 详情', detail: '展示订单状态、金额、时间；可下拉选择某订单查看交付内容。', actions: ['选择订单', '刷新状态'] },
      ],
    },
    {
      key: 'account', color: 'bg-secondary text-secondary-foreground',
      entry: t(p.account_button_label, '👤 账号设置'),
      steps: [
        { label: t(p.account_button_label, '👤 账号设置'), detail: '展示当前绑定的邮箱与查询密码状态。', actions: [t(p.interaction_texts?.profile_edit_button || {}, '修改邮箱密码'), t(p.interaction_texts?.profile_language_button || {}, '语言')] },
        { label: '编辑资料弹窗', detail: '弹出邮箱 + 查询密码输入弹窗，提交后保存到账号。', actions: ['保存'] },
      ],
    },
    {
      key: 'wallet', color: 'bg-green-600 text-white',
      entry: t(p.wallet_button_label, '💰 钱包充值'),
      steps: [
        { label: t(p.wallet_button_label, '💰 钱包充值'), detail: '展示钱包余额与快捷充值金额按钮。', actions: ['充值 10 / 50 / 100', t(p.interaction_texts?.wallet_recharge_title || {}, '自定义金额'), '刷新余额'] },
        { label: '充值弹窗 / 渠道', detail: '选择或输入金额后创建充值单并返回支付渠道。', actions: ['选择支付渠道'] },
        { label: '充值成功', detail: '支付成功后通过私信或通知频道发送到账提醒。' },
      ],
    },
    {
      key: 'help', color: 'bg-secondary text-secondary-foreground',
      entry: t(p.help_button_label, '💬 帮助客服'),
      steps: [
        { label: t(p.help_button_label, '💬 帮助客服'), detail: '展示「帮助中心」Tab 配置的标题、开场说明与帮助条目。', actions: ['查看帮助条目', '客服链接'] },
      ],
    },
    {
      key: 'language', color: 'bg-secondary text-secondary-foreground',
      entry: t(p.language_button_label, '🌐 语言选择'),
      steps: [
        { label: t(p.language_button_label, '🌐 语言选择'), detail: '展示语言下拉，可选语言由「交互模板」里勾选的语言决定。', actions: [t(p.interaction_texts?.language_placeholder || {}, '选择语言')] },
        { label: '语言已更新', detail: '保存所选语言到账号（需先绑定账号），之后界面按新语言展示。' },
      ],
    },
  ]
})
const activeFlow = ref('shop')
const activeStep = ref(0)
const selectFlowStep = (flowKey: string, stepIdx: number) => {
  activeFlow.value = flowKey
  activeStep.value = stepIdx
}
const currentFlow = computed(() => flows.value.find(f => f.key === activeFlow.value))
const currentStep = computed(() => currentFlow.value?.steps[activeStep.value])


</script>

<template>
  <div class="space-y-6">
    <!-- 顶部:标题 + 语言切换 + 保存(三个 Tab 共用一份配置) -->
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Discord Bot 交互配置</h2>
        <p class="text-muted-foreground">{{ tabs.find(t => t.key === activeTab)?.desc }}</p>
      </div>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="flex rounded-lg border bg-card p-1">
          <button
            v-for="lang in languages"
            :key="lang.code"
            class="rounded-md px-3 py-1.5 text-xs font-medium"
            :class="currentLang === lang.code ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click="currentLang = lang.code"
          >{{ lang.name }}</button>
        </div>
        <Button v-if="activeTab === 'panel'" variant="outline" :disabled="saving || loading" @click="resetPanelTemplate">
          <RotateCcw class="mr-2 h-4 w-4" />恢复默认
        </Button>
        <Button v-if="activeTab !== 'flow'" :disabled="saving || loading" @click="saveConfig">
          <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
          <Save v-else class="mr-2 h-4 w-4" />保存
        </Button>
      </div>
    </div>

    <!-- Tab 切换栏 -->
    <div class="flex flex-wrap gap-2 border-b">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px"
        :class="activeTab === tab.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="activeTab = tab.key"
      >
        <component :is="tab.icon" class="h-4 w-4" />{{ tab.label }}
      </button>
    </div>

    <!-- ===== 交互模板 ===== -->
    <div v-show="activeTab === 'panel'" class="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>显示控制</CardTitle>
          <CardDescription>控制频道交互面板里哪些区域和组件显示。</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div class="flex items-center gap-3 rounded-lg border p-4">
            <Switch v-model="form.panel.enabled" id="panel-enabled" /><Label for="panel-enabled">启用面板模板</Label>
          </div>
          <div class="flex items-center gap-3 rounded-lg border p-4">
            <Switch v-model="form.panel.show_important" id="panel-important" /><Label for="panel-important">显示重要提示</Label>
          </div>
          <div class="flex items-center gap-3 rounded-lg border p-4">
            <Switch v-model="form.panel.show_support_button" id="panel-support" /><Label for="panel-support">显示客服按钮</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>面板显示语言 / Bot 可选语言</CardTitle>
          <CardDescription>选择面板在 Discord 频道中展示哪些语言，同时这也决定了用户在 Bot「🌐 语言」选单里可切换的语言。多选时面板会以分隔线拼接多种语言的文案。</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex flex-wrap gap-3">
            <label
              v-for="lang in languages"
              :key="lang.code"
              class="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors"
              :class="form.panel.panel_locales.includes(lang.code) ? 'border-primary bg-primary/5' : 'border-border'"
            >
              <input
                type="checkbox"
                :value="lang.code"
                :checked="form.panel.panel_locales.includes(lang.code)"
                class="h-4 w-4 rounded border-gray-300"
                @change="(e: Event) => {
                  const target = e.target as HTMLInputElement
                  if (target.checked) {
                    if (!form.panel.panel_locales.includes(lang.code)) form.panel.panel_locales.push(lang.code)
                  } else {
                    form.panel.panel_locales = form.panel.panel_locales.filter(l => l !== lang.code)
                  }
                }"
              />
              {{ lang.name }}
            </label>
          </div>
          <p v-if="form.panel.panel_locales.length === 0" class="mt-2 text-sm text-destructive">至少需要选择一种语言。</p>
        </CardContent>
      </Card>
      <!-- PLACEHOLDER_PANEL_CONTENT -->
      <Card>
        <CardHeader>
          <CardTitle>面板与菜单外观</CardTitle>
          <CardDescription>统一控制 Bot 所有页面(启动面板、商品列表、订单、账号、钱包、帮助等)的样式。Embed 模式会把每个页面包成主题色卡片;V2 模式仅启动面板生效,其余菜单页按 Embed 呈现。注意:Discord 不支持真实字号/字体,标题样式用 Markdown 模拟层级。</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div class="space-y-2">
              <Label>渲染模式</Label>
              <Select v-model="form.panel_appearance.render_mode">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">纯文本</SelectItem>
                  <SelectItem value="embed">Embed 卡片</SelectItem>
                  <SelectItem value="v2">Components V2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label>主题色（卡片色条）</Label>
              <div class="flex items-center gap-2">
                <input type="color" v-model="form.panel_appearance.theme_color" class="h-9 w-12 cursor-pointer rounded border" />
                <Input v-model="form.panel_appearance.theme_color" placeholder="#5865F2" />
              </div>
            </div>
            <div class="space-y-2">
              <Label>标题样式（模拟字号）</Label>
              <Select v-model="form.panel_appearance.title_style">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="h1"># 大标题</SelectItem>
                  <SelectItem value="h2">## 中标题</SelectItem>
                  <SelectItem value="bold">**粗体**</SelectItem>
                  <SelectItem value="plain">普通</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label>分隔线</Label>
              <Select v-model="form.panel_appearance.divider_style">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">───</SelectItem>
                  <SelectItem value="v2">V2 分隔线</SelectItem>
                  <SelectItem value="none">无</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <!-- PLACEHOLDER_APPEARANCE_SECTIONS -->
          <div class="space-y-2">
            <Label>分区显示与顺序</Label>
            <p class="text-xs text-muted-foreground">勾选要显示的分区，用箭头调整在面板中的先后顺序。</p>
            <div class="space-y-2">
              <div
                v-for="(key, idx) in form.panel_appearance.section_order"
                :key="key"
                class="flex items-center justify-between rounded-lg border p-3"
              >
                <label class="flex items-center gap-3 text-sm">
                  <input type="checkbox" v-model="sectionShow[key]" class="h-4 w-4 rounded border-gray-300" />
                  <span>{{ sectionLabels[key] || key }}</span>
                </label>
                <div class="flex gap-2">
                  <Button size="sm" variant="outline" :disabled="idx === 0" @click="moveSection(idx, -1)">↑</Button>
                  <Button size="sm" variant="outline" :disabled="idx === form.panel_appearance.section_order.length - 1" @click="moveSection(idx, 1)">↓</Button>
                </div>
              </div>
            </div>
          </div>
          <div v-if="form.panel_appearance.render_mode === 'embed'" class="grid gap-4 md:grid-cols-2">
            <label class="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <input type="checkbox" v-model="form.panel_appearance.show_thumbnail" class="h-4 w-4 rounded border-gray-300" />
              <span>显示缩略图（用欢迎封面）</span>
            </label>
            <div class="space-y-2">
              <Label>页脚文字 <span class="ml-1 rounded bg-muted px-1.5 text-xs text-muted-foreground">{{ currentLang }}</span></Label>
              <Input v-model="form.panel_appearance.footer_text[currentLang]" placeholder="如：Powered by Dujiao" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>主面板文案 <span class="ml-2 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">{{ currentLang }}</span></CardTitle>
              <CardDescription>支持换行。Discord 单条消息长度有限，建议不要写太长。</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="space-y-2"><Label>面板标题</Label><Input v-model="form.panel.title[currentLang]" placeholder="例如：🛒 Discord 商品服务中心" /></div>
              <div class="space-y-2"><Label>开场说明</Label><Textarea v-model="form.panel.intro[currentLang]" rows="3" placeholder="选择下方功能即可完成购买、查单、账号设置、钱包充值和客服咨询。" /></div>
              <div class="space-y-2"><Label>快速入口标题</Label><Input v-model="form.panel.shop_section_title[currentLang]" placeholder="🧭 快速入口" /></div>
              <div class="space-y-2"><Label>快速入口内容</Label><Textarea v-model="form.panel.shop_section_body[currentLang]" rows="5" placeholder="🛒 购买商品｜📦 我的订单｜👤 账号设置｜💰 钱包充值｜💬 帮助客服" /></div>
              <div class="space-y-2"><Label>重要提示标题</Label><Input v-model="form.panel.important_title[currentLang]" placeholder="⚠️ Important / 重要" /></div>
              <div class="space-y-2"><Label>重要提示内容</Label><Textarea v-model="form.panel.important_body[currentLang]" rows="5" placeholder="支付链接、订单状态、钱包充值和发卡内容会通过私密回复通知。" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>按钮文案 <span class="ml-2 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">{{ currentLang }}</span></CardTitle>
              <CardDescription>只修改显示文字，不改变按钮原本的功能。</CardDescription>
            </CardHeader>
            <CardContent class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2"><Label>购买商品按钮</Label><Input v-model="form.panel.shop_button_label[currentLang]" /></div>
              <div class="space-y-2"><Label>我的订单按钮</Label><Input v-model="form.panel.order_button_label[currentLang]" /></div>
              <div class="space-y-2"><Label>账号设置按钮</Label><Input v-model="form.panel.account_button_label[currentLang]" /></div>
              <div class="space-y-2"><Label>钱包充值按钮</Label><Input v-model="form.panel.wallet_button_label[currentLang]" /></div>
              <div class="space-y-2"><Label>帮助客服按钮</Label><Input v-model="form.panel.help_button_label[currentLang]" /></div>
              <div class="space-y-2"><Label>语言选择按钮</Label><Input v-model="form.panel.language_button_label[currentLang]" /></div>
              <div class="space-y-2"><Label>客服按钮</Label><Input v-model="form.panel.support_button_label[currentLang]" /></div>
              <div class="space-y-2"><Label>刷新按钮</Label><Input v-model="form.panel.refresh_button_label[currentLang]" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>所有交互文案 <span class="ml-2 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">{{ currentLang }}</span></CardTitle>
              <CardDescription>这里用于修改商品列表、规格选择、数量弹窗、订单查询、账号绑定、语言选择、钱包等交互内容。</CardDescription>
            </CardHeader>
            <CardContent class="grid gap-4 md:grid-cols-2">
              <div v-for="field in interactionTextFields" :key="field[0]" class="space-y-2">
                <Label>{{ field[1] }}</Label>
                <Textarea v-if="['profile_required'].includes(field[0])" v-model="form.panel.interaction_texts[field[0]]![currentLang]" rows="3" />
                <Input v-else v-model="form.panel.interaction_texts[field[0]]![currentLang]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>用户面板固定入口</CardTitle>
              <CardDescription>为了降低用户操作复杂度，Discord 频道面板只展示 6 个入口；第六个入口为语言选择。</CardDescription>
            </CardHeader>
            <CardContent class="grid gap-3 md:grid-cols-6">
              <div class="rounded-lg border p-3 text-sm">{{ form.panel.shop_button_label[currentLang] }}</div>
              <div class="rounded-lg border p-3 text-sm">{{ form.panel.order_button_label[currentLang] }}</div>
              <div class="rounded-lg border p-3 text-sm">{{ form.panel.account_button_label[currentLang] }}</div>
              <div class="rounded-lg border p-3 text-sm">{{ form.panel.wallet_button_label[currentLang] }}</div>
              <div class="rounded-lg border p-3 text-sm">{{ form.panel.help_button_label[currentLang] }}</div>
              <div class="rounded-lg border p-3 text-sm">{{ form.panel.language_button_label[currentLang] }}</div>
            </CardContent>
          </Card>
        </div>

        <Card class="h-fit xl:sticky xl:top-6">
          <CardHeader>
            <CardTitle>预览</CardTitle>
            <CardDescription>保存后，在 Discord 频道执行 /panel 或点击“刷新面板”即可更新。</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="rounded-xl border bg-muted/40 p-4 text-sm whitespace-pre-wrap">{{ previewText }}</div>
            <div class="flex flex-wrap gap-2">
              <span class="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">{{ form.panel.shop_button_label[currentLang] }}</span>
              <span class="rounded-md bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground">{{ form.panel.order_button_label[currentLang] }}</span>
              <span class="rounded-md bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground">{{ form.panel.account_button_label[currentLang] }}</span>
              <span class="rounded-md bg-green-600 px-3 py-2 text-xs font-medium text-white">{{ form.panel.wallet_button_label[currentLang] }}</span>
              <span class="rounded-md bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground">{{ form.panel.help_button_label[currentLang] }}</span>
              <span class="rounded-md bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground">{{ form.panel.language_button_label[currentLang] }}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- ===== 帮助中心 ===== -->
    <div v-show="activeTab === 'help'" class="space-y-6">
      <Card>
        <CardHeader><CardTitle>帮助中心总设置</CardTitle><CardDescription>标题、开场说明和客服提示。</CardDescription></CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center gap-3 rounded-lg border p-4"><Switch v-model="form.help.enabled" id="discord-help-enabled" /><Label for="discord-help-enabled">启用帮助中心</Label></div>
          <div class="space-y-2"><Label>标题</Label><Input v-model="form.help.title[currentLang]" placeholder="❓ Discord 帮助中心" /></div>
          <div class="space-y-2"><Label>开场说明</Label><Textarea v-model="form.help.intro[currentLang]" rows="3" /></div>
          <div class="space-y-2"><Label>中心提示</Label><Textarea v-model="form.help.center_hint[currentLang]" rows="2" /></div>
          <div class="space-y-2"><Label>客服提示</Label><Textarea v-model="form.help.support_hint[currentLang]" rows="2" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between"><div><CardTitle>帮助条目</CardTitle><CardDescription>最多 12 条，会按排序值展示。</CardDescription></div><Button variant="outline" @click="addHelpItem"><Plus class="mr-2 h-4 w-4" />新增条目</Button></CardHeader>
        <CardContent class="space-y-4">
          <div v-for="(item, index) in form.help.items" :key="index" class="space-y-4 rounded-lg border p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-3"><Switch v-model="item.enabled" /><span class="font-medium">条目 {{ index + 1 }}</span></div>
              <div class="flex gap-2"><Button size="sm" variant="outline" @click="moveHelpItem(index, 'up')"><ArrowUp class="h-4 w-4" /></Button><Button size="sm" variant="outline" @click="moveHelpItem(index, 'down')"><ArrowDown class="h-4 w-4" /></Button><Button size="sm" variant="destructive" @click="removeHelpItem(index)"><Trash2 class="h-4 w-4" /></Button></div>
            </div>
            <div class="grid gap-4 md:grid-cols-3"><div class="space-y-2"><Label>Key</Label><Input v-model="item.key" placeholder="shop" /></div><div class="space-y-2"><Label>排序</Label><Input v-model.number="item.order" type="number" /></div><div class="flex items-center gap-3 rounded-lg border p-3"><Switch v-model="item.show_support_link" /><Label>显示客服链接</Label></div></div>
            <div class="space-y-2"><Label>摘要</Label><Input v-model="item.summary[currentLang]" /></div>
            <div class="space-y-2"><Label>标题</Label><Input v-model="item.title[currentLang]" /></div>
            <div class="space-y-2"><Label>内容</Label><Textarea v-model="item.content[currentLang]" rows="5" /></div>
          </div>
          <p v-if="!form.help.items.length" class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">暂无帮助条目</p>
        </CardContent>
      </Card>
    </div>

    <!-- ===== 菜单设置 ===== -->
    <div v-show="activeTab === 'menu'" class="space-y-6">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between"><div><CardTitle>菜单项</CardTitle><CardDescription>Discord Bot 会读取这些配置用于帮助提示和指令注册。</CardDescription></div><Button variant="outline" @click="addMenuItem"><Plus class="mr-2 h-4 w-4" />新增菜单</Button></CardHeader>
        <CardContent class="space-y-4">
          <div v-for="(item, index) in form.menu.items" :key="index" class="space-y-4 rounded-lg border p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-3"><Switch v-model="item.enabled" /><span class="font-medium">菜单 {{ index + 1 }}</span></div>
              <div class="flex gap-2"><Button size="sm" variant="outline" @click="moveMenuItem(index, 'up')"><ArrowUp class="h-4 w-4" /></Button><Button size="sm" variant="outline" @click="moveMenuItem(index, 'down')"><ArrowDown class="h-4 w-4" /></Button><Button size="sm" variant="destructive" @click="removeMenuItem(index)"><Trash2 class="h-4 w-4" /></Button></div>
            </div>
            <div class="grid gap-4 md:grid-cols-4"><div class="space-y-2"><Label>Key</Label><Input v-model="item.key" placeholder="shop_home" /></div><div class="space-y-2"><Label>排序</Label><Input v-model.number="item.order" type="number" /></div><div class="space-y-2"><Label>动作类型</Label><Select v-model="item.action.type"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="type in menuActionTypes" :key="type" :value="type">{{ type }}</SelectItem></SelectContent></Select></div><div class="space-y-2"><Label>动作值</Label><Input v-model="item.action.value" placeholder="/shop 或 https://..." /></div></div>
            <div class="space-y-2"><Label>菜单名称 {{ currentLang }}</Label><Input v-model="item.label[currentLang]" placeholder="🛍️ 商品列表" /></div>
          </div>
          <p v-if="!form.menu.items.length" class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">暂无菜单项</p>
        </CardContent>
      </Card>
    </div>

    <!-- ===== 全部词条 ===== -->
    <div v-show="activeTab === 'texts'" class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>全部交互词条 <span class="ml-2 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">{{ currentLang }}</span></CardTitle>
          <CardDescription>Bot 用到的每一条文案都可在此逐条设置（共 {{ botTextCatalog.length }} 条）。留空则使用系统默认文案。带 %s/%d 的为占位符，请保留。</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- 搜索 + 分组筛选 -->
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div class="relative flex-1">
              <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input v-model="textSearch" placeholder="搜索词条 key 或默认文案…" class="pl-9" />
            </div>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="g in textGroupOptions"
                :key="g"
                class="rounded-md border px-2.5 py-1 text-xs transition-colors"
                :class="textGroup === g ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'"
                @click="textGroup = g"
              >{{ g }}</button>
            </div>
          </div>

          <!-- 词条列表 -->
          <div class="space-y-3">
            <div
              v-for="entry in filteredTextEntries"
              :key="entry.key"
              class="grid gap-3 rounded-lg border p-3 md:grid-cols-[220px_minmax(0,1fr)] md:items-start"
            >
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="rounded bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">{{ entry.group }}</span>
                </div>
                <code class="block break-all text-xs text-muted-foreground">{{ entry.key }}</code>
                <p class="text-xs text-muted-foreground">默认：{{ entry.def }}</p>
              </div>
              <Input
                :model-value="form.panel.interaction_texts[entry.key]?.[currentLang] ?? ''"
                :placeholder="entry.def"
                @update:model-value="(v: string | number) => { ensureText(entry.key)[currentLang] = String(v) }"
              />
            </div>
            <p v-if="!filteredTextEntries.length" class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">没有匹配的词条</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- ===== 流程浏览 ===== -->
    <div v-show="activeTab === 'flow'" class="space-y-4">
      <p class="text-sm text-muted-foreground">
        选择一个面板入口，查看用户点击后会经历的交互步骤。按钮名称取自当前语言（{{ currentLang }}）下你配置的文案，编辑后实时同步。
      </p>
      <div class="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <!-- 入口列表：每个入口可展开成子选项（步骤），点子选项看对应功能 -->
        <div class="flex flex-col gap-1">
          <template v-for="flow in flows" :key="flow.key">
            <button
              class="flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors"
              :class="activeFlow === flow.key ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'"
              @click="selectFlowStep(flow.key, 0)"
            >
              <span class="flex items-center gap-2">
                <ChevronDown class="h-4 w-4 transition-transform" :class="activeFlow === flow.key ? '' : '-rotate-90'" />
                {{ flow.entry }}
              </span>
              <span class="rounded-full bg-muted px-2 py-0.5 text-xs">{{ flow.steps.length }}</span>
            </button>
            <!-- 子选项：该入口的每个步骤/功能 -->
            <div v-show="activeFlow === flow.key" class="ml-4 flex flex-col gap-1 border-l pl-3 py-1">
              <button
                v-for="(step, idx) in flow.steps"
                :key="idx"
                class="flex items-center gap-2 rounded-md px-3 py-2 text-left text-xs transition-colors"
                :class="activeFlow === flow.key && activeStep === idx ? 'bg-secondary font-medium text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'"
                @click="selectFlowStep(flow.key, idx)"
              >
                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{{ idx + 1 }}</span>
                <span class="truncate">{{ step.label }}</span>
              </button>
            </div>
          </template>
        </div>

        <!-- 选中子选项对应的功能详情 -->
        <Card v-if="currentFlow && currentStep" class="h-fit">
          <CardHeader>
            <CardTitle class="flex flex-wrap items-center gap-2">
              <span class="rounded-md px-3 py-1 text-sm" :class="currentFlow.color">{{ currentFlow.entry }}</span>
              <span class="text-muted-foreground">›</span>
              <span class="text-base">{{ currentStep.label }}</span>
            </CardTitle>
            <CardDescription>第 {{ activeStep + 1 }} / {{ currentFlow.steps.length }} 步 — 此功能的说明与可用操作。</CardDescription>
          </CardHeader>
          <CardContent class="space-y-5">
            <div>
              <div class="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">功能说明</div>
              <p class="text-sm leading-relaxed">{{ currentStep.detail }}</p>
            </div>
            <div v-if="currentStep.actions?.length">
              <div class="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <ArrowDownToLine class="h-3.5 w-3.5" />可用操作 / 下一步
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(act, ai) in currentStep.actions"
                  :key="ai"
                  class="rounded-md border bg-muted/50 px-2.5 py-1 text-xs text-foreground"
                >{{ act }}</span>
              </div>
            </div>
            <!-- 在整个流程中的位置 -->
            <div class="border-t pt-4">
              <div class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">在完整流程中的位置</div>
              <div class="flex flex-wrap items-center gap-1.5 text-xs">
                <template v-for="(step, idx) in currentFlow.steps" :key="idx">
                  <button
                    class="rounded px-2 py-1 transition-colors"
                    :class="idx === activeStep ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:text-foreground'"
                    @click="activeStep = idx"
                  >{{ idx + 1 }}. {{ step.label }}</button>
                  <span v-if="idx < currentFlow.steps.length - 1" class="text-muted-foreground">→</span>
                </template>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
