<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { adminAPI } from '@/api/admin'
import type { AdminDiscordBotRuntimeStatus } from '@/api/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/utils/format'
import { RefreshCw, Wifi, WifiOff } from 'lucide-vue-next'

const loading = ref(false)
const status = ref<AdminDiscordBotRuntimeStatus | null>(null)
const connected = computed(() => status.value?.connected === true)
const fmt = (v?: string) => v ? (formatDate(v) || v) : '-'
const fetchStatus = async () => { loading.value = true; try { const res = await adminAPI.getDiscordBotRuntimeStatus(); status.value = res.data?.data ?? null } finally { loading.value = false } }
onMounted(fetchStatus)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 class="text-2xl font-bold tracking-tight">Discord Bot 连接状态</h2><p class="text-muted-foreground">查看 Bot 进程、网关连接、配置同步和告警信息。</p></div>
      <Button variant="outline" :disabled="loading" @click="fetchStatus"><RefreshCw class="mr-2 h-4 w-4" :class="loading ? 'animate-spin' : ''" />刷新</Button>
    </div>

    <Card>
      <CardHeader class="flex flex-row items-start justify-between gap-4">
        <div><CardTitle>运行状态</CardTitle><CardDescription>Bot 每 60 秒向后端上报一次心跳。</CardDescription></div>
        <Badge :variant="connected ? 'default' : 'secondary'" class="gap-1"><Wifi v-if="connected" class="h-3.5 w-3.5" /><WifiOff v-else class="h-3.5 w-3.5" />{{ connected ? '已连接' : '未连接' }}</Badge>
      </CardHeader>
      <CardContent class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div class="rounded-lg border p-4"><p class="text-sm text-muted-foreground">Bot 版本</p><p class="mt-1 font-medium">{{ status?.bot_version || '-' }}</p></div>
        <div class="rounded-lg border p-4"><p class="text-sm text-muted-foreground">网关状态</p><p class="mt-1 font-medium">{{ status?.webhook_status || '-' }}</p></div>
        <div class="rounded-lg border p-4"><p class="text-sm text-muted-foreground">机器码</p><p class="mt-1 font-medium">{{ status?.machine_code || '-' }}</p></div>
        <div class="rounded-lg border p-4"><p class="text-sm text-muted-foreground">最后在线</p><p class="mt-1 font-medium">{{ fmt(status?.last_seen_at) }}</p></div>
        <div class="rounded-lg border p-4"><p class="text-sm text-muted-foreground">配置版本</p><p class="mt-1 font-medium">v{{ status?.config_version ?? 0 }}</p></div>
        <div class="rounded-lg border p-4"><p class="text-sm text-muted-foreground">最后同步配置</p><p class="mt-1 font-medium">{{ fmt(status?.last_config_sync_at) }}</p></div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>告警信息</CardTitle><CardDescription>如果 Bot 启动、鉴权、注册指令或同步配置异常，会在这里显示。</CardDescription></CardHeader>
      <CardContent>
        <div v-if="status?.warnings?.length" class="space-y-2"><p v-for="warning in status.warnings" :key="warning" class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">{{ warning }}</p></div>
        <p v-else class="text-sm text-muted-foreground">暂无告警。</p>
      </CardContent>
    </Card>
  </div>
</template>
