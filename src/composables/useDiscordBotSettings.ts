import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminAPI } from '@/api/admin'
import { notifyError, notifySuccess } from '@/utils/notify'

const supportedLanguages = ['en-US', 'zh-TW', 'es-ES'] as const
type SupportedLanguage = (typeof supportedLanguages)[number]
type LocalizedText = Record<SupportedLanguage, string>
type MenuActionType = 'builtin' | 'url' | 'web_app' | 'command'

interface MenuItem {
  key: string
  enabled: boolean
  order: number
  label: LocalizedText
  action: {
    type: MenuActionType
    value: string
  }
}

interface HelpItem {
  key: string
  enabled: boolean
  order: number
  summary: LocalizedText
  title: LocalizedText
  content: LocalizedText
  show_support_link: boolean
}

interface PanelTemplate {
  enabled: boolean
  panel_locales: string[]
  show_quick_select: boolean
  show_important: boolean
  show_refresh_button: boolean
  show_support_button: boolean
  title: LocalizedText
  intro: LocalizedText
  shop_section_title: LocalizedText
  shop_section_body: LocalizedText
  important_title: LocalizedText
  important_body: LocalizedText
  shop_button_label: LocalizedText
  order_button_label: LocalizedText
  account_button_label: LocalizedText
  wallet_button_label: LocalizedText
  help_button_label: LocalizedText
  language_button_label: LocalizedText
  refresh_button_label: LocalizedText
  support_button_label: LocalizedText
  quick_placeholder: LocalizedText
  quick_shop_label: LocalizedText
  quick_shop_desc: LocalizedText
  quick_order_label: LocalizedText
  quick_order_desc: LocalizedText
  quick_help_label: LocalizedText
  quick_help_desc: LocalizedText
  interaction_texts: Record<string, LocalizedText>
}

interface DiscordBotSettingsForm {
  enabled: boolean
  default_locale: SupportedLanguage
  basic: {
    display_name: string
    description: LocalizedText
    support_url: string
    cover_url: string
  }
  welcome: {
    enabled: boolean
    message: LocalizedText
  }
  help: {
    enabled: boolean
    title: LocalizedText
    intro: LocalizedText
    center_hint: LocalizedText
    support_hint: LocalizedText
    items: HelpItem[]
  }
  menu: {
    items: MenuItem[]
  }
  panel: PanelTemplate
  channel_binding: {
    guild_id: string
    channel_id: string
    notify_channel_id: string
    panel_channel_id: string
    public_site_url: string
  }
  panel_appearance: {
    render_mode: 'text' | 'embed' | 'v2'
    theme_color: string
    title_style: 'plain' | 'h1' | 'h2' | 'bold'
    divider_style: 'none' | 'line' | 'v2'
    section_order: string[]
    show_title: boolean
    show_intro: boolean
    show_shop: boolean
    show_important: boolean
    show_thumbnail: boolean
    footer_text: LocalizedText
  }
}

const menuActionTypes: MenuActionType[] = ['builtin', 'url', 'web_app', 'command']
const menuItemsMaxCount = 20
const helpItemsMaxCount = 12

const emptyLocalized = (): LocalizedText => ({
  'en-US': '',
  'zh-TW': '',
  'es-ES': '',
})

// 历史调用约定: localized(简中文案, 繁中文案, 英文文案)。
// 现仅保留 英/繁中/西 三语,简中入参不再单独存储:英文取第三参(回落第一参),
// 繁中取第二参,西语留空(运行时回落英文)。
const localized = (zhCN: string, zhTW = zhCN, enUS = zhCN): LocalizedText => ({
  'en-US': enUS,
  'zh-TW': zhTW,
  'es-ES': '',
})

const createMenuItem = (): MenuItem => ({
  key: '',
  enabled: true,
  order: 0,
  label: emptyLocalized(),
  action: { type: 'builtin', value: '' },
})

