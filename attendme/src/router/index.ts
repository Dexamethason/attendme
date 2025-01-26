import { createRouter, createWebHistory } from 'vue-router'
import LoginView from "@/views/LoginView.vue";
import TeacherDashboard from "@/views/TeacherDashboard.vue";
import StudentDashboard from "@/views/StudentDashboard.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/login", component: LoginView },
    { path: "/teacher-dashboard", component: TeacherDashboard },
    { path: "/student-dashboard", component: StudentDashboard },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router
