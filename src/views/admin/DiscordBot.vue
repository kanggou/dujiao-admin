<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { adminAPI } from '@/api/admin'
import type { AdminDiscordBotRuntimeStatus } from '@/api/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/utils/format'
import { Bot, Wifi, WifiOff, Settings, ScrollText, ListOrdered, KeyRound, Send, RefreshCw, ImageIcon } from 'lucide-vue-next'

const loading = ref(false)
const runtimeStatus = ref<AdminDiscordBotRuntimeStatus | null>(null)
const connected = computed(() => runtimeStatus.value?.connected === true)

const fetchStatus = async () => {
  loading.value = true
  try {
    const res = await adminAPI.getDiscordBotRuntimeStatus()
    runtimeStatus.value = res.data?.data ?? null
  } finally {
    loading.value = false
  }
}

const fmt = (v?: string) => v ? (formatDate(v) || v) : '-'

onMounted(fetchStatus)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Discord Bot 概览</h2>
        <p class="text-muted-foreground">管理 Discord 商品发卡、支付入口、消息群发和连接状态。</p>
      </div>
      <Button :disabled="loading" variant="outline" @click="fetchStatus">
        <RefreshCw class="mr-2 h-4 w-4" :class="loading ? 'animate-spin' : ''" />刷新状态
      </Button>
    </div>

    <Card>
      <CardHeader class="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>连接状态</CardTitle>
          <CardDescription>Discord Bot 进程通过频道 API 心跳同步状态。</CardDescription>
        </div>
        <Badge :variant="connected ? 'default' : 'secondary'" class="gap-1">
          <Wifi v-if="connected" class="h-3.5 w-3.5" />
          <WifiOff v-else class="h-3.5 w-3.5" />
          {{ connected ? '已连接' : '未连接' }}
        </Badge>
      </CardHeader>
      <CardContent class="grid gap-4 md:grid-cols-4">
        <div class="rounded-lg border p-4"><p class="text-sm text-muted-foreground">Bot 版本</p><p class="mt-1 font-medium">{{ runtimeStatus?.bot_version || '-' }}</p></div>
        <div class="rounded-lg border p-4"><p class="text-sm text-muted-foreground">网关状态</p><p class="mt-1 font-medium">{{ runtimeStatus?.webhook_status || '-' }}</p></div>
        <div class="rounded-lg border p-4"><p class="text-sm text-muted-foreground">最后在线</p><p class="mt-1 font-medium">{{ fmt(runtimeStatus?.last_seen_at) }}</p></div>
        <div class="rounded-lg border p-4"><p class="text-sm text-muted-foreground">配置版本</p><p class="mt-1 font-medium">v{{ runtimeStatus?.config_version ?? 0 }}</p></div>
      </CardContent>
    </Card>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader><CardTitle class="flex items-center gap-2"><Settings class="h-5 w-5" />基础设置</CardTitle><CardDescription>名称、欢迎语、客服链接和封面。</CardDescription></CardHeader>
        <CardContent><Button as-child><RouterLink to="/discord-bot/settings">进入设置</RouterLink></Button></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle class="flex items-center gap-2"><ImageIcon class="h-5 w-5" />交互模板</CardTitle><CardDescription>修改频道 Service Hub 面板文案、按钮和下拉菜单。</CardDescription></CardHeader>
        <CardContent><Button as-child variant="outline"><RouterLink to="/discord-bot/panel-template">编辑模板</RouterLink></Button></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle class="flex items-center gap-2"><ScrollText class="h-5 w-5" />帮助中心</CardTitle><CardDescription>配置 Discord Bot 帮助文案。</CardDescription></CardHeader>
        <CardContent><Button as-child variant="outline"><RouterLink to="/discord-bot/help-center">编辑帮助</RouterLink></Button></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle class="flex items-center gap-2"><ListOrdered class="h-5 w-5" />菜单设置</CardTitle><CardDescription>配置 Bot 指令菜单展示与动作。</CardDescription></CardHeader>
        <CardContent><Button as-child variant="outline"><RouterLink to="/discord-bot/menu">编辑菜单</RouterLink></Button></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle class="flex items-center gap-2"><Bot class="h-5 w-5" />连接状态</CardTitle><CardDescription>查看 Bot 进程心跳和异常。</CardDescription></CardHeader>
        <CardContent><Button as-child variant="outline"><RouterLink to="/discord-bot/status">查看状态</RouterLink></Button></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle class="flex items-center gap-2"><KeyRound class="h-5 w-5" />Bot 客户端</CardTitle><CardDescription>管理 Channel Key、Secret 和 Bot Token。</CardDescription></CardHeader>
        <CardContent><Button as-child variant="outline"><RouterLink to="/discord-bot/channel-clients">管理客户端</RouterLink></Button></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle class="flex items-center gap-2"><Send class="h-5 w-5" />消息群发</CardTitle><CardDescription>给使用过 Discord Bot 的用户发送私信。</CardDescription></CardHeader>
        <CardContent><Button as-child variant="outline"><RouterLink to="/discord-bot/broadcasts">进入群发</RouterLink></Button></CardContent>
      </Card>
    </div>
  </div>
</template>