const createHelpItem = (): HelpItem => ({
  key: '',
  enabled: true,
  order: 0,
  summary: emptyLocalized(),
  title: emptyLocalized(),
  content: emptyLocalized(),
  show_support_link: false,
})


const createInteractionTexts = (): Record<string, LocalizedText> => ({
  product_list_title: localized('🛍️ 商品列表', '🛍️ 商品列表', '🛍️ Product List'),
  product_list_empty: localized('没有找到商品。', '沒有找到商品。', 'No products found.'),
  product_list_choose: localized('请选择下方商品查看详情。', '請選擇下方商品查看詳情。', 'Select a product below to view details.'),
  product_select_placeholder: localized('选择商品查看详情 / Select a product', '選擇商品查看詳情 / Select a product', 'Select a product'),
  sku_select_placeholder: localized('选择规格 / Select SKU', '選擇規格 / Select SKU', 'Select SKU'),
  buy_quantity_button: localized('填写数量购买 / Buy', '填寫數量購買 / Buy', 'Enter Quantity / Buy'),
  back_button: localized('返回', '返回', 'Back'),
  back_product_list_button: localized('返回商品列表', '返回商品列表', 'Back to Products'),
  order_lookup_button: localized('查询订单', '查詢訂單', 'Order Lookup'),
  prev_page_button: localized('上一页', '上一頁', 'Previous'),
  next_page_button: localized('下一页', '下一頁', 'Next'),
  order_modal_title: localized('查询订单 / Order Lookup', '查詢訂單 / Order Lookup', 'Order Lookup'),
  order_modal_label: localized('订单号 / Order No.', '訂單號 / Order No.', 'Order No.'),
  order_modal_placeholder: localized('请输入订单号', '請輸入訂單號', 'Enter order number'),
  quantity_modal_title: localized('填写购买数量 / Quantity', '填寫購買數量 / Quantity', 'Quantity'),
  quantity_modal_label: localized('购买数量 / Quantity', '購買數量 / Quantity', 'Quantity'),
  profile_required: localized('⚠️ 请先绑定邮箱与查询密码。提交后系统会自动创建/绑定站内用户并自动通过邮箱验证，之后通过 Bot 创建的订单会归属到这个用户。', '⚠️ 請先綁定信箱與查詢密碼。提交後系統會自動建立/綁定站內使用者並自動通過信箱驗證，之後透過 Bot 建立的訂單會歸屬到此使用者。', '⚠️ Please bind your email and order lookup password first. The system will create/bind your account and verify the email automatically.'),
  profile_edit_button: localized('设置/修改邮箱与查询密码', '設定/修改信箱與查詢密碼', 'Set / Edit Email & Password'),
  profile_language_button: localized('语言 / Language', '語言 / Language', 'Language'),
  language_title: localized('🌐 语言设置 / Language', '🌐 語言設定 / Language', '🌐 Language'),
  language_placeholder: localized('选择语言 / Choose language', '選擇語言 / Choose language', 'Choose language'),
  wallet_title: localized('💰 我的钱包', '💰 我的錢包', '💰 My Wallet'),
  wallet_recharge_title: localized('钱包充值 / Wallet Recharge', '錢包充值 / Wallet Recharge', 'Wallet Recharge'),
})

