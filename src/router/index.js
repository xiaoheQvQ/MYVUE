import Vue from 'vue'
import Router from 'vue-router'
import Login from '../components/user/Login'
import Signup from '../components/user/Signup'
import Upload from '../components/video/Upload'
import VideoPlayer from '../components/video/VideoPlayer'
import Index from '../components/Index.vue'
import Detail from '@/components/user/Detail.vue'
import History from '@/components/user/History.vue'
import Collection from '@/components/user/Collection.vue'
import Works from '@/components/user/Works.vue'
import Subscription from '@/components/user/Subscription.vue'
import UserProfile from '@/components/user/UserProfile.vue'
import UserManagement from '@/components/admin/UserManagement.vue'
import VideoManagement from '@/components/admin/VideoManagement.vue'
import DanmakuManagement from '@/components/admin/DanmakuManagement'
import rtcLink from '@/components/webrtc/rtcLink.vue'
import analyze from '@/components/analyze/analyze.vue'
import adminAnalyze from '@/components/admin/analyze.vue'
import change from '@/components/analyze/change.vue'
import LivePlayer from '@/components/live/LivePlayer.vue'
import liveSpm from '@/components/live/liveSpm.vue'
import animeUpload from '@/components/anime/AnimeUpload.vue'
import animeList from '@/components/anime/List.vue'
import player from '../components/anime/Player.vue'
import vip from '@/components/vip/vip.vue'
import feed from '@/components/feed/postCreate.vue'
import feedCard from '@/components/feed/postCard.vue'
import feedList from '@/components/feed/postList.vue'
import feedPage from '@/components/feed/feedPage.vue'
import MusicPlayer from '@/components/music/MusicPlayer.vue'
import IMMain from '@/components/im/IMMain.vue'
Vue.use(Router)

const router = new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Index',
      component: Index
    }, {
      path: '/music',
      name: 'MusicPlayer',
      component: MusicPlayer
    },
    {
      path: '/vip',
      name: 'vip',
      component: vip
    },
    {
      path: '/liveSpm',
      name: 'liveSpm',
      component: liveSpm
    },
    {
      path: '/animeUpload',
      name: 'animeUpload',
      component: animeUpload
    },
    {
      path: '/animeList',
      name: 'animeList',
      component: animeList
    },
    {
      path: '/player',
      name: 'player',
      component: player
    },
    {
      path: '/feed',
      name: 'feed',
      component: feed
    },
    {
      path: '/feedtList',
      name: 'feedList',
      component: feedList
    },
    {
      path: '/feedCard',
      name: 'feedCard',
      component: feedCard
    },
    {
      path: '/feedPage',
      name: 'feedPage',
      component: feedPage
    },
    {
      path: '/change',
      name: 'change',
      component: change
    },
    {
      path: '/analyze',
      name: 'analyze',
      component: analyze
    },
    {
      path: '/admin/analyze',
      name: 'adminAnalyze',
      component: adminAnalyze,
      props: (route) => ({
        userId: route.query.userId
      })
    },
    {
      path: '/rtcLink',
      name: 'rtcLink',
      component: rtcLink
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/signup',
      name: 'signup',
      component: Signup
    },
    {
      path: '/upload-video',
      name: 'uploadVideo',
      component: Upload,
      meta: { requiresAuth: true }
    },
    {
      path: '/video-player',
      name: 'videoPlayer',
      component: VideoPlayer
    },
    {
      path: '/user/detail',
      name: 'userDetail',
      component: Detail,
      meta: { requiresAuth: true }
    },
    {
      path: '/user/history',
      name: 'history',
      component: History,
      meta: { requiresAuth: true }
    },
    {
      path: '/user/collection',
      name: 'collection',
      component: Collection,
      meta: { requiresAuth: true }
    },
    {
      path: '/user/works',
      name: 'works',
      component: Works,
      meta: { requiresAuth: true }
    },
    {
      path: '/user/subscription',
      name: 'subscription',
      component: Subscription,
      meta: { requiresAuth: true }
    },
    {
      path: '/user/subscribed',
      name: 'subscribed',
      component: Subscription,
      meta: { requiresAuth: true }
    },
    {
      path: '/user/profile',
      name: 'userProfile',
      component: UserProfile
    },

    {
      path: '/live/liveplay/:roomId', // 动态参数 roomId
      name: 'LivePlayer',
      component: LivePlayer,
      props: (route) => ({
        roomId: route.params.roomId, // 传入 roomId
        nick: route.query.nick, // 解析查询参数
        live_from: route.query.live_from,
        visit_id: route.query.visit_id
      })
    },
    {
      path: '/chat',
      name: 'Chat',
      component: () => import('@/components/chat/ChatUser.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/im',
      name: 'IM',
      component: IMMain,
      meta: { requiresAuth: true }
    },
    // 管理员路由
    {
      path: '/admin',
      redirect: '/admin/users',
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/users',
      name: 'userManagement',
      component: UserManagement,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/videos',
      name: 'videoManagement',
      component: VideoManagement,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/danmaku',
      name: 'danmakuManagement',
      component: DanmakuManagement,
      meta: { requiresAuth: true, requiresAdmin: true }
    }

  ]
}
)

// 导航守卫
router.beforeEach((to, from, next) => {
  // 检查是否需要令牌
  const needsAuth = to.matched.some(record => record.meta.requiresAuth)
  // 检查是否需要管理员权限
  const needsAdmin = to.matched.some(record => record.meta.requiresAdmin)
  // 检查是否有令牌
  const hasToken = !!localStorage.getItem('accessToken')
  // 检查是否是管理员
  const isAdmin = localStorage.getItem('loginType') === 'admin'

  // 通过路径判断是否请求访问管理员页面
  const requestingAdminPage = to.path.startsWith('/admin')

  // 情况1: 请求需要认证的页面，但没有令牌
  if (needsAuth && !hasToken) {
    return next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }

  // 情况2: 请求管理员页面，但不是管理员
  if (needsAdmin && !isAdmin) {
    return next({
      path: '/'
    })
  }

  // 情况3: 有令牌的管理员请求用户端页面
  if (hasToken && isAdmin && !requestingAdminPage) {
    // 允许管理员访问用户端页面，将由App.vue的getInfo方法处理
    return next()
  }

  // 其他情况正常通过
  next()
})

export default router
