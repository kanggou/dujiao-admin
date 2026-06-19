<script setup lang="ts">
import BotChannelClients from '@/components/admin/BotChannelClients.vue'
</script>

<template>
  <BotChannelClients
    channel-type="discord_bot"
    i18n-prefix="discordBot"
    default-name="Discord Bot"
  />
</template>