const createPanelTemplate = (): PanelTemplate => ({
  enabled: true,
  panel_locales: ['en-US', 'zh-TW', 'es-ES'],
  show_quick_select: false,
  show_important: true,
  show_refresh_button: false,
  show_support_button: false,
  title: localized('🛒 Discord 商品服务中心', '🛒 Discord 商品服務中心', '🛒 Discord Shop Center'),
  intro: localized('选择下方功能即可完成购买、查单、账号设置、钱包充值和客服咨询。', '選擇下方功能即可完成購買、查單、帳號設定、錢包充值和客服諮詢。', 'Choose an action below to shop, check orders, manage account, recharge wallet, or contact support.'),
  shop_section_title: localized('🧭 快速入口', '🧭 快速入口', '🧭 Quick Actions'),
  shop_section_body: localized('🛒 购买商品｜📦 我的订单｜👤 账号设置｜💰 钱包充值｜💬 帮助客服｜🌐 语言选择', '🛒 購買商品｜📦 我的訂單｜👤 帳號設定｜💰 錢包充值｜💬 幫助客服｜🌐 語言選擇', '🛒 Buy｜📦 Orders｜👤 Account｜💰 Wallet｜💬 Help｜🌐 Language'),
  important_title: localized('⚠️ Important / 重要', '⚠️ Important / 重要', '⚠️ Important'),
  important_body: localized('支付链接、订单状态、钱包充值和发卡内容会通过私密回复通知。', '付款連結、訂單狀態、錢包充值和發卡內容會透過私密回覆通知。', 'Payment links, order status, wallet recharge, and delivery are sent privately.'),
  shop_button_label: localized('🛒 购买商品', '🛒 購買商品', '🛒 Buy'),
  order_button_label: localized('📦 我的订单', '📦 我的訂單', '📦 Orders'),
  account_button_label: localized('👤 账号设置', '👤 帳號設定', '👤 Account'),
  wallet_button_label: localized('💰 钱包充值', '💰 錢包充值', '💰 Wallet'),
  help_button_label: localized('💬 帮助客服', '💬 幫助客服', '💬 Help'),
  language_button_label: localized('🌐 语言选择', '🌐 語言選擇', '🌐 Language'),
  refresh_button_label: localized('刷新面板 / Refresh', '刷新面板 / Refresh', 'Refresh'),
  support_button_label: localized('联系客服 / Support', '聯繫客服 / Support', 'Support'),
  quick_placeholder: localized('快捷功能 / Quick Actions', '快捷功能 / Quick Actions', 'Quick Actions'),
  quick_shop_label: localized('浏览商品 / Browse Products', '瀏覽商品 / Browse Products', 'Browse Products'),
  quick_shop_desc: localized('查看商品列表并选择商品', '查看商品列表並選擇商品', 'View product list and choose an item'),
  quick_order_label: localized('查询订单 / Order Lookup', '查詢訂單 / Order Lookup', 'Order Lookup'),
  quick_order_desc: localized('输入订单号查询状态和发卡内容', '輸入訂單號查詢狀態和發卡內容', 'Enter order number to check status and delivery'),
  quick_help_label: localized('帮助中心 / Help Center', '幫助中心 / Help Center', 'Help Center'),
  quick_help_desc: localized('查看下单、支付和客服说明', '查看下單、付款和客服說明', 'Ordering, payment, and support help'),
  interaction_texts: createInteractionTexts(),
})

const createDiscordBotSettingsForm = (): DiscordBotSettingsForm => ({
  enabled: false,
  default_locale: 'en-US',
  basic: {
    display_name: '',
    description: emptyLocalized(),
    support_url: '',
    cover_url: '',
  },
  welcome: {
    enabled: false,
    message: emptyLocalized(),
  },
  help: {
    enabled: true,
    title: emptyLocalized(),
    intro: emptyLocalized(),
    center_hint: emptyLocalized(),
    support_hint: emptyLocalized(),
    items: [],
  },
  menu: {
    items: [],
  },
  panel: createPanelTemplate(),
  channel_binding: {
    guild_id: '',
    channel_id: '',
    notify_channel_id: '',
    panel_channel_id: '',
    public_site_url: '',
  },
  panel_appearance: {
    render_mode: 'text',
    theme_color: '#5865F2',
    title_style: 'bold',
    divider_style: 'line',
    section_order: ['title', 'intro', 'shop', 'important'],
    show_title: true,
    show_intro: true,
    show_shop: true,
    show_important: true,
    show_thumbnail: false,
    footer_text: emptyLocalized(),
  },
})

