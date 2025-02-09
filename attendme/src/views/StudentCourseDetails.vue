<template>
  <div class="page-container">
    <Navbar :userRole="'student'" :userName="'Student'" />
    <div class="session-details">
      <div v-if="isLoading" class="loading">Ładowanie...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else>
        <header class="session-header">
          <h1>{{ session?.courseName }}</h1>
          <div class="session-info">
            <p>Grupa: {{ session?.courseGroupName }}</p>
            <p>Sala: {{ session?.locationName }}</p>
            <p>Data: {{ formatDate(session?.dateStart) }}</p>
          </div>
          <button class="register-button" @click="goToRegisterAttendance">
            Rejestruj obecność
          </button>
        </header>

        <div class="attendance-section">
          <div class="attendance-header">
            <h2>Twoja frekwencja</h2>
            <button @click="refreshAttendance" :disabled="isRefreshing">
              {{ isRefreshing ? 'Odświeżanie...' : 'Odśwież' }}
            </button>
          </div>

          <div class="attendance-stats">
            <p>Status obecności: 
              <span :class="{ 'status-present': currentAttendance?.wasUserPresent, 'status-absent': !currentAttendance?.wasUserPresent }">
                {{ currentAttendance?.wasUserPresent ? 'Obecny' : 'Nieobecny' }}
              </span>
            </p>
            <p>Całkowita frekwencja: {{ attendancePercentage }}%</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AttendMeBackendClient } from '@/services/attendmeClient'
import Navbar from '@/components/Navbar.vue'

const route = useRoute()
const router = useRouter()
const sessionId = computed(() => Number(route.params.id))
const courseGroupId = ref<number | null>(null)
const session = ref(null)
const currentAttendance = ref(null)
const attendanceHistory = ref([])
const isLoading = ref(true)
const isRefreshing = ref(false)
const error = ref<string | null>(null)
let refreshInterval: number | null = null

const client = new AttendMeBackendClient('https://attendme-backend.runasp.net', {
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

const fetchSessionDetails = async () => {
  try {
    console.log('Pobieranie szczegółów zajęć dla sessionId:', sessionId.value)
    
    // Pobieramy listę wszystkich zajęć studenta
    const filter = {
      pageNumber: 1,
      pageSize: 100,
      filters: {}
    }
    
    const response = await client.courseStudentSessionsGet(filter)
    console.log('Otrzymana odpowiedź:', response)
    
    // Znajdujemy konkretne zajęcia z listy
    const sessionDetails = response.items.find(s => s.courseSessionId === sessionId.value)
    console.log('Znalezione szczegóły zajęć:', sessionDetails)
    
    if (sessionDetails) {
      session.value = sessionDetails
      courseGroupId.value = sessionDetails.courseGroupId
      console.log('Ustawiono courseGroupId:', courseGroupId.value)
    } else {
      throw new Error('Nie znaleziono szczegółów zajęć')
    }
  } catch (err) {
    console.error('Szczegóły błędu:', err)
    error.value = 'Nie udało się pobrać szczegółów zajęć'
  }
}

const fetchAttendance = async () => {
  if (!courseGroupId.value) return
  
  try {
    isRefreshing.value = true
    const response = await client.courseStudentAttendanceGet(courseGroupId.value)
    console.log('Pobrane dane o obecności:', response)
    attendanceHistory.value = response
    currentAttendance.value = response.find(a => a.courseSessionId === sessionId.value)
    console.log('Obecność dla bieżących zajęć:', currentAttendance.value)
  } catch (err) {
    error.value = 'Nie udało się pobrać danych o obecności'
    console.error('Błąd podczas pobierania danych o obecności:', err)
  } finally {
    isRefreshing.value = false
  }
}

const refreshAttendance = () => {
  fetchAttendance()
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

const goToRegisterAttendance = () => {
  if (!session.value?.courseSessionId) {
    console.error('Brak ID sesji')
    return
  }
  
  console.log('Przekierowuję do rejestracji obecności z sessionId:', session.value.courseSessionId)
  router.push({
    path: `/register-attendance/${session.value.courseSessionId}`
  })
}

const attendancePercentage = computed(() => {
  if (!attendanceHistory.value.length) return 0
  const present = attendanceHistory.value.filter(a => a.wasUserPresent).length
  return Math.round((present / attendanceHistory.value.length) * 100)
})

onMounted(async () => {
  try {
    console.log('Komponent zamontowany, rozpoczynam pobieranie danych')
    isLoading.value = true
    await fetchSessionDetails()
    if (courseGroupId.value) {
      await fetchAttendance()
    }
    refreshInterval = window.setInterval(fetchAttendance, 30000)
  } catch (err) {
    console.error('Błąd podczas inicjalizacji:', err)
    error.value = 'Wystąpił błąd podczas ładowania danych'
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #121212;
}

.session-details {
  padding-top: 80px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 20px 20px 20px;
  color: white;
}

.loading, .error {
  text-align: center;
  padding: 20px;
  font-size: 1.2em;
}

.error {
  color: #ff4444;
}

.session-header {
  background: #1f1f1f;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.session-header h1 {
  margin: 0 0 15px 0;
  font-size: 2em;
}

.session-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.session-info p {
  margin: 5px 0;
  font-size: 1.1em;
}

.attendance-section {
  background: #1f1f1f;
  padding: 20px;
  border-radius: 8px;
}

.attendance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.attendance-header h2 {
  margin: 0;
}

.attendance-header button {
  padding: 8px 16px;
  background: #333;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.attendance-header button:hover {
  background: #444;
}

.attendance-header button:disabled {
  background: #2a2a2a;
  cursor: not-allowed;
}

.attendance-stats {
  background: #2a2a2a;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
}

.attendance-stats p {
  margin: 10px 0;
  font-size: 1.1em;
}

.status-present {
  color: #4CAF50;
  font-weight: bold;
}

.status-absent {
  color: #ff4444;
  font-weight: bold;
}

.register-button {
  padding: 12px 24px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;
  margin-top: 20px;
  width: 100%;
}

.register-button:hover {
  background: #45a049;
}

@media (max-width: 768px) {
  .session-info {
    grid-template-columns: 1fr;
  }
  
  .attendance-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .attendance-header button {
    width: 100%;
  }
}
</style> 