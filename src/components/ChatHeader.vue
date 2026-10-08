<script setup>
import { ArrowLeft, Music2, Pause, MoreVertical, X, Heart, Images, CalendarDays, Mail } from 'lucide-vue-next'
import { ref } from 'vue'
defineProps({ playing: Boolean })
const emit = defineEmits(['back', 'music', 'navigate'])
const menu = ref(false)
function navigate(id) { emit('navigate', id); menu.value = false }
</script>
<template><header class="chat-header"><button class="icon-button back-button" aria-label="Kembali ke layar pembuka" @click="emit('back')"><ArrowLeft :size="21"/></button><div class="avatar">I<span>&</span>S<i></i></div><div class="contact-name"><strong>Ihsan & Syifa <Heart :size="13" fill="currentColor"/></strong><span><i></i> online · mengundangmu</span></div><button class="icon-button music-button" :class="{ active: playing }" :aria-label="playing ? 'Jeda musik' : 'Putar musik'" @click="emit('music')"><Pause v-if="playing" :size="20"/><Music2 v-else :size="20"/></button><button class="icon-button" :aria-expanded="menu" aria-label="Menu undangan" @click="menu = !menu"><X v-if="menu" :size="21"/><MoreVertical v-else :size="21"/></button><nav v-if="menu" class="header-menu"><button @click="navigate('event')"><CalendarDays :size="16"/> Acara</button><button @click="navigate('gallery')"><Images :size="16"/> Galeri</button><button @click="navigate('rsvp')"><Mail :size="16"/> RSVP</button></nav></header></template>
