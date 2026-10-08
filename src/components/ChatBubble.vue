<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { CheckCheck } from 'lucide-vue-next'
import gsap from 'gsap'
defineProps({ time: { default: '09.41' }, outgoing: Boolean, noTime: Boolean })
const root = ref(null), typing = ref(false), visible = ref(false)
let observer, timer
onMounted(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { visible.value = true; return }
  observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return
    observer.disconnect(); typing.value = true
    timer = setTimeout(() => {
      typing.value = false; visible.value = true
      gsap.fromTo(root.value.querySelector('.bubble-content'), { opacity: 0, y: 14, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .5, ease: 'back.out(1.3)' })
    }, 550)
  }, { threshold: .06 })
  observer.observe(root.value)
})
onBeforeUnmount(() => { observer?.disconnect(); clearTimeout(timer) })
</script>
<template><div ref="root" class="bubble-wrap" :class="{ outgoing }"><div v-if="typing" class="typing-bubble" aria-label="Sedang mengetik"><i></i><i></i><i></i></div><article class="bubble-content" :class="{ 'bubble-hidden': !visible }"><slot/><span v-if="!noTime" class="message-time">{{ time }} <CheckCheck v-if="outgoing" :size="14"/></span></article></div></template>
