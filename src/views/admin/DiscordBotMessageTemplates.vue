<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { adminAPI } from '@/api/admin'
const loading=ref(false); const saving=ref(false); const form=ref<any>({ messages:{} })
const fields = [
  { key: 'order_created', label: '订单创建' },
  { key: 'payment_started', label: '支付发起' },
  { key: 'payment_success', label: '支付成功' },
  { key: 'fulfillment_success', label: '发货成功' },
  { key: 'payment_failed', label: '支付失败' },
  { key: 'profile_bound', label: '绑定成功' },
]
async function load(){ loading.value=true; try{ const res=await adminAPI.getDiscordBotSettings(); form.value=res.data?.data||{messages:{}}; form.value.messages ||= {}; fields.forEach((field)=>['en-US','zh-TW','es-ES'].forEach(lang=>ensure(field.key,lang))) } finally{loading.value=false} }
async function save(){ saving.value=true; try{ await adminAPI.updateDiscordBotSettings(form.value); await load(); alert('已保存') } finally{saving.value=false} }
function ensure(key:string, lang:string){ form.value.messages ||= {}; form.value.messages[key] ||= {}; form.value.messages[key][lang] ||= '' }
onMounted(load)
</script>
<template><div class="space-y-4"><div><h1 class="text-2xl font-semibold">Discord 消息模板中心</h1><p class="text-sm text-slate-500">统一管理订单创建、支付、发货、绑定等 Bot 通知文案。可用变量：{order_no} {amount} {currency} {email}</p></div><div class="space-y-4" v-if="!loading"><div v-for="field in fields" :key="field.key" class="rounded-xl border bg-white p-4"><h2 class="mb-3 font-medium">{{ field.label }}</h2><div class="grid gap-3 md:grid-cols-3"><label class="block text-sm">English<textarea @focus="ensure(field.key,'en-US')" v-model="form.messages[field.key]['en-US']" class="mt-1 h-24 w-full rounded border px-3 py-2" /></label><label class="block text-sm">繁體中文<textarea @focus="ensure(field.key,'zh-TW')" v-model="form.messages[field.key]['zh-TW']" class="mt-1 h-24 w-full rounded border px-3 py-2" /></label><label class="block text-sm">Español<textarea @focus="ensure(field.key,'es-ES')" v-model="form.messages[field.key]['es-ES']" class="mt-1 h-24 w-full rounded border px-3 py-2" /></label></div></div><button class="rounded bg-blue-600 px-4 py-2 text-white" :disabled="saving" @click="save">{{ saving?'保存中':'保存模板' }}</button></div></div></template>
