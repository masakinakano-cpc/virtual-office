import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: App
    },
    {
        path: '/@:coordinates',
        name: 'Position',
        component: App
    },
    {
        path: '/@room_id-:roomId',
        name: 'Room',
        component: App
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
