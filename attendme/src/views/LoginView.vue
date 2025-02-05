<template>
  <div class="login-container">
    <div class="login-box">
      <h1>Logowanie</h1>
      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <input 
            type="text" 
            v-model="login" 
            placeholder="Login"
            class="form-input"
            required
          />
        </div>
        <div class="form-group">
          <input 
            type="password" 
            v-model="password" 
            placeholder="Hasło"
            class="form-input"
            required
          />
        </div>
        <button type="submit" class="login-button" :disabled="isLoading">
          {{ isLoading ? 'Logowanie...' : 'Zaloguj' }}
        </button>
        <p v-if="error" class="error-message">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { loginUser } from "@/services/authService";

const router = useRouter();
const login = ref("");
const password = ref("");
const error = ref("");
const isLoading = ref(false);

async function handleSubmit() {
  error.value = "";
  console.log("Wysyłane dane:", login.value, password.value); // ✅ Debugowanie

  try {
    isLoading.value = true;
    const response = await loginUser(login.value, password.value);
    console.log("Zalogowano, token:", response.token); // ✅ Debugowanie

    localStorage.setItem("authToken", response.token);
    router.push("/dashboard");
  } catch (e) {
    error.value = "Nieprawidłowy login lub hasło!";
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #121212;
}

.login-box {
  background: #1f1f1f;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h1 {
  color: white;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: 500;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-input {
  padding: 12px 16px;
  border: 1px solid #333;
  border-radius: 4px;
  background: #2a2a2a;
  color: white;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #4CAF50;
  background: #333;
}

.form-input::placeholder {
  color: #888;
}

.login-button {
  padding: 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.login-button:hover:not(:disabled) {
  background: #45a049;
}

.login-button:disabled {
  background: #666;
  cursor: not-allowed;
}

.error-message {
  color: #ff4444;
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
}

@media (max-width: 480px) {
  .login-box {
    margin: 1rem;
    padding: 1.5rem;
  }

  h1 {
    font-size: 1.75rem;
  }
}
</style>
