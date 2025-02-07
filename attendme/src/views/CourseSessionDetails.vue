<template>
  <div class="page-container">
    <Navbar :userRole="userRole" :userName="userName" />
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
          <router-link :to="`/course/${sessionId}/scan`" class="scan-link">
            Ekran skanowania
          </router-link>
        </header>

        <div class="attendance-section">
          <div class="attendance-header">
            <h2>Lista obecności</h2>
            <button @click="refreshAttendance" :disabled="isRefreshing">
              {{ isRefreshing ? 'Odświeżanie...' : 'Odśwież' }}
            </button>
          </div>

          <table class="attendance-table">
            <thead>
              <tr>
                <th>Imię i Nazwisko</th>
                <th>Nr indeksu</th>
                <th>Akcje</th>
                <th>Reset urządzenia</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in attendanceList" :key="record.attenderUserId">
                <td>{{ record.userName }} {{ record.userSurname }}</td>
                <td>{{ record.studentAlbumIdNumber }}</td>
                <td class="actions-cell">
                  <button 
                    @click="generateAuthLink(record.attenderUserId)" 
                    class="auth-link-btn"
                    :class="{ 'generated': authLinks[record.attenderUserId] }"
                    :disabled="isGeneratingLink[record.attenderUserId]"
                  >
                    {{ isGeneratingLink[record.attenderUserId] ? 'Generowanie...' : 'Generuj link' }}
                  </button>
                </td>
                <td class="actions-cell">
                  <button 
                    @click="resetDevice(record.attenderUserId)"
                    class="reset-btn"
                    :disabled="isResetting[record.attenderUserId]"
                  >
                    {{ isResetting[record.attenderUserId] ? 'Resetowanie...' : 'Resetuj' }}
                  </button>
                </td>
                <td :class="{ present: record.wasUserPresent, 'status-cell': true }">
                  {{ record.wasUserPresent ? 'Obecny' : 'Nieobecny' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { AttendMeBackendClient, CourseSessionListItem, CourseSessionAttendanceRecord } from '@/services/attendmeClient'
import Navbar from '@/components/Navbar.vue'

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

const route = useRoute()
const sessionId = Number(route.params.id)
const session = ref<CourseSessionListItem | null>(null)
const attendanceList = ref<CourseSessionAttendanceRecord[]>([])
const isLoading = ref(true)
const isRefreshing = ref(false)
const error = ref<string | null>(null)
const authLinks = ref<{ [key: number]: string }>({})
const isGeneratingLink = ref<{ [key: number]: boolean }>({})
const isResetting = ref<{ [key: number]: boolean }>({})
let refreshInterval: number | null = null

const fetchSessionDetails = async () => {
  try {
    const response = await client.courseTeacherSessionGet(sessionId)
    session.value = response
  } catch (err) {
    error.value = 'Nie udało się pobrać szczegółów zajęć'
    console.error('Błąd podczas pobierania szczegółów zajęć:', err)
  }
}

const fetchAttendance = async () => {
  try {
    isRefreshing.value = true
    const response = await client.courseSessionAttendanceListGet(sessionId)
    attendanceList.value = response
  } catch (err) {
    error.value = 'Nie udało się pobrać listy obecności'
    console.error('Błąd podczas pobierania listy obecności:', err)
  } finally {
    isRefreshing.value = false
  }
}

const refreshAttendance = () => {
  fetchAttendance()
}

const generateAuthLink = async (userId: number) => {
  isGeneratingLink.value[userId] = true
  try {
    const response = await fetch(`${baseUrl}/user/device/register/token/get?deviceUserId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Błąd podczas generowania linku')
    }
    
    const data = await response.json()
    const registrationToken = data.token
    const fullLink = `${window.location.origin}/device-registration?token=${registrationToken}`
    authLinks.value[userId] = fullLink
    
    // Automatyczne kopiowanie do schowka
    await navigator.clipboard.writeText(fullLink)
  } catch (err) {
    error.value = 'Nie udało się wygenerować linku uwierzytelniającego'
    console.error('Błąd podczas generowania linku:', err)
  } finally {
    isGeneratingLink.value[userId] = false
  }
}

const resetDevice = async (userId: number) => {
  isResetting.value[userId] = true
  try {
    const response = await fetch(`${baseUrl}/user/device/reset?deviceUserId=${userId}`, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      mode: 'cors',
      referrerPolicy: 'strict-origin-when-cross-origin'
    })
    
    if (!response.ok) {
      throw new Error('Błąd podczas resetowania urządzenia')
    }
    
    // Odśwież listę obecności po resecie
    await fetchAttendance()
  } catch (err) {
    console.error('Błąd podczas resetowania urządzenia:', err)
    error.value = 'Nie udało się zresetować urządzenia'
  } finally {
    isResetting.value[userId] = false
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

onMounted(async () => {
  try {
    await Promise.all([fetchSessionDetails(), fetchAttendance()])
    refreshInterval = window.setInterval(fetchAttendance, 30000) // Odświeżaj co 30 sekund
  } catch (err) {
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
.session-details {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  color: #ffffff;
}

.session-header {
  margin-bottom: 30px;
}

.session-info {
  margin: 15px 0;
}

.scan-link {
  display: inline-block;
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  margin-top: 10px;
  transition: background-color 0.3s;
}

.scan-link:hover {
  background: #45a049;
}

.attendance-section {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.attendance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.attendance-table {
  width: 100%;
  border-collapse: collapse;
  color: #ffffff;
}

.attendance-table th,
.attendance-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #404040;
  color: #ffffff;
}

.attendance-table th {
  background-color: #1a1a1a;
  font-weight: bold;
}

.attendance-table tr:hover {
  background-color: #333333;
}

/* Style dla statusu obecności */
td.status-cell {
  color: #ff4444; /* Domyślnie czerwony dla nieobecnych */
  font-weight: bold;
}

td.status-cell.present {
  color: #4CAF50; /* Zielony dla obecnych */
}

button {
  padding: 8px 16px;
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
  background: #404040;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #ffffff;
}

.error {
  color: #ff4444;
  text-align: center;
  padding: 20px;
}

.actions-cell {
  text-align: left;
}

.auth-link-btn {
  background: #1a73e8;
  padding: 6px 12px;
  font-size: 0.9em;
  white-space: nowrap;
  transition: background-color 0.3s ease;
}

.auth-link-btn.generated {
  background: #4CAF50;
}

.auth-link-btn:disabled {
  background: #404040;
  cursor: not-allowed;
}

.reset-btn {
  padding: 8px 16px;
  background: #424242;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.reset-btn:hover {
  background: #d32f2f;
}

.reset-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background: #424242;
}
</style> 