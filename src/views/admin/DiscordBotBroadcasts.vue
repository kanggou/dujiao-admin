<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { adminAPI } from '@/api/admin'
import type { AdminDiscordBroadcast } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/utils/format'
import { Eye, Loader2, Send } from 'lucide-vue-next'

const loading = ref(false)
const items = ref<AdminDiscordBroadcast[]>([])
const pagination = ref({ page: 1, page_size: 20, total: 0, total_page: 1 })

const statusText = (value: string) => {
  const map: Record<string, string> = {
    pending: '等待中',
    running: '发送中',
    completed: '已完成',
    failed: '失败',
  }
  return map[String(value || '').toLowerCase()] || value
}

const recipientText = (value: string) => (value === 'specific' ? '指定用户' : '全部用户')

const fetchList = async (page = 1) => {
  loading.value = true
  try {
    const res = await adminAPI.getDiscordBroadcasts({ page, page_size: pagination.value.page_size })
    items.value = res.data?.data || []
    pagination.value = res.data?.pagination || pagination.value
  } finally {
    loading.value = false
  }
}

const changePage = (page: number) => {
  if (page >= 1 && page <= pagination.value.total_page) fetchList(page)
}

onMounted(() => fetchList())
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Discord Bot 消息群发</h2>
        <p class="text-muted-foreground">给使用过 Discord Bot 的用户发送私信消息。</p>
      </div>
      <Button as-child>
        <RouterLink to="/discord-bot/broadcasts/create">
          <Send class="mr-2 h-4 w-4" />新建群发
        </RouterLink>
      </Button>
    </div>

    <Card>
      <CardContent class="p-4">
        <div class="overflow-x-auto">
          <Table class="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>标题</TableHead>
                <TableHead>接收人</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>总数</TableHead>
                <TableHead>成功</TableHead>
                <TableHead>失败</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead class="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="loading">
                <TableCell :colspan="9" class="py-10 text-center">
                  <Loader2 class="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
              <TableRow v-else-if="!items.length">
                <TableCell :colspan="9" class="py-10 text-center text-muted-foreground">暂无群发记录</TableCell>
              </TableRow>
              <TableRow v-for="item in items" :key="item.id">
                <TableCell>{{ item.id }}</TableCell>
                <TableCell>
                  <div class="font-medium">{{ item.title }}</div>
                  <div v-if="item.last_error" class="text-xs text-destructive">{{ item.last_error }}</div>
                </TableCell>
                <TableCell>{{ recipientText(item.recipient_type) }}</TableCell>
                <TableCell><Badge variant="secondary">{{ statusText(item.status) }}</Badge></TableCell>
                <TableCell>{{ item.recipient_count }}</TableCell>
                <TableCell>{{ item.success_count }}</TableCell>
                <TableCell>{{ item.failed_count }}</TableCell>
                <TableCell>{{ formatDate(item.created_at) || '-' }}</TableCell>
                <TableCell class="text-right">
                  <Button as-child size="sm" variant="outline">
                    <RouterLink :to="`/discord-bot/broadcasts/${item.id}`">
                      <Eye class="mr-2 h-4 w-4" />详情
                    </RouterLink>
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <div class="flex items-center justify-end gap-3">
      <Button size="sm" variant="outline" :disabled="pagination.page <= 1" @click="changePage(pagination.page - 1)">上一页</Button>
      <span class="text-sm text-muted-foreground">第 {{ pagination.page }} / {{ pagination.total_page }} 页</span>
      <Button size="sm" variant="outline" :disabled="pagination.page >= pagination.total_page" @click="changePage(pagination.page + 1)">下一页</Button>
    </div>
  </div>
</template>
