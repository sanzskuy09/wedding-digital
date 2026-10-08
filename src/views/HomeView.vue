<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { ArrowUpRight, ArrowDown, ArrowRight, Heart, MessageCircle, LockKeyhole, CalendarDays, MapPin, Send, CheckCheck, Image, Wifi, Signal, BatteryFull, ChevronLeft, ChevronRight, X, ShieldCheck } from 'lucide-vue-next'
import { invitation as data } from '../config'
import { guestFromSearch } from '../lib/guest'
import ChatHeader from '../components/ChatHeader.vue'
import ChatBubble from '../components/ChatBubble.vue'
const opened = ref(false), playing = ref(false), lightbox = ref(-1), toast = ref('')
const mobileIntroDone = ref(false)
const modal = ref(null)
let previousFocus
watch(lightbox, async (index) => {
  if (index >= 0) { previousFocus ||= document.activeElement; await nextTick(); modal.value?.querySelector('button')?.focus(); document.body.style.overflow = 'hidden' }
  else { document.body.style.overflow = ''; previousFocus?.focus(); previousFocus = null }
})
function trapModalFocus(e) {
  if (e.key !== 'Tab') return
  const buttons = Array.from(modal.value.querySelectorAll('button'))
  const first = buttons[0], last = buttons.at(-1)
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}
const remaining = ref(Date.parse(data.date) - Date.now())
const invitedName = guestFromSearch(location.search)
const guest = invitedName || 'Tamu Istimewa'
const dateParts = computed(() => { const d = new Date(data.date); return { day: new Intl.DateTimeFormat('id-ID', { day: '2-digit', timeZone: 'Asia/Jakarta' }).format(d), month: new Intl.DateTimeFormat('id-ID', { month: '2-digit', timeZone: 'Asia/Jakarta' }).format(d), year: new Intl.DateTimeFormat('id-ID', { year: 'numeric', timeZone: 'Asia/Jakarta' }).format(d), short: new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(d), lock: new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Jakarta' }).format(d) } })
const counter = computed(() => { const s = Math.max(0, Math.floor(remaining.value / 1000)); return [{ value: Math.floor(s / 86400), label: 'HARI' }, { value: Math.floor(s / 3600) % 24, label: 'JAM' }, { value: Math.floor(s / 60) % 60, label: 'MENIT' }, { value: s % 60, label: 'DETIK' }] })
let interval, audioContext, musicTimer, toastTimer, audioNodes = []
function notify(message) { toast.value = message; clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.value = '', 3200) }
async function continueIntro() {
  mobileIntroDone.value = true
  window.scrollTo(0, 0)
  await nextTick()
  document.querySelector('.notification')?.focus({ preventScroll: true })
}
function open() { mobileIntroDone.value = true; opened.value = true; window.scrollTo(0, 0) }
function go(id) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
function stopMusic() { clearInterval(musicTimer); audioNodes.forEach(n => { try { n.stop() } catch {} }); audioNodes = []; playing.value = false }
async function toggleMusic() {
  if (playing.value) { stopMusic(); return }
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); await audioContext.resume(); playing.value = true
    const notes = [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66]; let step = 0
    function play() { const osc = audioContext.createOscillator(), gain = audioContext.createGain(); osc.type = 'sine'; osc.frequency.value = notes[step++ % notes.length]; gain.gain.setValueAtTime(0, audioContext.currentTime); gain.gain.linearRampToValueAtTime(.065, audioContext.currentTime + .08); gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + 1.3); osc.connect(gain); gain.connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + 1.4); audioNodes.push(osc); osc.onended = () => { audioNodes = audioNodes.filter(n => n !== osc); osc.disconnect(); gain.disconnect() } }
    play(); musicTimer = setInterval(play, 680)
  } catch { playing.value = false; notify('Musik belum dapat diputar di perangkat ini.') }
}
function saveCalendar() {
  const start = new Date(data.date), end = new Date(start.getTime() + 6 * 3600000)
  const fmt = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const escape = s => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  const text = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ihsan Syifa//Wedding//ID', 'BEGIN:VEVENT', `UID:ihsan-syifa-${fmt(start)}@wedding`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`, 'SUMMARY:Pernikahan Ihsan & Syifa', `LOCATION:${escape(data.venue + ', ' + data.address)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
  const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar' })); const a = document.createElement('a'); a.href = url; a.download = 'ihsan-syifa.ics'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify('Undangan kalender siap ditambahkan.')
}
const form = ref({ name: invitedName, attendance: 'yes', guests: 1, message: '', website: '' })
const submitting = ref(false), sent = ref(false), formError = ref('')
const submissionId = crypto.randomUUID()
async function submitRsvp() {
  if (!form.value.name.trim()) { formError.value = 'Mohon isi nama Anda terlebih dahulu.'; return }
  submitting.value = true; formError.value = ''
  try { const response = await fetch('/api/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form.value, id: submissionId }) }); if (!response.ok) throw new Error('Mohon coba kembali. Konfirmasi belum tersimpan.'); sent.value = true; notify('Terima kasih! Konfirmasi Anda sudah tersimpan.') }
  catch (e) { formError.value = e.message || 'Koneksi terputus. Silakan coba lagi.' }
  finally { submitting.value = false }
}
async function copyAccount(gift) { if (!gift.number) return; try { await navigator.clipboard.writeText(gift.number); notify('Nomor rekening berhasil disalin.') } catch { notify('Tidak dapat menyalin. Silakan salin nomor secara manual.') } }
function handleKey(e) { if (e.key === 'Escape') lightbox.value = -1; if (lightbox.value < 0) return; if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') lightbox.value = (lightbox.value + 1) % data.photos.length }
const modelLifecycle = new AbortController()
onMounted(() => { interval = setInterval(() => remaining.value = Date.parse(data.date) - Date.now(), 1000); window.addEventListener('keydown', handleKey); const ctx = document.modelContext; if (ctx?.registerTool) Promise.resolve(ctx.registerTool({ name: 'start_wedding_rsvp', description: 'Buka formulir konfirmasi kehadiran pada undangan Ihsan dan Syifa.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false }, async execute(input) { if (!input || typeof input !== 'object' || Object.keys(input).length) throw new Error('Input harus objek kosong.'); open(); await nextTick(); go('rsvp'); return { form: 'rsvp', ready: true } } }, { signal: modelLifecycle.signal })).catch(() => {}) })
onBeforeUnmount(() => { clearInterval(interval); clearTimeout(toastTimer); stopMusic(); audioContext?.close(); window.removeEventListener('keydown', handleKey); modelLifecycle.abort() })
</script>
<template>
  <div class="site-shell" :class="{ 'intro-complete': mobileIntroDone }">
    <aside class="editorial-panel">
      <div class="editorial-top"><a class="wordmark" href="#" @click.prevent="opened = false">I <span>&</span> S<span class="wordmark-dot">.</span></a><span class="edition-label">THE WEDDING INVITATION</span></div>
      <div class="editorial-copy"><div class="eyebrow"><span></span> SEBUAH AWAL, SELAMANYA</div><h1>Dua hati.<br>Satu <em>cerita.</em></h1><p>Di antara banyaknya pesan,<br>ada satu yang ingin kami sampaikan kepadamu.</p><div class="couple-signature">Ihsan <span>&</span> Syifa</div><div class="editorial-date"><span>{{ dateParts.day }} . {{ dateParts.month }} . {{ dateParts.year }}</span><i></i><span>{{ data.city.toUpperCase() }}</span></div></div>
      <div class="mobile-intro-actions"><div class="mobile-intro-recipient"><span>UNDANGAN KHUSUS UNTUK</span><strong>{{ guest }}</strong></div><button class="primary-button" @click="continueIntro">Lihat pesan undangan <ArrowRight :size="17"/></button></div>
      <div class="editorial-bottom"><span>DIKIRIM DENGAN SEPENUH HATI</span><Heart :size="17"/><span>UNTUKMU.</span></div><div class="side-decoration">forever starts here</div>
    </aside>
    <main class="phone-column" :class="{ 'is-open': opened }">
      <div class="phone-frame">
        <section v-if="!opened" class="lock-screen" aria-label="Pesan undangan pernikahan">
          <img class="lock-photo" :src="data.photos[0].src" alt="Foto pernikahan contoh di taman" fetchpriority="high"/><div class="lock-shade"></div>
          <div class="phone-status"><span>9:41</span><div><Signal :size="15"/><Wifi :size="16"/><BatteryFull :size="21"/></div></div>
          <div class="lock-clock"><LockKeyhole :size="21"/><span>{{ dateParts.lock }}</span><strong>09:41</strong><div class="clock-caption">a little message, a lifetime of love.</div></div>
          <div class="lock-invitation"><div class="lock-kicker">THE WEDDING OF</div><h2>Ihsan <span>&</span> Syifa</h2><p>{{ dateParts.short }} · {{ data.city }}</p></div>
          <button class="notification" @click="open"><div class="notification-head"><span><MessageCircle :size="16" fill="currentColor"/> SEBUAH PESAN BAHAGIA</span><small>sekarang</small></div><div class="notification-body"><div class="avatar small">I<span>&</span>S</div><div><strong>Ihsan & Syifa <Heart :size="12" fill="currentColor"/></strong><p>Kami punya kabar bahagia untukmu…</p></div><ChevronRight :size="21"/></div></button>
          <button class="open-message" @click="open">Buka pesan <ArrowRight :size="18"/></button><span class="lock-note"><LockKeyhole :size="11"/> Sebuah undangan khusus untukmu</span><div class="home-indicator"></div>
        </section>
        <template v-else>
          <ChatHeader :playing="playing" @back="opened = false; stopMusic()" @music="toggleMusic" @navigate="go"/>
          <div class="chat-timeline">
            <div class="chat-date">SEBUAH HARI YANG ISTIMEWA</div><div class="encryption-note"><LockKeyhole :size="11"/> Pesan ini dikirim dengan cinta dan doa. <Heart :size="11"/></div>
            <ChatBubble><p>Assalamu’alaikum<br>Warahmatullahi Wabarakatuh 🌿</p></ChatBubble>
            <ChatBubble time="09.42"><p>Halo, <strong>{{ guest }}</strong>!<br>Ada kabar bahagia yang ingin kami bagi.</p><p>Dengan izin Allah dan restu keluarga,<br>kami akan memulai perjalanan baru.<br>Dan kamu adalah bagian dari cerita ini. 🤍</p></ChatBubble>
            <ChatBubble time="09.42" no-time><div class="profile-cover"><img :src="data.photos[0].src" alt="Foto contoh untuk profil pasangan" loading="lazy"/><div><span>WE'RE GETTING MARRIED</span><h2>Ihsan <em>&</em> Syifa</h2></div><span class="photo-count"><Image :size="12"/> 1 foto</span></div><div class="profile-details"><div class="card-eyebrow">BISMILLAHIRRAHMANIRRAHIM</div><h3>{{ data.groom.name }}</h3><div class="couple-ampersand">&</div><h3>{{ data.bride.name }}</h3><p>Dengan penuh rasa syukur, kami mengundang Anda<br>untuk merayakan hari bahagia kami.</p><span class="inline-time">09.42</span></div></ChatBubble>
            <ChatBubble no-time><figure class="verse-card"><div class="verse-ornament"><span></span><Heart :size="16"/><span></span></div><p class="verse-arabic" lang="ar" dir="rtl">وَجَعَلَ بَيْنَكُمْ مَوَدَّةً وَرَحْمَةً</p><blockquote>“… agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.”</blockquote><figcaption><a href="https://quran.com/id/bangsa-romawi/21" target="_blank" rel="noopener noreferrer">QS. Ar-Rum · 21 <ArrowUpRight :size="11"/></a></figcaption></figure></ChatBubble>
            <ChatBubble time="09.43"><p>Catat tanggalnya, ya.<br>Kami tidak sabar bertemu denganmu! ✨</p></ChatBubble>
            <div id="event" class="section-anchor"><ChatBubble no-time><div class="event-card"><div class="card-eyebrow"><CalendarDays :size="13"/> SAVE OUR DATE</div><h2>Hari bahagia kami</h2><p class="event-date">{{ data.dateLabel }}</p><div class="event-times"><div v-for="(event, i) in data.events" :key="event.name"><span class="event-symbol">{{ i === 0 ? '♧' : '♡' }}</span><strong>{{ event.name }}</strong><small>{{ event.time }}</small></div></div><div class="venue"><MapPin :size="18"/><div><strong>{{ data.venue }}</strong><p>{{ data.address }}</p></div></div><a :href="data.mapsUrl" target="_blank" rel="noopener noreferrer" class="primary-button">Lihat lokasi <ArrowUpRight :size="17"/></a><button class="calendar-link" @click="saveCalendar"><CalendarDays :size="14"/> Tambahkan ke kalender</button><div class="countdown"><div v-for="item in counter" :key="item.label"><strong>{{ String(item.value).padStart(2, '0') }}</strong><small>{{ item.label }}</small></div></div><span v-if="data.demo" class="example-label">Tanggal & lokasi contoh</span></div></ChatBubble></div>
            <ChatBubble time="09.44"><p>Sebelum sampai di hari itu,<br>ini sedikit potongan kebahagiaan kami. 📷</p></ChatBubble>
            <div id="gallery" class="section-anchor"><ChatBubble no-time><div class="gallery-grid"><button v-for="(photo, i) in data.photos" :key="photo.src" @click="lightbox = i" :aria-label="`Perbesar foto ${i + 1}`"><img :src="photo.src" :alt="photo.alt" loading="lazy"/><span><Image :size="14"/></span></button></div><div class="gallery-caption"><span>Little moments, endless love. 🤍</span><small>09.44</small></div><div v-if="data.demo" class="photo-credit">Foto contoh · <a v-for="photo in data.photos" :key="photo.source" :href="photo.source" target="_blank" rel="noopener noreferrer">{{ photo.author }}</a></div></ChatBubble></div>
            <ChatBubble time="09.45"><p>Kehadiran dan doa baikmu adalah hadiah<br>yang paling berarti untuk kami. 🤍</p><p>Boleh kabari kami, kamu akan hadir?</p></ChatBubble>
            <div id="rsvp" class="section-anchor"><ChatBubble no-time><div class="rsvp-card"><div class="card-eyebrow"><Send :size="13"/> YOU'RE ON OUR GUEST LIST</div><h2>Sampai jumpa di sana?</h2><p>Isi konfirmasi kehadiranmu di bawah ini.</p><div v-if="sent" class="rsvp-success" role="status"><ShieldCheck :size="37"/><h3>Pesanmu sudah sampai!</h3><p>Terima kasih, {{ form.name }}.<br>{{ form.attendance === 'yes' ? 'Kami menantikan kehadiranmu di hari bahagia kami.' : 'Terima kasih untuk doa baikmu. Semoga kita bertemu di kesempatan lain.' }}</p></div><form v-else @submit.prevent="submitRsvp"><label>Nama lengkap<input v-model="form.name" required maxlength="100" autocomplete="name" placeholder="Tulis namamu di sini"/></label><fieldset><legend>Apakah kamu akan hadir?</legend><label class="choice" :class="{ selected: form.attendance === 'yes' }"><input type="radio" v-model="form.attendance" value="yes"/>InsyaAllah, hadir <Heart :size="13"/></label><label class="choice" :class="{ selected: form.attendance === 'no' }"><input type="radio" v-model="form.attendance" value="no"/>Belum bisa hadir</label></fieldset><label v-if="form.attendance === 'yes'">Jumlah tamu<select v-model.number="form.guests"><option v-for="n in 5" :value="n" :key="n">{{ n }} orang{{ n === 1 ? ' · saya sendiri' : '' }}</option></select></label><label>Doa & ucapan <span class="optional">(opsional)</span><textarea v-model="form.message" maxlength="1000" rows="3" placeholder="Titipkan doa baik untuk kami…"></textarea></label><input class="honeypot" v-model="form.website" tabindex="-1" autocomplete="off" aria-hidden="true"/><p v-if="formError" role="alert" class="form-error">{{ formError }}</p><button class="primary-button" :disabled="submitting">{{ submitting ? 'Mengirim…' : 'Kirim konfirmasi' }}<Send :size="16"/></button><small class="privacy-note"><LockKeyhole :size="10"/> Nama & ucapanmu hanya terlihat oleh pasangan.</small></form></div></ChatBubble></div>
            <ChatBubble time="09.46"><p>Bagi yang ingin berbagi tanda kasih,<br>kami menyiapkan amplop digital ini.<br>Terima kasih atas setiap perhatianmu. 💌</p></ChatBubble>
            <ChatBubble no-time><div class="gift-card"><div class="card-eyebrow"><Heart :size="13"/> A LITTLE TOKEN OF LOVE</div><h2>Tanda kasih</h2><div v-for="gift in data.gifts" :key="gift.bank" class="bank-card"><div><strong class="bank-name">{{ gift.bank }}</strong><Heart :size="17"/></div><span class="account-number">{{ gift.number || 'Segera diinformasikan' }}</span><small>a.n. {{ gift.owner }}</small><button v-if="gift.number" @click="copyAccount(gift)">Salin nomor rekening <CheckCheck :size="15"/></button><span v-else class="bank-pending">Informasi rekening menyusul</span></div></div></ChatBubble>
            <ChatBubble time="09.47"><p>Merupakan kebahagiaan bagi kami apabila<br>Anda berkenan hadir dan memberikan<br>doa restu untuk pernikahan kami.</p><p>Sampai bertemu di hari bahagia.<br><strong>Dengan cinta, Ihsan & Syifa 🤍</strong></p><p>Wassalamu’alaikum<br>Warahmatullahi Wabarakatuh.</p></ChatBubble>
            <div class="chat-ending"><Heart :size="20"/><span>THE BEGINNING OF OUR FOREVER</span><p>Ihsan & Syifa</p><small v-if="data.demo">Pratinjau undangan · detail acara & foto contoh</small></div>
          </div>
          <nav class="chat-composer" aria-label="Navigasi cepat"><button @click="go('rsvp')"><Heart :size="18"/><span>Kirim doa & konfirmasi kehadiran…</span></button><button class="send-shortcut" @click="go('rsvp')" aria-label="Ke formulir RSVP"><Send :size="19"/></button></nav>
        </template>
      </div>
      <div class="phone-footer"><span><LockKeyhole :size="11"/> A PRIVATE INVITATION</span><span>MADE WITH <Heart :size="11"/> LOVE</span></div>
    </main>
    <div class="desktop-scroll-hint" v-if="opened"><span>SCROLL TO READ</span><ArrowDown :size="16"/></div>
    <Transition name="toast"><div v-if="toast" class="toast-message" role="status"><CheckCheck :size="17"/>{{ toast }}</div></Transition>
    <div v-if="lightbox >= 0" ref="modal" class="lightbox" @keydown="trapModalFocus" role="dialog" aria-modal="true" aria-label="Galeri foto" @click.self="lightbox = -1"><button class="lightbox-close" @click="lightbox = -1" aria-label="Tutup galeri" autofocus><X/></button><button @click="lightbox = (lightbox + 1) % data.photos.length" aria-label="Foto sebelumnya"><ChevronLeft/></button><img :src="data.photos[lightbox].src" :alt="data.photos[lightbox].alt"/><button @click="lightbox = (lightbox + 1) % data.photos.length" aria-label="Foto berikutnya"><ChevronRight/></button><span>{{ lightbox + 1 }} / {{ data.photos.length }}</span></div>
  </div>
</template>
