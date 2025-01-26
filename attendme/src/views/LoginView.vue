<template>
    <div>
      <h1>Logowanie</h1>
      <form @submit.prevent="handleLogin">
        <input v-model="loginName" placeholder="Login" />
        <input v-model="password" type="password" placeholder="Hasło" />
        <button type="submit">Zaloguj</button>
      </form>
      <p v-if="errorMessage">{{ errorMessage }}</p>
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  import { useRouter } from "vue-router";
  import { loginUser } from "@/services/authService";
  
  const router = useRouter();
  const loginName = ref("");
  const password = ref("");
  const errorMessage = ref("");
  
  async function handleLogin() {
    errorMessage.value = "";
    console.log("Wysyłane dane:", loginName.value, password.value); // ✅ Debugowanie
  
    try {
      const response = await loginUser(loginName.value, password.value);
      console.log("Zalogowano, token:", response.token); // ✅ Debugowanie
  
      localStorage.setItem("authToken", response.token);
      router.push("/dashboard");
    } catch (error) {
      errorMessage.value = "Nieprawidłowy login lub hasło!";
    }
  }
  </script>
  

<style scoped>
.login-container {
  max-width: 400px;
  margin: auto;
  padding: 20px;
  text-align: center;
}
input {
  display: block;
  width: 100%;
  margin-bottom: 10px;
  padding: 8px;
}
button {
  width: 100%;
  padding: 10px;
  background: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
}
.error {
  color: red;
  margin-top: 10px;
}
</style>