const parseLocalized = (raw: unknown, fallback: LocalizedText = emptyLocalized()): LocalizedText => {
  const result = { ...fallback }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>
    for (const lang of supportedLanguages) {
      if (typeof obj[lang] === 'string') {
        result[lang] = obj[lang]
      }
    }
  }
  return result
}

const parseMenuItem = (raw: unknown): MenuItem => {
  const item = createMenuItem()
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return item

  const obj = raw as Record<string, unknown>
  if (typeof obj.key === 'string') item.key = obj.key
  if (typeof obj.enabled === 'boolean') item.enabled = obj.enabled
  if (typeof obj.order === 'number') item.order = obj.order
  item.label = parseLocalized(obj.label)

  if (obj.action && typeof obj.action === 'object' && !Array.isArray(obj.action)) {
    const action = obj.action as Record<string, unknown>
    if (action.type === 'builtin' || action.type === 'url' || action.type === 'web_app' || action.type === 'command') {
      item.action.type = action.type
    }
    if (typeof action.value === 'string') {
      item.action.value = action.value
    }
  }

  return item
}

const parseHelpItem = (raw: unknown): HelpItem => {
  const item = createHelpItem()
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return item

  const obj = raw as Record<string, unknown>
  if (typeof obj.key === 'string') item.key = obj.key
  if (typeof obj.enabled === 'boolean') item.enabled = obj.enabled
  if (typeof obj.order === 'number') item.order = obj.order
  if (typeof obj.show_support_link === 'boolean') item.show_support_link = obj.show_support_link
  item.summary = parseLocalized(obj.summary)
  item.title = parseLocalized(obj.title)
  item.content = parseLocalized(obj.content)

  return item
}

const parsePanelTemplate = (raw: unknown): PanelTemplate => {
  const panel = createPanelTemplate()
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return panel
  const obj = raw as Record<string, unknown>
  if (typeof obj.enabled === 'boolean') panel.enabled = obj.enabled
  if (Array.isArray(obj.panel_locales)) panel.panel_locales = obj.panel_locales.filter((l): l is string => typeof l === 'string')
  if (typeof obj.show_quick_select === 'boolean') panel.show_quick_select = obj.show_quick_select
  if (typeof obj.show_important === 'boolean') panel.show_important = obj.show_important
  if (typeof obj.show_refresh_button === 'boolean') panel.show_refresh_button = obj.show_refresh_button
  if (typeof obj.show_support_button === 'boolean') panel.show_support_button = obj.show_support_button
  panel.title = parseLocalized(obj.title, panel.title)
  panel.intro = parseLocalized(obj.intro, panel.intro)
  panel.shop_section_title = parseLocalized(obj.shop_section_title, panel.shop_section_title)
  panel.shop_section_body = parseLocalized(obj.shop_section_body, panel.shop_section_body)
  panel.important_title = parseLocalized(obj.important_title, panel.important_title)
  panel.important_body = parseLocalized(obj.important_body, panel.important_body)
  panel.shop_button_label = parseLocalized(obj.shop_button_label, panel.shop_button_label)
  panel.order_button_label = parseLocalized(obj.order_button_label, panel.order_button_label)
  panel.help_button_label = parseLocalized(obj.help_button_label, panel.help_button_label)
  panel.account_button_label = parseLocalized(obj.account_button_label, panel.account_button_label)
  panel.wallet_button_label = parseLocalized(obj.wallet_button_label, panel.wallet_button_label)
  panel.language_button_label = parseLocalized(obj.language_button_label, panel.language_button_label)
  panel.refresh_button_label = parseLocalized(obj.refresh_button_label, panel.refresh_button_label)
  panel.support_button_label = parseLocalized(obj.support_button_label, panel.support_button_label)
  panel.quick_placeholder = parseLocalized(obj.quick_placeholder, panel.quick_placeholder)
  panel.quick_shop_label = parseLocalized(obj.quick_shop_label, panel.quick_shop_label)
  panel.quick_shop_desc = parseLocalized(obj.quick_shop_desc, panel.quick_shop_desc)
  panel.quick_order_label = parseLocalized(obj.quick_order_label, panel.quick_order_label)
  panel.quick_order_desc = parseLocalized(obj.quick_order_desc, panel.quick_order_desc)
  panel.quick_help_label = parseLocalized(obj.quick_help_label, panel.quick_help_label)
  panel.quick_help_desc = parseLocalized(obj.quick_help_desc, panel.quick_help_desc)
  if (obj.interaction_texts && typeof obj.interaction_texts === 'object' && !Array.isArray(obj.interaction_texts)) {
    const rawTexts = obj.interaction_texts as Record<string, unknown>
    for (const [key, value] of Object.entries(rawTexts)) {
      panel.interaction_texts[key] = parseLocalized(value, panel.interaction_texts[key] || emptyLocalized())
    }
  }
  return panel
}

