import { createRouter, createWebHistory } from 'vue-router';
import LoginView from "../views/LoginView.vue";
import Dashboard from "../views/Dashboard.vue";
import DeviceRegistration from '../views/DeviceRegistration.vue'
import CourseSessionDetails from '@/views/CourseSessionDetails.vue'
import StudentCourseDetails from '@/views/StudentCourseDetails.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/login" },
    { path: "/login", component: LoginView },
    { path: "/dashboard", component: Dashboard, meta: { requiresAuth: true } },
    {
      path: '/course/:id',
      name: 'CourseSessionDetails',
      component: CourseSessionDetails,
      meta: { requiresAuth: true }
    },
    {
      path: '/student/course/:id',
      name: 'StudentCourseDetails',
      component: StudentCourseDetails,
      meta: { requiresAuth: true }
    },
    {
      path: '/device-registration',
      name: 'DeviceRegistration',
      component: DeviceRegistration,
      meta: { requiresAuth: true }
    }
  ],
})

export default router