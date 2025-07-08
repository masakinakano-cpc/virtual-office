import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import MainApp from '@/components/MainApp.vue'
import VirtualOfficeRoom from '@/components/VirtualOfficeRoom.vue'

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'home',
        redirect: '/login'
    },
    {
        path: '/office',
        name: 'office',
        component: MainApp
    },
    {
        path: '/room/:roomId',
        name: 'room',
        component: VirtualOfficeRoom,
        props: route => ({
            roomId: route.params.roomId,
            userNickname: route.query.nickname || 'ゲスト',
            userColor: route.query.color || '#3b82f6'
        })
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('@/components/LoginForm.vue')
    },
    {
        path: '/3d-office',
        name: 'threejs-office',
        component: MainApp
    },
    {
        path: '/2d-office',
        name: 'virtual-office',
        component: () => import('@/components/VirtualOfficeSpace.vue')
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        redirect: '/'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// ナビゲーションガード
router.beforeEach((to, _from, next) => {
    // ページタイトルの設定
    const titles: { [key: string]: string } = {
        'home': 'バーチャルオフィス',
        'office': '2D バーチャルオフィス',
        'room': 'ルーム',
        'login': 'ログイン',
        'threejs-office': '3D オフィス',
        'virtual-office': '2D オフィス'
    }

    document.title = titles[to.name as string] || 'バーチャルオフィス'

    next()
})

export default router
