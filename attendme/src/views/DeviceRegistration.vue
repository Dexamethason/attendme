<template>
  <div class="page-container">
    <Navbar :userRole="userRole" :userName="userName" />
    <div class="device-registration">
      <div v-if="isLoading" class="loading">Ładowanie...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="isSuccess" class="success">
        <h2>Urządzenie zostało pomyślnie zarejestrowane!</h2>
        <p>Możesz teraz zamknąć to okno i korzystać z aplikacji na swoim urządzeniu.</p>
      </div>
      <div v-else class="registration-form">
        <h1>Zarejestruj urządzenie</h1>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Token od nauczyciela:</label>
            <input type="text" v-model="formData.token" readonly />
          </div>

          <div class="form-group">
            <label>Nazwa urządzenia</label>
            <input 
              type="text" 
              v-model="formData.deviceName" 
              placeholder="Wpisz nazwę urządzenia"
              required
            />
          </div>

          <div class="form-group">
            <label>Imię studenta</label>
            <input 
              type="text" 
              v-model="formData.studentName" 
              placeholder="Wpisz imię studenta"
              required
            />
          </div>

          <div class="form-group">
            <label>Nazwisko studenta</label>
            <input 
              type="text" 
              v-model="formData.studentSurname" 
              placeholder="Wpisz nazwisko studenta"
              required
            />
          </div>

          <div class="form-group">
            <label>Numer albumu</label>
            <input 
              type="text" 
              v-model="formData.albumNumber" 
              placeholder="Wpisz numer albumu"
              required
            />
          </div>

          <button type="submit" class="submit-btn">Zarejestruj</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/Navbar.vue'

const route = useRoute()
const isLoading = ref(true)
const error = ref<string | null>(null)
const isSuccess = ref(false)
const baseUrl = 'https://attendme-backend.runasp.net'

const formData = ref({
  token: '',
  deviceName: '',
  studentName: '',
  studentSurname: '',
  albumNumber: ''
})

onMounted(() => {
  const token = route.query.token as string
  if (!token) {
    error.value = 'Brak wymaganego tokenu rejestracyjnego'
    isLoading.value = false
    return
  }
  formData.value.token = token
  isLoading.value = false
})

const handleSubmit = async () => {
  try {
    isLoading.value = true
    
    const albumId = parseInt(formData.value.albumNumber)
    const studentUsername = `stu${albumId}`
    
    const response = await fetch(`${baseUrl}/user/device/register`, {
      method: 'POST',
      headers: {
        'accept': 'text/plain',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${formData.value.token}`
      },
      body: JSON.stringify({
        deviceName: formData.value.deviceName,
        studentName: formData.value.studentName,
        studentSurname: formData.value.studentSurname,
        albumIdNumber: albumId,
        username: studentUsername
      }),
      mode: 'cors',
      referrerPolicy: 'strict-origin-when-cross-origin'
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || errorData.title || 'Błąd podczas rejestracji urządzenia')
    }

    const data = await response.json()
    if (data && data.token) {
      localStorage.setItem('deviceToken', data.token)
      isSuccess.value = true
    } else {
      throw new Error('Otrzymano nieprawidłową odpowiedź z serwera')
    }
  } catch (err) {
    console.error('Błąd podczas rejestracji urządzenia:', err)
    error.value = err instanceof Error ? err.message : 'Nie udało się zarejestrować urządzenia'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #121212;
}

/* Dla komponentów, które mają główną zawartość */
.content, .session-details, .device-registration {
  padding-top: 80px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 20px 20px 20px;
  color: white;
}

.device-registration {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  color: #ffffff;
}

h1 {
  margin-bottom: 20px;
  font-size: 2em;
  text-align: center;
}

.registration-form {
  background: #1f1f1f;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #ffffff;
}

input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #333;
  border-radius: 4px;
  background: #2a2a2a;
  color: #ffffff;
}

input[readonly] {
  background: #404040;
  cursor: not-allowed;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: #1a73e8;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
}

.submit-btn:hover {
  background: #1557b0;
}

.loading {
  text-align: center;
  font-size: 1.2em;
  margin: 20px 0;
}

.error {
  color: #ff4444;
  padding: 10px;
  border-radius: 4px;
  background-color: rgba(255, 68, 68, 0.1);
  margin: 20px 0;
}

.success {
  color: #4CAF50;
  text-align: center;
  padding: 20px;
  border-radius: 4px;
  background-color: rgba(76, 175, 80, 0.1);
  margin: 20px 0;
}
</style> 