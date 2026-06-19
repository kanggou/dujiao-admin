<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { adminAPI } from '@/api/admin'
import type { AdminDiscordBroadcastUser } from '@/api/types'
import { notifyError, notifySuccess } from '@/utils/notify'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Loader2, Send } from 'lucide-vue-next'

const router = useRouter()
const submitting = ref(false)
const loadingUsers = ref(false)
const users = ref<AdminDiscordBroadcastUser[]>([])
const selectedUserIds = ref<number[]>([])
const pagination = ref({ page: 1, page_size: 20, total: 0, total_page: 1 })
const userKeyword = ref('')
const form = reactive({
  title: '',
  recipient_type: 'all',
  message_html: '',
  attachment_url: '',
  attachment_name: '',
})

const isSpecific = computed(() => form.recipient_type === 'specific')

const fetchUsers = async (page = 1) => {
  loadingUsers.value = true
  try {
    const res = await adminAPI.getDiscordBroadcastUsers({
      page,
      page_size: pagination.value.page_size,
      keyword: userKeyword.value || undefined,
    })
    users.value = res.data?.data || []
    pagination.value = res.data?.pagination || pagination.value
  } finally {
    loadingUsers.value = false
  }
}

const toggleUser = (id: number, checked: boolean) => {
  selectedUserIds.value = checked
    ? Array.from(new Set([...selectedUserIds.value, id]))
    : selectedUserIds.value.filter((value) => value !== id)
}

const handleToggleUser = (id: number, value: boolean | 'indeterminate') => {
  toggleUser(id, value === true)
}

const submit = async () => {
  if (!form.title.trim()) return notifyError('请输入群发标题')
  if (!form.message_html.trim()) return notifyError('请输入群发内容')
  if (isSpecific.value && !selectedUserIds.value.length) return notifyError('请选择至少一个 Discord 用户')

  submitting.value = true
  try {
    await adminAPI.createDiscordBroadcast({
      title: form.title,
      recipient_type: form.recipient_type,
      user_ids: isSpecific.value ? selectedUserIds.value : [],
      attachment_url: form.attachment_url,
      attachment_name: form.attachment_name,
      message_html: form.message_html,
    })
    notifySuccess('Discord 群发任务已创建')
    router.push('/discord-bot/broadcasts')
  } catch (err: any) {
    notifyError(err?.response?.data?.message || err?.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

onMounted(fetchUsers)
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
        <h2 class="text-2xl font-bold tracking-tight">新建 Discord 群发</h2>
        <p class="text-muted-foreground">消息会通过 Discord Bot 私信发送给用户。</p>
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>群发内容</CardTitle>
        <CardDescription>请不要在公开频道群发卡密，系统默认使用私信。</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label>标题</Label>
          <Input v-model="form.title" placeholder="例如：新品上架通知" />
        </div>
        <div class="space-y-2">
          <Label>接收对象</Label>
          <Select v-model="form.recipient_type">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有使用过 Discord Bot 的用户</SelectItem>
              <SelectItem value="specific">指定用户</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label>消息内容</Label>
          <Textarea v-model="form.message_html" rows="8" placeholder="支持普通文本和 Discord Markdown，例如 **加粗**、链接等。" />
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label>附件链接</Label>
            <Input v-model="form.attachment_url" placeholder="https://..." />
          </div>
          <div class="space-y-2">
            <Label>附件名称</Label>
            <Input v-model="form.attachment_name" placeholder="活动图 / 说明文档" />
          </div>
        </div>
      </CardContent>
    </Card>

    <Card v-if="isSpecific">
      <CardHeader>
        <CardTitle>选择 Discord 用户</CardTitle>
        <CardDescription>只显示已经使用过 Discord Bot 的用户。</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex gap-2">
          <Input v-model="userKeyword" placeholder="搜索昵称、用户名、Discord ID" @keyup.enter="fetchUsers(1)" />
          <Button variant="outline" @click="fetchUsers(1)">搜索</Button>
        </div>
        <div class="rounded-lg border">
          <div v-if="loadingUsers" class="p-6 text-center">
            <Loader2 class="mx-auto h-5 w-5 animate-spin" />
          </div>
          <div v-else-if="!users.length" class="p-6 text-center text-sm text-muted-foreground">暂无用户</div>
          <label v-for="user in users" :key="user.user_id" class="flex cursor-pointer items-center gap-3 border-b p-3 last:border-b-0">
            <Checkbox :checked="selectedUserIds.includes(user.user_id)" @update:checked="handleToggleUser(user.user_id, $event)" />
            <div class="min-w-0 flex-1">
              <p class="font-medium">{{ user.display_name || user.discord_username || user.discord_user_id }}</p>
              <p class="text-xs text-muted-foreground">{{ user.discord_username }}｜{{ user.discord_user_id }}</p>
            </div>
          </label>
        </div>
        <p class="text-sm text-muted-foreground">已选择 {{ selectedUserIds.length }} 人</p>
      </CardContent>
    </Card>

    <div class="flex justify-end">
      <Button :disabled="submitting" @click="submit">
        <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
        <Send v-else class="mr-2 h-4 w-4" />创建并发送
      </Button>
    </div>
  </div>
</template>
