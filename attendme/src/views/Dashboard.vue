<template>
    <div class="dashboard">
      <header class="header">
        <div class="user-menu">
          <div class="role-indicator">{{ userRole === 'teacher' ? 'Nauczyciel' : 'Student' }}</div>
          <div class="avatar" @click="toggleDropdown">PK</div>
          <div class="dropdown" v-if="showDropdown">
            <p class="user-name">Paweł Kołodziej</p>
            <button @click="logout">Wyloguj</button>
          </div>
        </div>
      </header>
  
      <div class="content">
        <div class="filters-container">
          <h2>Filtry</h2>
          <select v-model="selectedFilter">
            <option value="">Bieżący miesiąc</option>
            <option value="today">Dzisiejsze</option>
            <option value="tomorrow">Jutro</option>
            <option value="nextWeek">Następny tydzień</option>
            <option value="past">Minione</option>
            <option value="all">Wszystkie</option>
          </select>
          <input type="text" v-model="searchQuery" placeholder="Przedmiot, grupa, lokalizacja..." class="search-bar" />
        </div>
  
        <div v-if="courses.length > 0" class="courses-list">
          <div
            v-for="course in courses"
            :key="course.courseSessionId"
            class="course-item"
            @click="goToCourseDetails(course.courseSessionId)"
          >
            <span class="course-time">{{ formatDate(course.dateStart) }}</span>
            <h3>{{ course.courseName }}</h3>
            <p>Grupa: {{ course.courseGroupName }}</p>
            <p>Sala: {{ course.locationName }}</p>
          </div>
        </div>
        <p v-else class="no-courses">Brak zajęć do wyświetlenia.</p>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getTeacherSessions } from '@/services/courseService'
import type { CourseSessionListItem } from '@/services/attendmeClient'
import { AttendMeBackendClient } from '@/services/attendmeClient'

const router = useRouter()
const courses = ref<CourseSessionListItem[]>([])
const selectedFilter = ref('')
const searchQuery = ref('')
const showDropdown = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)
const userRole = ref<string>('')

const fetchCourses = async () => {
  try {
    isLoading.value = true
    error.value = null

    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let dateStart = getDateFilter(selectedFilter.value)
    let dateEnd: Date | undefined = undefined

    // Minione
    if (selectedFilter.value === 'past') {
      dateEnd = today 
    } 
    // Dzisiaj
    else if (selectedFilter.value === 'today') {
      dateEnd = new Date(today)
      dateEnd.setHours(23, 59, 59, 999)
    }

    // Przyszłe zajęcia
    else if (dateStart) {
      if (selectedFilter.value === 'nextWeek') {
        dateEnd = new Date(dateStart)
        dateEnd.setDate(dateEnd.getDate() + 7)
      } else if (selectedFilter.value === 'tomorrow') {
        dateEnd = new Date(dateStart)
        dateEnd.setDate(dateEnd.getDate() + 1)
      }
    }
    
    const filter = {
      pageNumber: 1,
      pageSize: 100,
      filters: {
        search: searchQuery.value || undefined,
        dateStart: selectedFilter.value === 'past' ? undefined : dateStart,
        dateEnd: dateEnd
      }
    }

    const response = await getTeacherSessions(filter)
    courses.value = response || []
  } catch (err) {
    console.error('Błąd podczas pobierania zajęć:', err)
    error.value = 'Nie udało się pobrać listy zajęć'
  } finally {
    isLoading.value = false
  }
}

const getDateFilter = (filter: string): Date | undefined => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  switch (filter) {
    case 'today':
      return today
    case 'tomorrow': {
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      return tomorrow
    }
    case 'nextWeek': {
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)
      return nextWeek
    }
    case 'past': {
      return undefined 
    }
    case 'all':
      return undefined
    default:
      const currentMonth = new Date(today)
      currentMonth.setDate(1)
      return currentMonth 
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

const goToCourseDetails = (id: number) => {
  router.push(`/course/${id}`)
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const logout = () => {
  localStorage.removeItem('authToken')
  router.push('/login')
}

const getUserRole = async () => {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }

    const client = new AttendMeBackendClient('https://attendme-backend.runasp.net', {
      fetch: (url, init) => {
        if (init) {
          init.headers = {
            ...init.headers,
            'Authorization': `Bearer ${token}`
          }
        }
        return window.fetch(url, init)
      }
    })

    const user = await client.userGet()
    userRole.value = user.isTeacher ? 'teacher' : 'student'
    console.log('Rola użytkownika:', userRole.value)
  } catch (err) {
    console.error('Błąd podczas pobierania roli użytkownika:', err)
    error.value = 'Nie udało się pobrać informacji o użytkowniku'
  }
}

onMounted(() => {
  const token = localStorage.getItem('authToken')
  if (!token) {
    router.push('/login')
    return
  }
  
  userRole.value = localStorage.getItem('userRole') || ''
  fetchCourses()
  getUserRole()
})

watch(selectedFilter, () => {
  fetchCourses()
})

watch(searchQuery, () => {
  fetchCourses()
})
</script>
  
  <style scoped>
  /* Globalne ustawienia */
  .dashboard {
    width: 100vw;
    min-height: 100vh;
    background: #121212;
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  /* Nagłówek */
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
  .logo {
    width: 50px;
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
  button {
    width: 100%;
    padding: 5px;
    border: none;
    background: red;
    color: white;
    border-radius: 5px;
    cursor: pointer;
  }
  button:hover {
    background: darkred;
  }
  
  /* Główna zawartość */
  .content {
    width: 90%;
    max-width: 1200px;
    margin-top: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  /* Filtry */
  .filters-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: #2a2a2a;
    padding: 15px;
    border-radius: 10px;
    margin-bottom: 20px;
  }
  .filters-container select,
  .filters-container .search-bar {
    padding: 10px;
    border: 1px solid #555;
    background: #3a3a3a;
    color: white;
    border-radius: 5px;
    cursor: pointer;
    flex: 1;
  }
  .filters-container select:focus,
  .filters-container .search-bar:focus {
    background: #555;
  }
  
  /* Lista zajęć */
  .courses-list {
    width: 100%;
    max-width: 900px;
  }
  .course-item {
    border: 1px solid #555;
    padding: 15px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: background 0.2s;
    background: #222;
    border-radius: 5px;
    color: white;
  }
  .course-item:hover {
    background: #333;
  }
  .course-item.active {
    background: lightblue;
    color: black;
  }
  .course-time {
    font-weight: bold;
    color: #bbb;
  }
  .no-courses {
    text-align: center;
    font-size: 18px;
    color: #888;
    margin-top: 20px;
  }
  .role-indicator {
    margin-right: 10px;
    padding: 5px 10px;
    background: #333;
    border-radius: 4px;
    font-size: 14px;
  }
  </style>
  