export function useDiscordBotSettings() {
  const { t } = useI18n()

  const currentLang = ref<SupportedLanguage>('en-US')
  const loading = ref(false)
  const saving = ref(false)
  const uploadingCover = ref(false)
  const coverFileInput = ref<HTMLInputElement>()
  const form = ref<DiscordBotSettingsForm>(createDiscordBotSettingsForm())

  const languages = computed(() => [
    { code: 'en-US' as SupportedLanguage, name: t('admin.common.lang.enUS') },
    { code: 'zh-TW' as SupportedLanguage, name: t('admin.common.lang.zhTW') },
    { code: 'es-ES' as SupportedLanguage, name: t('admin.common.lang.esES') },
  ])

  const fetchConfig = async () => {
    loading.value = true
    try {
      form.value = createDiscordBotSettingsForm()

      const res = await adminAPI.getDiscordBotSettings()
      const data = res.data?.data as Record<string, unknown> | undefined
      if (!data) {
        return
      }

      form.value.enabled = (data.enabled as boolean) ?? false
      form.value.default_locale = (data.default_locale as SupportedLanguage) ?? 'zh-CN'

      const basic = data.basic as Record<string, unknown> | undefined
      if (basic) {
        form.value.basic.display_name = (basic.display_name as string) ?? ''
        form.value.basic.description = parseLocalized(basic.description)
        form.value.basic.support_url = (basic.support_url as string) ?? ''
        form.value.basic.cover_url = (basic.cover_url as string) ?? ''
      }

      const welcome = data.welcome as Record<string, unknown> | undefined
      if (welcome) {
        form.value.welcome.enabled = (welcome.enabled as boolean) ?? false
        form.value.welcome.message = parseLocalized(welcome.message)
      }

      const help = data.help as Record<string, unknown> | undefined
      if (help) {
        form.value.help.enabled = (help.enabled as boolean) ?? true
        form.value.help.title = parseLocalized(help.title)
        form.value.help.intro = parseLocalized(help.intro)
        form.value.help.center_hint = parseLocalized(help.center_hint)
        form.value.help.support_hint = parseLocalized(help.support_hint)
        if (Array.isArray(help.items)) {
          form.value.help.items = help.items.map(parseHelpItem)
        }
      }

      const menu = data.menu as Record<string, unknown> | undefined
      if (menu && Array.isArray(menu.items)) {
        form.value.menu.items = menu.items.map(parseMenuItem)
      }

      form.value.panel = parsePanelTemplate(data.panel)

      const cb = data.channel_binding as Record<string, unknown> | undefined
      if (cb) {
        form.value.channel_binding = {
          guild_id: (cb.guild_id as string) ?? '',
          channel_id: (cb.channel_id as string) ?? '',
          notify_channel_id: (cb.notify_channel_id as string) ?? '',
          panel_channel_id: (cb.panel_channel_id as string) ?? '',
          public_site_url: (cb.public_site_url as string) ?? '',
        }
      }

      const ap = data.panel_appearance as Record<string, unknown> | undefined
      if (ap) {
        const def = form.value.panel_appearance
        const order = Array.isArray(ap.section_order)
          ? (ap.section_order as unknown[]).filter((s): s is string => typeof s === 'string')
          : def.section_order
        form.value.panel_appearance = {
          render_mode: (ap.render_mode as 'text' | 'embed' | 'v2') || def.render_mode,
          theme_color: (ap.theme_color as string) || def.theme_color,
          title_style: (ap.title_style as 'plain' | 'h1' | 'h2' | 'bold') || def.title_style,
          divider_style: (ap.divider_style as 'none' | 'line' | 'v2') || def.divider_style,
          section_order: order.length ? order : def.section_order,
          show_title: (ap.show_title as boolean) ?? def.show_title,
          show_intro: (ap.show_intro as boolean) ?? def.show_intro,
          show_shop: (ap.show_shop as boolean) ?? def.show_shop,
          show_important: (ap.show_important as boolean) ?? def.show_important,
          show_thumbnail: (ap.show_thumbnail as boolean) ?? def.show_thumbnail,
          footer_text: parseLocalized(ap.footer_text),
        }
      }
    } catch {
      notifyError(t('discordBot.settings.loadFailed'))
    } finally {
      loading.value = false
    }
  }

  const saveConfig = async () => {
    saving.value = true
    try {
      await adminAPI.updateDiscordBotSettings({
        ...form.value,
      })
      notifySuccess(t('discordBot.settings.saveSuccess'))
    } catch {
      notifyError(t('discordBot.settings.saveFailed'))
    } finally {
      saving.value = false
    }
  }

  const handleUploadCover = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return

    uploadingCover.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await adminAPI.upload(formData, 'discord')
      const url = (res.data.data as Record<string, string>)?.url || ''
      form.value.basic.cover_url = url
    } catch {
      notifyError(t('discordBot.settings.uploadFailed'))
    } finally {
      uploadingCover.value = false
      if (coverFileInput.value) {
        coverFileInput.value.value = ''
      }
    }
  }

  const addMenuItem = () => {
    if (form.value.menu.items.length >= menuItemsMaxCount) {
      notifyError(t('discordBot.settings.menuMaxHint', { max: menuItemsMaxCount }))
      return
    }
    form.value.menu.items.push(createMenuItem())
  }

  const removeMenuItem = (index: number) => {
    form.value.menu.items.splice(index, 1)
  }

  const moveMenuItem = (index: number, direction: 'up' | 'down') => {
    const items = form.value.menu.items
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return
    ;[items[index], items[targetIndex]] = [items[targetIndex]!, items[index]!]
  }

  const addHelpItem = () => {
    if (form.value.help.items.length >= helpItemsMaxCount) {
      notifyError(t('discordBot.settings.helpMaxHint', { max: helpItemsMaxCount }))
      return
    }
    form.value.help.items.push(createHelpItem())
  }

  const removeHelpItem = (index: number) => {
    form.value.help.items.splice(index, 1)
  }

  const moveHelpItem = (index: number, direction: 'up' | 'down') => {
    const items = form.value.help.items
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return
    ;[items[index], items[targetIndex]] = [items[targetIndex]!, items[index]!]
  }

  const resetPanelTemplate = () => {
    form.value.panel = createPanelTemplate()
  }

  const getMenuActionValuePlaceholder = (type: MenuActionType) => t(`discordBot.settings.menuActionValuePlaceholder_${type}`)

  const getMenuActionValueHint = (type: MenuActionType) => t(`discordBot.settings.menuActionValueHint_${type}`)

  return {
    coverFileInput,
    currentLang,
    fetchConfig,
    form,
    handleUploadCover,
    addHelpItem,
    addMenuItem,
    getMenuActionValueHint,
    getMenuActionValuePlaceholder,
    languages,
    loading,
    menuActionTypes,
    moveHelpItem,
    moveMenuItem,
    removeHelpItem,
    removeMenuItem,
    resetPanelTemplate,
    saveConfig,
    saving,
    uploadingCover,
  }
}
