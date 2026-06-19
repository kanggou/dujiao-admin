<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { adminAPI } from '@/api/admin'
import type { AdminDiscordBroadcast } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/utils/format'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'

const route = useRoute()
const loading = ref(false)
const item = ref<AdminDiscordBroadcast | null>(null)

const statusText = (value?: string) => {
  const map: Record<string, string> = {
    pending: '等待中',
    running: '发送中',
    completed: '已完成',
    failed: '失败',
  }
  return map[String(value || '').toLowerCase()] || value || '-'
}

const recipientText = (value?: string) => (value === 'specific' ? '指定用户' : '全部用户')

const fetchDetail = async () => {
  loading.value = true
  try {
    const id = Number(route.params.id)
    const res = await adminAPI.getDiscordBroadcast(id)
    item.value = res.data?.data ?? null
  } finally {
    loading.value = false
  }
}

onMounted(fetchDetail)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <Button as-child variant="outline" size="sm">
        <RouterLink to="/discord-bot/broadcasts">
          <ArrowLeft class="mr-2 h-4 w-4" />返回
        </RouterLink>
      </Button>
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Discord 群发详情</h2>
        <p class="text-muted-foreground">查看发送结果和失败原因。</p>
      </div>
    </div>

    <div v-if="loading" class="py-10 text-center">
      <Loader2 class="mx-auto h-6 w-6 animate-spin" />
    </div>

    <template v-else-if="item">
      <Card>
        <CardHeader>
          <div class="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{{ item.title }}</CardTitle>
              <CardDescription>ID：{{ item.id }}｜创建时间：{{ formatDate(item.created_at) || '-' }}</CardDescription>
            </div>
            <Badge variant="secondary">{{ statusText(item.status) }}</Badge>
          </div>
        </CardHeader>
        <CardContent class="grid gap-4 md:grid-cols-4">
          <div class="rounded-lg border p-4">
            <p class="text-sm text-muted-foreground">接收对象</p>
            <p class="mt-1 font-medium">{{ recipientText(item.recipient_type) }}</p>
          </div>
          <div class="rounded-lg border p-4">
            <p class="text-sm text-muted-foreground">总人数</p>
            <p class="mt-1 font-medium">{{ item.recipient_count }}</p>
          </div>
          <div class="rounded-lg border p-4">
            <p class="text-sm text-muted-foreground">成功</p>
            <p class="mt-1 font-medium">{{ item.success_count }}</p>
          </div>
          <div class="rounded-lg border p-4">
            <p class="text-sm text-muted-foreground">失败</p>
            <p class="mt-1 font-medium">{{ item.failed_count }}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>消息内容</CardTitle></CardHeader>
        <CardContent>
          <pre class="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">{{ item.message_html }}</pre>
          <div v-if="item.attachment_url" class="mt-4 text-sm">
            附件：
            <a class="text-primary underline" :href="item.attachment_url" target="_blank">
              {{ item.attachment_name || item.attachment_url }}
            </a>
          </div>
        </CardContent>
      </Card>

      <Card v-if="item.last_error">
        <CardHeader><CardTitle>最后错误</CardTitle></CardHeader>
        <CardContent>
          <p class="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {{ item.last_error }}
          </p>
        </CardContent>
      </Card>
    </template>

    <p v-else class="text-muted-foreground">未找到群发记录。</p>
  </div>
</template>
