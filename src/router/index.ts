import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'login',
            component: () => import('../components/LoginScreen.vue'),
            meta: {
                title: 'Virtual Office - Login'
            }
        },
        {
            path: '/room/:roomId',
            name: 'room',
            component: () => import('../components/VirtualOfficeRoom.vue'),
            props: route => ({
                roomId: route.params.roomId,
                userNickname: route.query.nickname || 'Guest',
                userColor: route.query.color || '#3B82F6'
            }),
            meta: {
                title: 'Virtual Office - Room',
                requiresAuth: true
            }
        },
        {
            path: '/office/:roomId?',
            name: 'office',
            component: () => import('../components/VirtualOfficeRoom.vue'),
            props: route => ({
                roomId: route.params.roomId || 'default',
                userNickname: route.query.nickname || 'Guest',
                userColor: route.query.color || '#3B82F6'
            }),
            meta: {
                title: 'Virtual Office',
                requiresAuth: true
            }
        },
        {
            path: '/demo',
            name: 'demo',
            component: () => import('../App.vue'),
            meta: {
                title: 'Virtual Office - Demo'
            }
        },
        {
            path: '/test',
            name: 'test',
            component: () => import('../components/TestCommunication.vue'),
            meta: {
                title: 'Virtual Office - Communication Test'
            }
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            redirect: '/'
        }
    ]
})

// ナビゲーションガード
router.beforeEach((to, _from, next) => {
    // ページタイトルの設定
    if (to.meta.title) {
        document.title = to.meta.title as string
    }

    // 認証が必要なページのチェック
    if (to.meta.requiresAuth) {
        const nickname = to.query.nickname as string

        if (!nickname || nickname.trim() === '') {
            // ニックネームが設定されていない場合はログイン画面にリダイレクト
            next({
                name: 'login',
                query: { roomId: to.params.roomId as string }
            })
            return
        }
    }

    next()
})

export default router
