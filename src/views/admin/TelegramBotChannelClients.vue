<script setup lang="ts">
import BotChannelClients from '@/components/admin/BotChannelClients.vue'
</script>

<template>
  <BotChannelClients
    channel-type="telegram_bot"
    i18n-prefix="telegramBot"
    default-name="Telegram Bot"
  />
</template>
