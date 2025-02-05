<template>
  <div class="device-registration-page">
    <header class="header">
      <div class="user-menu">
        <div class="role-indicator">Student</div>
        <div class="avatar" @click="toggleDropdown">PK</div>
        <div class="dropdown" v-if="showDropdown">
          <p class="user-name">Paweł Kołodziej</p>
          <button class="logout-button" @click="logout">Wyloguj</button>
        </div>
      </div>
    </header>

    <div class="device-registration">
      <h1>Rejestracja urządzenia</h1>
      <div v-if="isLoading" class="loading">Ładowanie...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="isRegistered" class="success">
        <p>Urządzenie zostało pomyślnie zarejestrowane!</p>
        <button class="primary-button" @click="goToDashboard">Przejdź do pulpitu</button>
      </div>
      <div v-else class="registration-form">
        <p>Aby korzystać z aplikacji, musisz zarejestrować to urządzenie.</p>
        <button class="primary-button" @click="registerDevice" :disabled="isProcessing">
          {{ isProcessing ? 'Rejestrowanie...' : 'Zarejestruj urządzenie' }}
        </button>
        <button @click="resetDevice" class="reset-button">
          Wyczyść dane urządzenia
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { AttendMeBackendClient } from '@/services/attendmeClient'

const router = useRouter()
const route = useRoute()
const isLoading = ref(false)
const isProcessing = ref(false)
const isRegistered = ref(false)
const error = ref<string | null>(null)

const client = new AttendMeBackendClient('https://attendme-backend.runasp.net')

const showDropdown = ref(false)

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const logout = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('deviceToken')
  router.push('/login')
}

const registerDevice = async () => {
  try {
    isProcessing.value = true
    error.value = null
    
    const token = route.query.token as string
    if (!token) {
      error.value = 'Brak wymaganego tokenu rejestracji'
      return
    }

    const deviceData = {
      deviceName: navigator.userAgent
    }

    const response = await client.userDeviceRegisterWithToken(token, deviceData)
    
    if (response && response.token) {
      localStorage.setItem('deviceToken', response.token)
      isRegistered.value = true
    } else {
      throw new Error('Nie otrzymano tokenu urządzenia')
    }
  } catch (err) {
    console.error('Błąd podczas rejestracji urządzenia:', err)
    error.value = 'Nie udało się zarejestrować urządzenia'
  } finally {
    isProcessing.value = false
  }
}

const resetDevice = async () => {
  try {
    await client.deviceAuthReset()
    localStorage.removeItem('deviceToken')
    error.value = null
    isRegistered.value = false
  } catch (err) {
    console.error('Błąd podczas resetowania urządzenia:', err)
    error.value = 'Nie udało się zresetować urządzenia'
  }
}

const goToDashboard = () => {
  router.push('/dashboard')
}

onMounted(() => {
  const deviceToken = localStorage.getItem('deviceToken')
  if (deviceToken) {
    isRegistered.value = true
  }
})
</script>

<style scoped>
.device-registration-page {
  width: 100vw;
  min-height: 100vh;
  background: #121212;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Header styles - skopiowane z Dashboard.vue */
.header {
  width: 100%;
  height: 60px;
  background: #1f1f1f;
  color: white;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 20px;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
}

.user-menu {
  position: relative;
  display: flex;
  align-items: center;
}

.avatar {
  width: 40px;
  height: 40px;
  background: blue;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  cursor: pointer;
}

.role-indicator {
  margin-right: 10px;
  padding: 5px 10px;
  background: #333;
  border-radius: 4px;
  font-size: 14px;
}

.dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: #2a2a2a;
  padding: 15px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.5);
  min-width: 200px;
}

.user-name {
  margin: 0 0 10px 0;
  padding: 5px 0;
  border-bottom: 1px solid #444;
}

.logout-button {
  width: 100%;
  padding: 8px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.logout-button:hover {
  background: #c82333;
}

/* Device registration specific styles */
.device-registration {
  max-width: 600px;
  margin: 80px auto 0;
  padding: 20px;
  background: #1f1f1f;
  border-radius: 8px;
  text-align: center;
}

.primary-button {
  margin: 10px;
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.primary-button:disabled {
  background: #666;
  cursor: not-allowed;
}

.reset-button {
  margin: 10px;
  padding: 10px 20px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.reset-button:hover {
  background: #cc0000;
}

.error {
  color: #ff4444;
  margin: 10px 0;
}

.success {
  color: #4CAF50;
  margin: 10px 0;
}

.loading {
  color: #888;
}
</style> 