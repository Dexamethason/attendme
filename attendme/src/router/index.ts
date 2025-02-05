import { createRouter, createWebHistory } from 'vue-router'
import LoginView from "../views/LoginView.vue";
import TeacherDashboard from "../views/TeacherDashboard.vue";
import StudentDashboard from "../views/StudentDashboard.vue";


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/login" },
    { path: "/login", component: LoginView },
    // { path: "/student-dashboard", component: StudentDashboard, meta: { requiresAuth: true } },
    { path: "/teacher-dashboard", component: TeacherDashboard, meta: { requiresAuth: true } },
    {
      path: '/course/:id',
      name: 'CourseSessionDetails',
      component: () => import('@/views/CourseSessionDetails.vue'),
      meta: { requiresAuth: true }
    }
  ],
})

export default router
