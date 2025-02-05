<template>
  <header class="header">
    <div class="left-section">
      <button v-if="!isDashboard" class="back-button" @click="goToDashboard">
        <span class="back-icon">←</span>
        Pulpit
      </button>
    </div>
    <div class="user-menu">
      <div class="role-indicator">{{ userRole === 'teacher' ? 'Wykładowca' : 'Student' }}</div>
      <div class="avatar" @click="toggleDropdown">{{ userInitials }}</div>
      <div class="dropdown" v-if="showDropdown">
        <p class="user-name">{{ userName }}</p>
        <button class="logout-button" @click="logout">Wyloguj</button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const props = defineProps<{
  userRole?: string
  userName?: string
}>()

const router = useRouter()
const route = useRoute()
const showDropdown = ref(false)

const isDashboard = computed(() => route.path === '/dashboard')

const userInitials = computed(() => {
  if (!props.userName) return 'U'
  return props.userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
})

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const logout = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('deviceToken')
  router.push('/login')
}

const goToDashboard = () => {
  router.push('/dashboard')
}
</script>

<style scoped>
.header {
  width: 100%;
  height: 60px;
  background: #1f1f1f;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.left-section {
  display: flex;
  align-items: center;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #333;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-button:hover {
  background: #444;
}

.back-icon {
  font-size: 1.2em;
}

.user-menu {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-indicator {
  font-size: 0.9em;
  color: #ccc;
}

.avatar {
  width: 40px;
  height: 40px;
  background: #333;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.avatar:hover {
  background: #444;
}

.dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: #1f1f1f;
  border-radius: 4px;
  padding: 12px;
  min-width: 200px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.user-name {
  margin: 0 0 12px 0;
  font-size: 0.9em;
  color: #ccc;
}

.logout-button {
  width: 100%;
  padding: 8px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logout-button:hover {
  background: #ff2222;
}
</style> 