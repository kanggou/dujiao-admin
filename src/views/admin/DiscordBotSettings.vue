<script setup lang="ts">
import { onMounted } from 'vue'
import { useDiscordBotSettings } from '@/composables/useDiscordBotSettings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import MediaPicker from '@/components/admin/MediaPicker.vue'
import { Loader2, Save } from 'lucide-vue-next'

const { currentLang, fetchConfig, form, languages, loading, saveConfig, saving } = useDiscordBotSettings()
onMounted(fetchConfig)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div><h2 class="text-2xl font-bold tracking-tight">Discord Bot 基础设置</h2><p class="text-muted-foreground">配置 Discord Bot 是否启用、展示信息、欢迎消息和客服入口。</p></div>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="flex rounded-lg border bg-card p-1">
          <button v-for="lang in languages" :key="lang.code" class="rounded-md px-3 py-1.5 text-xs font-medium" :class="currentLang === lang.code ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'" @click="currentLang = lang.code">{{ lang.name }}</button>
        </div>
        <Button :disabled="saving || loading" @click="saveConfig"><Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" /><Save v-else class="mr-2 h-4 w-4" />保存设置</Button>
      </div>
    </div>

    <Card>
      <CardHeader><CardTitle>全局设置</CardTitle><CardDescription>关闭后，Bot 可保留连接，但不建议继续引导用户下单。</CardDescription></CardHeader>
      <CardContent class="grid gap-4 md:grid-cols-2">
        <div class="flex items-center gap-3 rounded-lg border p-4"><Switch v-model="form.enabled" id="discord-enabled" /><Label for="discord-enabled">启用 Discord Bot</Label></div>
        <div class="space-y-2"><Label>默认语言</Label><Select v-model="form.default_locale"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en-US">English</SelectItem><SelectItem value="zh-TW">繁體中文</SelectItem><SelectItem value="es-ES">Español</SelectItem></SelectContent></Select></div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>基础信息 <span class="ml-2 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">{{ currentLang }}</span></CardTitle><CardDescription>这些内容会同步给 Discord Bot 使用。</CardDescription></CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2"><Label>显示名称</Label><Input v-model="form.basic.display_name" placeholder="例如：Dujiao Discord Bot" /></div>
        <div class="space-y-2"><Label>Bot 描述</Label><Textarea v-model="form.basic.description[currentLang]" rows="2" placeholder="介绍 Bot 能做什么" /></div>
        <div class="space-y-2"><Label>客服链接</Label><Input v-model="form.basic.support_url" placeholder="https://... 或 Discord 邀请链接" /></div>
        <div class="space-y-2"><Label>欢迎封面</Label><MediaPicker v-model="form.basic.cover_url" scene="discord" /></div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>频道绑定</CardTitle>
        <CardDescription>填写 Discord 服务器与频道 ID（纯数字）。除「服务器 ID」改动需重启 Bot 重新注册命令外，其余保存后下次同步即时生效。留空则使用默认/不限制。</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4 md:grid-cols-2">
        <div class="space-y-2"><Label>服务器 ID（Guild ID）</Label><Input v-model="form.channel_binding.guild_id" placeholder="留空=全局注册斜杠命令" /><p class="text-xs text-muted-foreground">改动需重启 Bot 生效</p></div>
        <div class="space-y-2"><Label>限制可用频道 ID</Label><Input v-model="form.channel_binding.channel_id" placeholder="留空=不限制频道" /></div>
        <div class="space-y-2"><Label>通知频道 ID</Label><Input v-model="form.channel_binding.notify_channel_id" placeholder="私信失败时发到此频道" /></div>
        <div class="space-y-2"><Label>面板发布频道 ID</Label><Input v-model="form.channel_binding.panel_channel_id" placeholder="留空=用限制频道" /></div>
        <div class="space-y-2 md:col-span-2"><Label>前台站点地址（可选）</Label><Input v-model="form.channel_binding.public_site_url" placeholder="https://your-site，用于消息中的跳转链接" /></div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>欢迎消息 <span class="ml-2 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">{{ currentLang }}</span></CardTitle><CardDescription>用户首次使用或执行帮助命令时可展示。</CardDescription></CardHeader>
      <CardContent class="space-y-4">
        <div class="flex items-center gap-3 rounded-lg border p-4"><Switch v-model="form.welcome.enabled" id="discord-welcome" /><Label for="discord-welcome">启用欢迎消息</Label></div>
        <div class="space-y-2"><Label>欢迎文案</Label><Textarea v-model="form.welcome.message[currentLang]" rows="5" placeholder="欢迎使用 Discord Bot，可输入 /shop 浏览商品。" /></div>
      </CardContent>
    </Card>
  </div>
</template>
