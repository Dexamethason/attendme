<template>
  <div class="page-container">
    <Navbar :userRole="'student'" :userName="'Student'" />
    <div class="content-wrapper">
      <div v-if="statusMessage" class="status-message" :class="statusClass">
        {{ statusMessage }}
      </div>
      <div class="attendance-container">
        <div class="attendance-header">
          <h1>Rejestracja obecności</h1>
          <div class="session-info" v-if="currentAttendance">
            <p>{{ currentAttendance.courseName }}</p>
            <p>Grupa: {{ currentAttendance.courseGroupName }}</p>
            <p>Data: {{ formatDate(currentAttendance.dateStart) }}</p>
          </div>
        </div>

        <div class="attendance-content">
          <div class="qr-section">
            <QrcodeVue v-if="currentTicket" :value="currentTicket" :size="300" level="M" />
            <div v-else class="qr-placeholder">
              Generowanie kodu QR...
            </div>
          </div>

          <div class="attendance-instructions">
            <p>Zbliż telefon do kamery prowadzącego, aby zarejestrować obecność.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import QrcodeVue from 'qrcode.vue'
import Navbar from '@/components/Navbar.vue'
import { AttendMeBackendClient } from '@/services/attendmeClient'
import { useRoute, useRouter } from 'vue-router'

const currentTicket = ref('')
const statusMessage = ref('')
const statusClass = ref('status-ready')
const currentAttendance = ref(null)
const refreshInterval = ref<number>()
const session = ref(null)

const route = useRoute()
const router = useRouter()
const sessionId = computed(() => Number(route.params.id))

const baseUrl = 'https://attendme-backend.runasp.net'
const client = new AttendMeBackendClient(baseUrl, {
  fetch: async (url: RequestInfo, init?: RequestInit) => {
    const authToken = localStorage.getItem('authToken')
    const deviceToken = localStorage.getItem('deviceToken')
    
    if (!authToken || !deviceToken) {
      throw new Error('Brak wymaganych tokenów')
    }

    init = init || {}
    init.headers = {
      'Authorization': `Bearer ${authToken}`,
      'Device-Token': deviceToken,
      'Content-Type': 'application/json',
      'Accept': 'text/plain',
      'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
      'Priority': 'u=1, i',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site'
    }
    
    init.mode = 'cors'
    init.credentials = 'omit'
    init.referrerPolicy = 'strict-origin-when-cross-origin'
    
    console.log('Wysyłam request z headerami:', init.headers)
    return window.fetch(url, init)
  }
})

const fetchTicket = async () => {
  try {
    console.log('Próba pobrania biletu dla sesji:', sessionId.value)
    if (!sessionId.value) {
      throw new Error('Brak ID sesji')
    }
    
    const deviceToken = localStorage.getItem('deviceToken')
    if (!deviceToken) {
      throw new Error('Brak tokenu urządzenia')
    }
    
    client.deviceTokenResult = deviceToken
    const response = await client.userAttendanceTicketGet(sessionId.value)
    console.log('Odpowiedź z biletu:', response)
    
    if (!response || !response.token) {
      throw new Error('Otrzymano nieprawidłową odpowiedź z serwera')
    }
    
    currentTicket.value = response.token
    
    if (response.lastRegistrationInfo) {
      statusMessage.value = response.lastRegistrationInfo
      statusClass.value = 'status-success'
      setTimeout(() => {
        statusMessage.value = ''
        statusClass.value = 'status-ready'
      }, 3000)
    }
  } catch (error) {
    console.error('Szczegóły błędu podczas pobierania biletu:', error)
    statusMessage.value = 'Nie udało się pobrać kodu QR'
    statusClass.value = 'status-error'
    // Zatrzymujemy odświeżanie w przypadku błędu
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
    }
  }
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

const verifyDeviceToken = async () => {
  try {
    const filter = {
      pageNumber: 1,
      pageSize: 1,
      filters: {}
    }
    
    const response = await client.courseStudentSessionsGet(filter)
    console.log('Odpowiedź z weryfikacji tokenu:', response)
    
    return response && response.items && response.items.length > 0
  } catch (error) {
    console.error('Błąd weryfikacji tokenu urządzenia:', error)
    return false
  }
}

onMounted(async () => {
  console.log('RegisterAttendance mounted, sessionId:', sessionId.value)
  try {
    // Sprawdzamy czy mamy token urządzenia
    const deviceToken = localStorage.getItem('deviceToken')
    console.log('Znaleziony token urządzenia:', deviceToken)

    if (!deviceToken) {
      console.log('Brak tokenu urządzenia')
      statusMessage.value = 'Brak wymaganego tokenu rejestracyjnego'
      statusClass.value = 'status-error'
      return
    }

    // Weryfikujemy token urządzenia
    const isTokenValid = await verifyDeviceToken()
    if (!isTokenValid) {
      console.log('Token urządzenia jest nieważny')
      statusMessage.value = 'Nieprawidłowy token rejestracyjny'
      statusClass.value = 'status-error'
      return
    }

    // Kontynuujemy normalną logikę komponentu
    const filter = {
      pageNumber: 1,
      pageSize: 100,
      filters: {}
    }
    
    const response = await client.courseStudentSessionsGet(filter)
    console.log('Otrzymana odpowiedź:', response)
    
    const sessionDetails = response.items.find(s => s.courseSessionId === sessionId.value)
    console.log('Znalezione szczegóły zajęć:', sessionDetails)
    
    if (sessionDetails) {
      currentAttendance.value = sessionDetails
      await fetchTicket()
      refreshInterval.value = setInterval(fetchTicket, 10000)
    } else {
      throw new Error('Nie znaleziono szczegółów zajęć')
    }
  } catch (error) {
    console.error('Błąd podczas pobierania szczegółów sesji:', error)
    statusMessage.value = 'Nie udało się pobrać informacji o sesji'
    statusClass.value = 'status-error'
  }
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #121212;
}

.content-wrapper {
  padding-top: 80px; /* zwiększamy padding z 64px na 80px */
}

.status-message {
  margin: 0;
  padding: 15px;
  text-align: center;
  width: 100%;
  box-sizing: border-box;
}

.attendance-container {
  max-width: 1200px;
  margin: 20px auto 0;
  padding: 0 20px;
  color: white;
}

.attendance-header {
  text-align: center;
  margin-bottom: 40px;
}

.session-info {
  margin: 15px 0;
  background: #2a2a2a;
  padding: 15px;
  border-radius: 8px;
}

.attendance-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.qr-section {
  background: #2a2a2a;
  padding: 30px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.qr-placeholder {
  width: 300px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  color: #888;
}

.status-success {
  background: #4CAF50;
  color: white;
}

.status-error {
  background: #f44336;
  color: white;
}

.status-ready {
  background: #2196F3;
  color: white;
}

.attendance-instructions {
  text-align: center;
  color: #888;
  margin-top: 20px;
}
</style> 