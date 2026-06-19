<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { adminAPI } from '@/api/admin'

const loading = ref(false)
const keyword = ref('')
const status = ref('')
const page = ref(1)
const pageSize = 20
const total = ref(0)
const items = ref<any[]>([])

async function load() {
  loading.value = true
  try {
    const res = await adminAPI.getDiscordManagedUsers({ page: page.value, page_size: pageSize, keyword: keyword.value, status: status.value })
    items.value = res.data?.data || []
    total.value = res.data?.pagination?.total || 0
  } finally { loading.value = false }
}
async function save(row: any) {
  await adminAPI.updateDiscordManagedUser(row.id, {
    is_blacklisted: row.is_blacklisted,
    blocked_reason: row.blocked_reason,
    admin_note: row.admin_note,
    order_password: row.order_password,
  })
  await load()
}
onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-2xl font-semibold">Discord 用户管理</h1>
      <p class="text-sm text-slate-500">查看 Discord 绑定用户、订单统计、黑名单与备注。</p>
    </div>
    <div class="flex flex-wrap gap-2 rounded-xl border bg-white p-4">
      <input v-model="keyword" class="rounded border px-3 py-2" placeholder="搜索邮箱/Discord ID/昵称" @keyup.enter="page=1;load()" />
      <select v-model="status" class="rounded border px-3 py-2" @change="page=1;load()">
        <option value="">全部状态</option><option value="normal">正常</option><option value="blacklisted">黑名单</option>
      </select>
      <button class="rounded bg-slate-900 px-4 py-2 text-white" @click="page=1;load()">查询</button>
    </div>
    <div class="overflow-x-auto rounded-xl border bg-white">
      <table class="min-w-full text-sm">
        <thead class="bg-slate-50 text-left"><tr><th class="p-3">用户</th><th class="p-3">邮箱/密码</th><th class="p-3">订单</th><th class="p-3">状态</th><th class="p-3">备注</th><th class="p-3">操作</th></tr></thead>
        <tbody>
          <tr v-for="row in items" :key="row.id" class="border-t align-top">
            <td class="p-3"><div class="font-medium">{{ row.display_name || row.username }}</div><div class="text-xs text-slate-500">{{ row.discord_user_id }}</div><div class="text-xs text-slate-400">站内用户ID：{{ row.user_id }}</div></td>
            <td class="p-3"><div>{{ row.email }}</div><input v-model="row.order_password" class="mt-1 w-40 rounded border px-2 py-1 text-xs" /></td>
            <td class="p-3"><div>总订单：{{ row.order_count }}</div><div>待支付：{{ row.pending_count }}</div><div>成交：{{ row.total_spent }}</div></td>
            <td class="p-3"><label class="inline-flex items-center gap-2"><input type="checkbox" v-model="row.is_blacklisted" />黑名单</label><input v-model="row.blocked_reason" class="mt-2 block w-56 rounded border px-2 py-1 text-xs" placeholder="封禁原因" /></td>
            <td class="p-3"><textarea v-model="row.admin_note" class="h-20 w-56 rounded border px-2 py-1 text-xs" placeholder="内部备注"></textarea></td>
            <td class="p-3"><button class="rounded bg-blue-600 px-3 py-1.5 text-white" @click="save(row)">保存</button></td>
          </tr>
          <tr v-if="!loading && !items.length"><td colspan="6" class="p-6 text-center text-slate-500">暂无数据</td></tr>
        </tbody>
      </table>
    </div>
    <div class="flex items-center justify-between text-sm"><span>共 {{ total }} 条</span><div class="space-x-2"><button class="rounded border px-3 py-1" :disabled="page<=1" @click="page--;load()">上一页</button><span>{{ page }}</span><button class="rounded border px-3 py-1" :disabled="items.length < pageSize" @click="page++;load()">下一页</button></div></div>
  </div>
</template>
