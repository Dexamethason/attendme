<template>
  <div class="page-container">
    <Navbar :userRole="userRole" :userName="userName" />
    <div class="scanner-container">
      <div class="scanner-header">
        <h1>Skanowanie obecności</h1>
        <div class="session-info" v-if="session">
          <p>{{ session?.courseName }}</p>
          <p>Grupa: {{ session?.courseGroupName }}</p>
          <p>Data: {{ formatDate(session?.dateStart) }}</p>
        </div>
      </div>

      <div class="scanner-content">
        <!-- Sekcja generowania tokenu -->
        <div class="token-section">
          <button @click="generateScannerToken" :disabled="isGeneratingToken">
            {{ isGeneratingToken ? 'Generowanie tokenu...' : 'Wygeneruj token skanera' }}
          </button>
          <div v-if="scannerToken" class="token-info">
            <p>Link do skanera:</p>
            <p class="token-url">{{ scannerUrl }}</p>
            <button @click="copyToClipboard(scannerUrl)">Kopiuj link</button>
          </div>
        </div>

        <!-- Skaner QR -->
        <div class="qr-scanner">
          <qrcode-stream @decode="onDecode" @init="onInit">
            <div class="loading-overlay" v-if="isLoading">
              {{ loadingMessage }}
            </div>
          </qrcode-stream>
        </div>

        <!-- Status skanowania -->
        <div v-if="scanMessage" class="scan-status" :class="statusClass">
          {{ scanMessage }}
        </div>

        <div class="scan-instructions">
          <p>Zbliż telefon z kodem QR do kamery, aby zarejestrować obecność.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { QrcodeStream } from 'vue-qrcode-reader'
import { AttendMeBackendClient, CourseSessionListItem } from '@/services/attendmeClient'
import Navbar from '@/components/Navbar.vue'

const route = useRoute()
const sessionId = Number(route.params.id)

const baseUrl = 'https://attendme-backend.runasp.net'
const client = new AttendMeBackendClient(baseUrl, {
  fetch: async (url: RequestInfo, init?: RequestInit) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      init = init || {}
      init.headers = {
        ...init.headers,
        'Authorization': `Bearer ${token}`
      }
    }
    return window.fetch(url, init)
  }
})

const session = ref<CourseSessionListItem | null>(null)
const scannerToken = ref<string>('')
const scanMessage = ref('')
const statusClass = ref('status-ready')
const isLoading = ref(true)
const loadingMessage = ref('Inicjalizacja kamery...')
const isGeneratingToken = ref(false)

const scannerUrl = computed(() => {
  if (!scannerToken.value) return ''
  return `${window.location.origin}/scanner?token=${scannerToken.value}`
})

const generateScannerToken = async () => {
  isGeneratingToken.value = true
  try {
    const response = await client.courseSessionAttendanceScannerTokenGet(sessionId)
    scannerToken.value = response.token
  } catch (error) {
    console.error('Błąd podczas generowania tokenu:', error)
    scanMessage.value = 'Nie udało się wygenerować tokenu skanera'
    statusClass.value = 'status-error'
  } finally {
    isGeneratingToken.value = false
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    scanMessage.value = 'Skopiowano link do schowka'
    statusClass.value = 'status-success'
    setTimeout(() => {
      scanMessage.value = ''
      statusClass.value = 'status-ready'
    }, 3000)
  } catch (error) {
    console.error('Błąd podczas kopiowania:', error)
  }
}

const onInit = async (promise: Promise<any>) => {
  try {
    await promise
    isLoading.value = false
  } catch (error) {
    loadingMessage.value = 'Nie można uzyskać dostępu do kamery'
    console.error(error)
  }
}

const onDecode = async (decodedString: string) => {
  try {
    statusClass.value = 'status-processing'
    scanMessage.value = 'Przetwarzanie kodu QR...'

    client.deviceTokenResult = scannerToken.value
    const response = await client.courseSessionAttendanceRegister(decodedString)

    if (response) {
      statusClass.value = 'status-success'
      scanMessage.value = `Obecność potwierdzona dla: ${response.name} ${response.surname}`
    }
  } catch (error) {
    console.error('Błąd podczas rejestracji obecności:', error)
    statusClass.value = 'status-error'
    scanMessage.value = 'Błąd podczas rejestracji obecności'
  }

  setTimeout(() => {
    scanMessage.value = ''
    statusClass.value = 'status-ready'
  }, 3000)
}

const formatDate = (date: Date | undefined): string => {
  if (!date) return ''
  return new Date(date).toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  try {
    const response = await client.courseTeacherSessionGet(sessionId)
    session.value = response
  } catch (error) {
    console.error('Błąd podczas pobierania szczegółów sesji:', error)
  }
})
</script>

<style scoped>
.scanner-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  color: #ffffff;
}

.scanner-header {
  margin-bottom: 30px;
}

.session-info {
  margin: 15px 0;
  background: #2a2a2a;
  padding: 15px;
  border-radius: 8px;
}

.token-section {
  margin-bottom: 30px;
  background: #2a2a2a;
  padding: 20px;
  border-radius: 8px;
}

.token-info {
  margin-top: 15px;
  padding: 15px;
  background: #1a1a1a;
  border-radius: 4px;
}

.token-url {
  word-break: break-all;
  margin: 10px 0;
  padding: 10px;
  background: #333;
  border-radius: 4px;
}

.qr-scanner {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  aspect-ratio: 1;
  background: #2a2a2a;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.scan-status {
  margin: 20px auto;
  padding: 15px;
  border-radius: 4px;
  text-align: center;
  max-width: 500px;
}

.status-success {
  background: #4CAF50;
  color: white;
}

.status-error {
  background: #f44336;
  color: white;
}

.status-processing {
  background: #2196F3;
  color: white;
}

.scan-instructions {
  text-align: center;
  margin-top: 20px;
  color: #888;
}

button {
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background: #45a049;
}

button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}
</style> 