<template>
  <div id="app">
    <!-- 用户端界面 -->
    <el-container v-if="isGetInfo && !isAdminRoute">
      <!-- ==================== HEADER REFACTORED & FIXED START ==================== -->
      <el-header id="header">
        <!-- 未登录状态 -->
        <div v-if="user == null" class="header-content">
          <div class="header-left">
            <div class="logo" @click="index()">漫跃</div>
          </div>
          <div class="header-right">
            <div class="header-buttons">
              <router-link to="/login">
                <el-button type="primary">登录</el-button>
              </router-link>
              <router-link to="/signup">
                <el-button>注册</el-button>
              </router-link>
            </div>
          </div>
        </div>

        <!-- 已登录状态 -->
        <div v-if="user != null" class="header-content">
          <!-- Header Left: Logo -->
          <div class="header-left">
            <div class="logo" @click="index()">漫跃</div>
          </div>

          <!-- Header Center: Search -->
          <div class="header-center">
            <div class="search-outer-wrapper" @mouseleave="handleWrapperMouseLeave"
              @mouseenter="handleWrapperMouseEnter">
              <div class="search-wrapper">
                <el-input ref="searchInput" class="search-input" placeholder="请输入搜索内容，支持标签搜索"
                  @keyup.enter.native="handleSearchKeyup" @input="getSuggestions" @focus="handleInputFocus"
                  v-model="searchKeyword">
                  <el-button slot="append" icon="el-icon-search" @click="triggerSearch"></el-button>
                </el-input>
                <div v-if="suggestions.length > 0 && showSuggestions" class="custom-suggestions">
                  <div v-for="(suggestion, index) in suggestions" :key="index" class="suggestion-item"
                    @click="selectSuggestion(suggestion)">
                    <i class="el-icon-search suggestion-icon"></i>
                    <span class="suggestion-text" v-html="suggestion"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Header Right: User Controls (FIXED) -->
          <div class="header-right">
            <el-tooltip content="动态" placement="bottom" effect="dark">
              <el-dropdown trigger="click" @command="handleNotificationCommand" class="header-action-item">
                <el-badge :value="totalUnreadNotifications" :hidden="totalUnreadNotifications === 0"
                  class="action-badge">
                  <img src="@/assets/iconfont/风车.svg" class="action-icon" alt="动态" />
                </el-badge>
                <el-dropdown-menu slot="dropdown" class="notification-menu">
                  <div class="notification-header">
                    <span>通知中心</span>
                    <el-button type="text" class="clear-all" @click.stop="clearAllNotifications">一键已读</el-button>
                  </div>
                  <div class="notification-content-wrapper">
                    <div class="notification-nav">
                      <div class="nav-item" :class="{ active: activeNotificationTab === 'video' }"
                        @click="switchNotificationTab('video')">
                        <i class="el-icon-video-camera"></i>
                        <span>视频动态</span>
                        <el-badge :value="msgList.length" :hidden="msgList.length === 0" class="nav-badge" />
                      </div>
                      <div class="nav-item" :class="{ active: activeNotificationTab === 'live' }"
                        @click="switchNotificationTab('live')">
                        <i class="el-icon-video-play"></i>
                        <span>直播动态</span>
                        <el-badge :value="liveNotificationList.length" :hidden="liveNotificationList.length === 0"
                          class="nav-badge" />
                      </div>
                    </div>
                    <div class="notification-main">
                      <div v-show="activeNotificationTab === 'video'" class="notification-list">
                        <div v-if="msgList.length > 0">
                          <el-dropdown-item v-for="(msg, index) in msgList" :command="{ type: 'video', index }"
                            :key="msg.id">
                            <div class="notification-item">
                              <div class="notification-content"><span class="uploader-name">{{ msg.nick }}</span><span
                                  class="notification-text">发布了新视频</span></div>
                              <div class="video-title">《{{ msg.title }}》</div>
                            </div>
                          </el-dropdown-item>
                        </div>
                        <el-dropdown-item v-if="msgList.length === 0" disabled>
                          <div class="empty-notification"><i class="el-icon-video-camera"></i><span>暂无视频动态</span></div>
                        </el-dropdown-item>
                      </div>
                      <div v-show="activeNotificationTab === 'live'" class="notification-list">
                        <div v-if="liveNotificationList.length > 0">
                          <el-dropdown-item v-for="(msg, index) in liveNotificationList"
                            :command="{ type: 'live', index }" :key="msg.id">
                            <div class="notification-item">
                              <div class="notification-content"><span class="uploader-name">{{ msg.currentUserName
                              }}</span><span class="notification-text">开始了直播</span></div>
                              <div class="video-title">直播间ID: {{ msg.roomId }}</div>
                            </div>
                          </el-dropdown-item>
                        </div>
                        <el-dropdown-item v-if="liveNotificationList.length === 0" disabled>
                          <div class="empty-notification"><i class="el-icon-video-play"></i><span>暂无直播动态</span></div>
                        </el-dropdown-item>
                      </div>
                    </div>
                  </div>
                </el-dropdown-menu>
              </el-dropdown>
            </el-tooltip>

            <el-tooltip content="消息" placement="bottom" effect="dark">
              <el-dropdown trigger="click" @command="handlePrivateMessageCommand" class="header-action-item">
                <el-badge :value="totalUnreadPrivateMessages" :hidden="totalUnreadPrivateMessages === 0"
                  class="action-badge">
                  <i class="el-icon-message-solid action-icon" />
                </el-badge>
                <el-dropdown-menu slot="dropdown" class="notification-menu">
                  <div class="notification-header">
                    <span>消息中心</span>
                    <el-button type="text" class="clear-all" @click.stop="clearAllPrivateMessages">一键已读</el-button>
                  </div>
                  <div class="notification-content-wrapper">
                    <div class="notification-nav">
                      <div class="nav-item" :class="{ active: activePrivateMessageTab === 'private' }"
                        @click="switchPrivateMessageTab('private')">
                        <i class="el-icon-message"></i>
                        <span>私信</span>
                        <el-badge :value="privateMsgList.length" :hidden="privateMsgList.length === 0"
                          class="nav-badge" />
                      </div>
                      <div class="nav-item" :class="{ active: activePrivateMessageTab === 'reply' }"
                        @click="switchPrivateMessageTab('reply')">
                        <i class="el-icon-chat-dot-round"></i>
                        <span>回复</span>
                        <el-badge :value="replyMsgList.length" :hidden="replyMsgList.length === 0" class="nav-badge" />
                      </div>
                      <div class="nav-item" :class="{ active: activePrivateMessageTab === 'like' }"
                        @click="switchPrivateMessageTab('like')">
                        <i class="el-icon-thumb"></i>
                        <span>赞</span>
                        <el-badge :value="likeMsgList.length" :hidden="likeMsgList.length === 0" class="nav-badge" />
                      </div>
                    </div>
                    <div class="notification-main">
                      <div v-show="activePrivateMessageTab === 'private'" class="notification-list">
                        <div v-if="privateMsgList.length > 0">
                          <el-dropdown-item v-for="(msg, index) in privateMsgList" :command="{ type: 'private', index }"
                            :key="msg.id">
                            <div class="notification-item">
                              <div class="notification-content"><span class="sender-name">{{ msg.fromUserNick
                              }}</span><span class="notification-text">发来私信:</span></div>
                              <div class="message-content">{{ msg.content }}</div>
                            </div>
                          </el-dropdown-item>
                        </div>
                        <el-dropdown-item v-if="privateMsgList.length === 0" disabled>
                          <div class="empty-notification"><i class="el-icon-message"></i><span>暂无新私信</span></div>
                        </el-dropdown-item>
                      </div>
                      <div v-show="activePrivateMessageTab === 'reply'" class="notification-list">
                        <div v-if="replyMsgList.length > 0">
                          <!-- replyMsgList 现在包含视频评论和动态回复 -->
                          <el-dropdown-item v-for="(msg, index) in replyMsgList" :command="{ type: 'reply', index }"
                            :key="msg.data.id">
                            <div class="notification-item">
                              <div class="notification-content">
                                <span class="sender-name">{{ msg.data.fromUserNick || msg.data.nick }}</span>
                                <span class="notification-text">{{ msg.type === 'POST_COMMENT' ? '回复了你的动态:' : '回复了你的评论:'
                                }}</span>
                              </div>
                              <div class="message-content">{{ msg.data.content || msg.data.commentContent }}</div>
                            </div>
                          </el-dropdown-item>
                        </div>
                        <el-dropdown-item v-if="replyMsgList.length === 0" disabled>
                          <div class="empty-notification"><i class="el-icon-chat-dot-round"></i><span>暂无新回复</span></div>
                        </el-dropdown-item>
                      </div>
                      <div v-show="activePrivateMessageTab === 'like'" class="notification-list">
                        <div v-if="likeMsgList.length > 0">
                          <el-dropdown-item v-for="(msg, index) in likeMsgList" :command="{ type: 'like', index }"
                            :key="msg.data.id">
                            <div class="notification-item">
                              <div class="notification-content">
                                <span class="sender-name">{{ msg.data.fromUserNick }}</span>
                                <span class="notification-text">赞了你的动态</span>
                              </div>
                              <div class="message-content">“{{ msg.data.postContentSnippet }}”</div>
                            </div>
                          </el-dropdown-item>
                        </div>
                        <el-dropdown-item v-if="likeMsgList.length === 0" disabled>
                          <div class="empty-notification">
                            <i class="el-icon-thumb"></i>
                            <span>暂无新的赞</span>
                          </div>
                        </el-dropdown-item>
                      </div>
                    </div>
                  </div>
                </el-dropdown-menu>
              </el-dropdown>
            </el-tooltip>

            <div class="header-action-item">
              <ChatBar />
            </div>

            <el-button type="primary" class="upload-btn" @click="handleUploadClick">
              <i class="el-icon-upload2 el-icon--left"></i>投稿
            </el-button>

            <el-dropdown class="user-dropdown" trigger="click">
              <span class="el-dropdown-link">
                <el-avatar size="medium" :src="user.avatar" />
              </span>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item class="user-dropdown-info">
                  <span class="user-nick">{{ user.nick }}</span>
                </el-dropdown-item>
                <el-dropdown-item divided></el-dropdown-item>
                <el-dropdown-item icon="el-icon-user" @click.native="detail(user.id)">个人中心</el-dropdown-item>
                <el-dropdown-item icon="el-icon-edit" @click.native="modify()">修改资料</el-dropdown-item>
                <el-dropdown-item icon="el-icon-time" @click.native="history()">观看记录</el-dropdown-item>
                <el-dropdown-item icon="el-icon-star-off" @click.native="collection()">我的收藏</el-dropdown-item>
                <el-dropdown-item icon="el-icon-video-camera-solid" @click.native="liveEntry()">我的直播间</el-dropdown-item>
                <el-dropdown-item icon="el-icon-monitor" @click.native="liveSpmEntry()">查看直播间</el-dropdown-item>
                <el-dropdown-item icon="el-icon-film" @click.native="animeListEntry()">查看番剧</el-dropdown-item>
                <el-dropdown-item icon="el-icon-plus" @click.native="animeUploadEntry()">上传番剧</el-dropdown-item>
                <el-dropdown-item icon="el-icon-present" @click.native="vipEntry()">会员充值</el-dropdown-item>
                <el-dropdown-item icon="el-icon-notebook-2" @click.native="resume()">发布图文</el-dropdown-item>
                <el-dropdown-item icon="el-icon-film" @click.native="feedPage()">图文社区</el-dropdown-item>
                <el-dropdown-item icon="el-icon-data-analysis" @click.native="analyze()">视频管理</el-dropdown-item>
                <el-dropdown-item icon="el-icon-user" @click.native="music()">音乐中心</el-dropdown-item>
                <el-dropdown-item divided>
                  <div class="logout-item" @click="logout()"><i class="el-icon-switch-button"></i> 退出登录</div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      <!-- ==================== HEADER REFACTORED & FIXED END ==================== -->
      <el-main id="component" :class="{ 'no-padding': $route.path === '/music' }">
        <div v-if="showSearchResults" class="search-results-container">
          <div class="search-header">
            <h2>搜索：{{ currentSearchKeyword }}</h2>
            <el-select v-if="searchType === 'videos'" v-model="videoSortType" placeholder="排序方式" style="width: 140px;"
              @change="sortVideos">
              <el-option label="综合排序" value="play"></el-option>
              <el-option label="最新发布" value="new"></el-option>
              <el-option label="最多点赞" value="like"></el-option>
            </el-select>
          </div>

          <el-tabs v-model="searchType" @tab-click="handleTabChange">
            <el-tab-pane label="视频" name="videos">
              <el-empty v-if="records.length === 0" description="换个关键词试试吧~"></el-empty>
              <div v-else class="video-result-grid">
                <div v-for="video in sortedRecords" :key="video.id" class="video-result-card"
                  @click="goToVideoPlayer(video.id)">
                  <div class="video-result-cover">
                    <el-image :src="video.cover" fit="cover" lazy></el-image>
                    <div class="cover-overlay"></div>
                    <div class="video-duration">{{ formatDuration(video.duration) }}</div>
                  </div>
                  <div class="video-result-info">
                    <div class="video-result-title" v-html="video.title"></div>
                    <div class="video-result-uploader">
                      <i class="el-icon-user"></i><span v-html="video.nick"></span>
                    </div>
                    <div class="video-result-metadata">
                      <span><i class="el-icon-view"></i> {{ video.count }}</span>
                      <span><i class="el-icon-date"></i> {{ formatDate(video.createTime) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <el-pagination v-if="records.length > 0" @current-change="handleVideoPageChange"
                :current-page="param.current" :page-size="param.size" :total="Number(param.pages * param.size)"
                layout="prev, pager, next" class="pagination"></el-pagination>
            </el-tab-pane>

            <el-tab-pane label="用户" name="users">
              <el-empty v-if="userList.length === 0" description="没有找到相关用户"></el-empty>
              <div v-else class="user-result-grid">
                <div v-for="user in userList" :key="user.id" class="user-result-card" @click="goToUserPage(user.id)">
                  <div class="user-result-avatar"><el-avatar :size="60" :src="user.avatar"></el-avatar></div>
                  <div class="user-result-info-main">
                    <div class="user-result-name" v-html="user.nick"></div>
                    <div class="user-result-desc" v-html="user.sign || '这个人很懒，什么都没有留下'"></div>
                  </div>
                </div>
              </div>
              <el-pagination v-if="userList.length > 0" @current-change="handleUserPageChange"
                :current-page="userCurrentPage" :page-size="userPageSize" :total="userTotal" layout="prev, pager, next"
                class="pagination"></el-pagination>
            </el-tab-pane>
          </el-tabs>
        </div>

        <router-view v-if="!showSearchResults" @perform-search="handlePerformSearch" />
      </el-main>
    </el-container>

    <!-- 管理端界面 -->
    <router-view v-if="isAdminRoute"></router-view>
  </div>
</template>

<script>
import Global from '@/components/Global.vue'
import userApi from '@/api/user/user'
import videoApi from '@/api/video/video'
import liveApi from '@/api/live/live'
import feedApi from '@/api/feed/feed'
import NavHeader from '@/components/common/NavHeader.vue'
import ChatBar from '@/components/chat/ChatBar.vue'
import { EventBus } from '@/api/event-bus'
import { mapState } from 'vuex'

export default {
  name: 'App',
  components: {
    NavHeader,
    ChatBar
  },
  data() {
    return {
      activePrivateMessageTab: 'private',
      replyMsgList: [], // Will hold both video comments and post replies
      likeMsgList: [],
      handledMessageIds: new Set(),
      searchKeyword: '',
      showSuggestions: false,
      suggestions: [],
      isGetInfo: false,
      user: null,
      msgList: [],
      privateMsgList: [],
      liveNotificationList: [],
      ws: null,
      param: {
        area: null,
        seed: this.getRandomInt(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER),
        current: 1,
        size: 20,
        pages: 1
      },
      records: [],
      areas: null,
      searchType: 'videos',
      userList: [],
      showSearchResults: false,
      userCurrentPage: 1,
      userPageSize: 20,
      userTotal: 0,
      currentSearchKeyword: '',
      activeNotificationTab: 'video',
      videoSortType: 'play',
      currentBackgroundIndex: 1,
      backgroundImages: [
        require('./assets/images/bilibili-autumn-1.png'),
        require('./assets/images/bilibili-autumn-2.png'),
        require('./assets/images/bilibili-autumn-3.png'),
        require('./assets/images/bilibili-autumn-4.png'),
        require('./assets/images/bilibili-autumn-5.png')
      ],
      backgroundInterval: null
    }
  },
  computed: {
    ...mapState(['notifications', 'notificationCount']),
    isAdminRoute() {
      const isAdminPath = this.$route.path.startsWith('/admin')
      const isFromAdmin = this.$route.query.source === 'admin'
      return isAdminPath || isFromAdmin
    },
    totalUnreadNotifications() {
      return this.msgList.length + this.liveNotificationList.length
    },
    totalUnreadPrivateMessages() {
      return this.privateMsgList.length + this.replyMsgList.length + this.likeMsgList.length
    },
    sortedRecords() {
      if (this.searchType !== 'videos') return this.records
      let arr = [...this.records]
      if (this.videoSortType === 'play') {
        arr.sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
      } else if (this.videoSortType === 'new') {
        arr.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
      } else if (this.videoSortType === 'like') {
        arr.sort((a, b) => (b.like || 0) - (a.like || 0))
      }
      return arr
    },
    currentBackground() {
      return this.backgroundImages[this.currentBackgroundIndex - 1]
    }
  },
  mounted() {
    this.getInfo()
    this.startBackgroundAnimation()
  },
  created() {
    console.log('当前环境:', process.env.NODE_ENV)
    console.log('API地址:', process.env.API_URL)
    if (!this.isAdminRoute) {
      this.initWebSocket()
    }
    EventBus.$on('message-handled', (messageId) => {
      this.handledMessageIds.add(messageId)
    })
  },
  beforeDestroy() {
    EventBus.$off('message-handled')
    this.stopBackgroundAnimation()
  },
  methods: {
    startBackgroundAnimation() {
      this.backgroundInterval = setInterval(() => {
        this.currentBackgroundIndex = this.currentBackgroundIndex % 5 + 1
      }, 5000)
    },
    stopBackgroundAnimation() {
      if (this.backgroundInterval) {
        clearInterval(this.backgroundInterval)
        this.backgroundInterval = null
      }
    },
    sortVideos() {
      // computed will auto-update
    },
    handleCommentNotification(message) {
      this.replyMsgList.unshift(message) // Add to the unified reply list
    },
    switchPrivateMessageTab(tab) {
      this.activePrivateMessageTab = tab
    },
    handlePrivateMessageCommand(command) {
      if (command.type === 'private') {
        this.playPrivateMessage(command.index)
      } else if (command.type === 'reply') {
        this.handleReplyMessageClick(command.index)
      } else if (command.type === 'like') {
        this.handleLikeMessageClick(command.index)
      }
    },
    handleLikeMessageClick(index) {
      this.likeMsgList.splice(index, 1)
      this.$router.push('/feedPage').catch(err => {
        if (err.name !== 'NavigationDuplicated') {
          throw err
        }
      })
      this.$message.info('已跳转到动态页面')
    },
    handleReplyMessageClick(index) {
      const message = this.replyMsgList[index]
      this.replyMsgList.splice(index, 1)
      if (message.type === 'NEW_COMMENT' && message.data.videoId) {
        this.$router.push({ path: '/video-player', query: { videoId: message.data.videoId } })
      } else if (message.type === 'POST_COMMENT' && message.data.postId) {
        this.$router.push('/feedPage')
      } else {
        this.$message.info('已将通知标记为已读')
      }
    },
    selectSuggestion(suggestion) {
      this.showSuggestions = false
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = suggestion
      const textContent = tempDiv.textContent || tempDiv.innerText || ''
      this.searchKeyword = textContent
      this.triggerSearch()
    },
    handleInputFocus() {
      this.getSuggestions()
    },
    getSuggestions() {
      if (!this.searchKeyword || this.searchKeyword.trim() === '') {
        this.suggestions = []
        this.showSuggestions = false
        return
      }
      videoApi.inputQuery({ keyword: this.searchKeyword })
        .then(res => {
          if (res && res.data) {
            this.suggestions = Array.isArray(res.data) ? res.data : []
            this.showSuggestions = this.suggestions.length > 0
          } else {
            this.suggestions = []
            this.showSuggestions = false
          }
        })
        .catch(error => {
          console.error('Error fetching suggestions:', error)
          this.suggestions = []
          this.showSuggestions = false
        })
    },
    initWebSocket() {
      if (this.ws) {
        this.ws.close()
      }
      Global.socket = new WebSocket(`ws://localhost:8088//ws/notification`)
      this.ws = Global.socket
      this.ws.onopen = () => {
        console.log('WebSocket连接已建立')
        if (localStorage.getItem('accessToken')) {
          this.ws.send(JSON.stringify({
            type: 'auth',
            token: localStorage.getItem('accessToken')
          }))
        }
      }
      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        console.log('接受的消息类型：' + message.type)
        if (message.type === 'NEW_VIDEO') {
          this.handleNewVideoNotification(message.data)
        } else if (message.type === 'VIDEO_STATUS_UPDATE') {
          console.log('视频状态更新:', message.data)
        } else if (message.type === 'PRIVATE_MESSAGE') {
          console.log('收到私信:', message.data)
          EventBus.$emit('websocket-message', message)
          this.handlePrivateMessage(message)
        } else if (message.type === 'VIDEO_CALL_REQUEST') {
          EventBus.$emit('websocket-video-message', message)
        } else if (message.type === 'VIDEO_CALL_RESPONSE') {
          console.log('收到视频呼叫:', message)
          EventBus.$emit('websocket-video-response-message', message)
        } else if (message.type === 'NEW_Live') {
          console.log('收到直播间通知:', message)
          this.handleLiveNotification(message)
        } else if (message.type === 'POST_LIKE') {
          console.log('收到点赞通知:', message)
          this.handlePostLikeNotification(message)
        } else if (message.type === 'NEW_COMMENT' || message.type === 'POST_COMMENT') {
          console.log('收到评论/回复通知:', message)
          this.handleCommentNotification(message)
        }
      }
      this.ws.onclose = () => {
        console.log('WebSocket连接已关闭')
        setTimeout(() => { this.initWebSocket() }, 5000)
      }
      this.ws.onerror = (error) => {
        console.error('WebSocket连接错误:', error)
      }
    },
    handleLiveNotification(message) {
      console.log('处理直播通知:', message.data.roomId)
      this.liveNotificationList.unshift({
        roomId: String(message.data.roomId),
        currentUserName: message.data.currentUserName,
        createTime: new Date().getTime()
      })
    },
    switchNotificationTab(tab) {
      this.activeNotificationTab = tab
    },
    handleNotificationCommand(command) {
      if (command.type === 'video') {
        this.play(command.index)
      } else if (command.type === 'live') {
        this.goToLiveRoom(command.index)
      }
    },
    goToLiveRoom(index) {
      const data = this.liveNotificationList[index]
      this.liveNotificationList.splice(index, 1)
      this.$router.push({
        name: 'LivePlayer',
        params: { roomId: data.roomId },
        query: {
          nick: this.user.nick, live_from: '71005', visit_id: '33llw6rlnmm0'
        }
      })
    },
    queryVideosByParam(keyword) {
      console.log('queryVideosByParam called with keyword:', keyword)
      if (!keyword || keyword.trim() === '') {
        this.$message.warning('请输入搜索关键词')
        return
      }
      this.currentSearchKeyword = keyword
      this.showSearchResults = true
      this.searchType = 'videos'
      this.param.current = 1
      this.userCurrentPage = 1

      videoApi.queryVideosByParam({
        keyword: keyword, current: this.param.current, size: this.param.size, type: 'video'
      }).then(res => {
        let data = res.data
        this.param.current = parseInt(data.current)
        this.param.pages = parseInt(data.pages)
        this.records = data.records
      }).catch(err => {
        console.error('Error searching videos:', err)
        this.records = []
      })
      this.searchUsers(keyword)
    },
    getInfo() {
      if (localStorage.getItem('loginType') === 'admin' && this.isAdminRoute) {
        this.isGetInfo = true
        Global.user = null
        this.user = null
        return
      }
      if (localStorage.getItem('accessToken') === null) {
        this.isGetInfo = true
        Global.user = null
        return
      }
      userApi.getInfo().then((res) => {
        if (res.code === 200000) {
          this.Global.user = res.data
          this.user = res.data
          this.getMsg()
          this.getOfflineNotifications()
          this.isGetInfo = true
          if (this.isAdminRoute === false && localStorage.getItem('loginType') === 'admin') {
            localStorage.removeItem('loginType')
          }
        }
      }).catch(() => {
        this.isGetInfo = true
        Global.user = null
        this.user = null
      })
    },
    getOfflineNotifications() {
      // Get like notifications
      feedApi.getLikeNotifications().then(res => {
        if (res.data && res.data.length > 0) {
          const parsedMessages = res.data.map(item => JSON.parse(item))
          this.likeMsgList = [...parsedMessages, ...this.likeMsgList]
        }
      }).catch(err => {
        console.error('获取离线点赞通知失败:', err)
      })

      // Get comment notifications
      feedApi.getCommentNotifications().then(res => {
        if (res.data && res.data.length > 0) {
          const parsedMessages = res.data.map(item => JSON.parse(item))
          this.replyMsgList = [...parsedMessages, ...this.replyMsgList]
        }
      }).catch(err => {
        console.error('获取离线评论通知失败:', err)
      })
    },
    handlePostLikeNotification(message) {
      this.likeMsgList.unshift(message)
    },
    logout() {
      this.$confirm('确认退出登录吗？', '退出登录', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
      }).then(() => {
        if (this.ws) {
          this.ws.close()
        }
        this.user = null
        userApi.logout().then(() => {
          Global.user = null
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('loginType')
          this.$router.push('/')
          location.reload()
        }).catch(error => {
          console.error('退出失败:', error)
          this.$message.error('退出失败')
        })
      }).catch(() => { })
    },
    getMsg() {
      console.log('getMsg')
      userApi.getMsg().then(res => {
        this.msgList = res.data
      })
    },
    playPrivateMessage(index) {
      const data = this.privateMsgList[index]
      userApi.consumePrivateMsg(index).then(() => {
        this.privateMsgList.splice(index, 1)
        this.$router.push({
          path: '/chat',
          query: {
            toUserId: data.fromUserId, toUserNick: data.fromUserNick
          }
        })
      }).catch(error => {
        console.error('删除通知失败:', error)
        this.$message.error('删除通知失败')
      })
    },
    play(index) {
      const videoId = this.msgList[index].videoId
      userApi.consumeMsg(index).then(() => {
        this.msgList.splice(index, 1)
        this.$router.push({
          path: '/video-player', query: { videoId: videoId }
        }).catch(err => { if (err.name !== 'NavigationDuplicated') { throw err } })
      }).catch(error => {
        console.error('删除通知失败:', error)
        this.$message.error('删除通知失败')
      })
    },
    index() {
      this.showSearchResults = false
      this.currentSearchKeyword = ''
      this.$router.push('/').catch(err => { if (err.name !== 'NavigationDuplicated') { throw err } })
    },
    detail(userId) {
      this.$router.push({
        path: '/user/profile', query: { id: userId || this.user.id, isModify: false }
      })
    },
    modify() {
      this.$router.push({
        path: '/user/detail', query: { isModify: true }
      })
    },
    history() { this.$router.push('/user/history') },
    collection() { this.$router.push('/user/collection') },
    works() { this.$router.push({ path: '/user/works', query: { id: this.user.id } }) },
    vipEntry() { this.$router.push({ path: '/vip' }) },
    liveSpmEntry() { this.$router.push({ path: '/liveSpm' }) },
    animeUploadEntry() { this.$router.push({ path: '/animeUpload' }) },
    animeListEntry() { this.$router.push({ path: '/animeList' }) },
    liveEntry() {
      this.$confirm('是否选择开播？', '提示', {
        confirmButtonText: '是', cancelButtonText: '否', type: 'warning'
      }).then(() => {
        liveApi.getStream().then(res => {
          if (res.code === 200000) {
            const streamUrl = res.data
            const roomId = streamUrl.split('live/')[1].split('_')[0]
            this.$prompt('您的直播流地址已获取，可一键复制到OBS开播', '直播流地址', {
              confirmButtonText: '复制并进入直播间',
              cancelButtonText: '取消',
              inputValue: streamUrl,
              inputReadonly: true
            }).then(() => {
              navigator.clipboard.writeText(roomId)
              this.$message.success('已复制直播间ID')
              this.$router.push({
                name: 'LivePlayer',
                params: { roomId },
                query: { nick: this.user.nick, live_from: '71005', visit_id: '33llw6rlnmm0' }
              })
            }).catch(() => { })
          } else { this.$message.error('获取直播流地址失败') }
        }).catch(err => {
          console.error('获取直播流地址失败:', err)
          this.$message.error('获取直播流地址失败')
        })
      }).catch(() => { this.$message.info('您选择了取消') })
    },
    resume() {
      this.$router.push({
        path: '/feed'
      })
    },
    postList() {
      this.$router.push({
        path: '/feedList'
      })
    },
    postCard() {
      this.$router.push({
        path: '/feedCard'
      })
    },
    feedPage() {
      this.$router.push({
        path: '/feedPage'
      })
    },
    analyze() { this.$router.push('/analyze') },
    music() { this.$router.push('/music') },
    getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min },
    searchUsers(keyword) {
      if (!keyword || keyword.trim() === '') return
      videoApi.queryVideosByParam({
        keyword: keyword, current: this.userCurrentPage, size: this.userPageSize, type: 'user'
      }).then(res => {
        let data = res.data
        this.userList = data.records || []
        this.userTotal = parseInt(data.total || 0)
      }).catch(err => {
        console.error('Error searching users:', err)
        this.userList = []
        this.userTotal = 0
      })
    },
    handleTabChange(tab) {
      this.searchType = tab.name
      if (tab.name === 'users' && this.userList.length === 0) {
        this.searchUsers(this.currentSearchKeyword)
      } else if (tab.name === 'videos' && this.records.length === 0) {
        this.queryVideosByParam(this.currentSearchKeyword)
      }
    },
    handleVideoPageChange(page) {
      this.param.current = page
      this.queryVideosByParam(this.currentSearchKeyword)
    },
    handleUserPageChange(page) {
      this.userCurrentPage = page
      this.searchUsers(this.currentSearchKeyword)
    },
    goToVideoPlayer(videoId) {
      this.showSearchResults = false
      this.$router.push({
        path: '/video-player', query: { videoId: videoId }
      }).catch(err => { if (err.name !== 'NavigationDuplicated') { throw err } })
    },
    goToUserPage(userId) {
      this.showSearchResults = false
      this.$router.push({
        path: '/user/profile', query: { id: userId }
      }).catch(err => { if (err.name !== 'NavigationDuplicated') { throw err } })
    },
    formatDuration(seconds) {
      if (!seconds) return '00:00'
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = Math.floor(seconds % 60)
      return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
    },
    formatDate(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },
    handlePerformSearch(keyword) {
      console.log('Search event received in App.vue with keyword:', keyword)
      this.searchKeyword = keyword
      this.queryVideosByParam(keyword)
    },
    handleNewVideoNotification(data) {
      this.msgList.unshift({
        videoId: data.videoId, nick: data.nick, title: data.title, description: data.description
      })
    },
    handleUploadClick() {
      if (!this.user) {
        this.$message.error('请先登录')
        this.$router.push('/login')
        return
      }
      this.$router.push({
        path: '/upload-video', query: { timestamp: new Date().getTime() }
      }).catch(err => { if (err.name !== 'NavigationDuplicated') { throw err } })
    },
    clearAllPrivateMessages() {
      this.$confirm('确认清除所有消息吗？', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => {
        this.privateMsgList = []
        this.replyMsgList = []
        this.likeMsgList = []

        // It's better to have a single backend endpoint to clear all notifications
        userApi.consumeAllChatMsg().then(() => {
          this.$message({ type: 'success', message: '已清除所有消息' })
        }).catch(error => {
          console.error('清除消息失败:', error)
          this.$message.error('清除消息失败')
        })
      }).catch(() => { })
    },
    clearAllNotifications() {
      this.$confirm('确认清除所有通知吗？', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => {
        userApi.consumeAllMsg().then(() => {
          this.msgList = []
          this.liveNotificationList = []
          this.$message({ type: 'success', message: '已清除所有通知' })
        }).catch(error => {
          console.error('清除通知失败:', error)
          this.$message.error('清除通知失败')
        })
      }).catch(() => { })
    },
    handlePrivateMessage(message) {
      if (this.handledMessageIds.has(message.data.id)) { return }
      if (message.type === 'PRIVATE_MESSAGE') {
        this.privateMsgList.unshift({
          fromUserId: message.data.fromUserId,
          toUserId: message.data.toUserId,
          content: message.data.content,
          createTime: message.data.createTime,
          fromUserNick: message.data.fromUserNick
        })
      }
    },
    triggerSearch() {
      if (this.searchKeyword.trim() !== '') {
        this.queryVideosByParam(this.searchKeyword)
        this.$refs.searchInput.blur()
        this.showSuggestions = false
      }
    },
    handleSearchKeyup(event) {
      if (event.key === 'Enter') {
        this.triggerSearch()
      }
    },
    handleWrapperMouseEnter() {
      if (this.searchKeyword && this.searchKeyword.trim() !== '') {
        this.getSuggestions()
      }
    },
    handleWrapperMouseLeave() {
      this.showSuggestions = false
    }
  }
}
</script>

<style>
:root {
  --b-pink: #ff69b4;
  --b-blue: #409EFF;
  --text-primary: #18191c;
  --text-secondary: #61666d;
  --text-light: #9499a0;
  --bg-primary: #fff;
  --bg-secondary: #f1f2f3;
  --bg-hover: #e3e5e7;
  --border-color: #e3e5e7;
  --brand-color: var(--b-blue);
  --upload-color: #ff6699;
}

#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

/* --- Header Main Layout & Animation --- */
#header {
  height: 64px !important;
  padding: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  background-image: url('./assets/images/bilibili-autumn-1.png');
  background-repeat: no-repeat;
  background-size: cover;
  transition: background-image 1s ease-in-out;
  animation: parallax 10s infinite alternate;
}

#header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

@keyframes parallax {
  0% {
    background-position: 0% 0%;
  }

  100% {
    background-position: 100% 100%;
  }
}

.header-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1920px;
  height: 100%;
  margin: 0 auto;
  padding: 0 24px;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
}

.header-left {
  flex-shrink: 0;
}

.header-right {
  flex-shrink: 0;
  gap: 24px;
}

/* Increased gap for horizontal layout */
.header-center {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  padding: 0 40px;
}

/* --- Left: Logo & Right: Unauthenticated Buttons --- */
.logo {
  font-size: 28px;
  font-weight: bold;
  color: var(--brand-color);
  cursor: pointer;
  background: linear-gradient(135deg, var(--b-pink), var(--b-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.header-buttons {
  display: flex;
  gap: 12px;
}

/* --- Center: Search Bar --- */
.search-outer-wrapper {
  position: relative;
  width: 100%;
  max-width: 500px;
}

.search-wrapper .el-input-group {
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-hover);
  border: 1px solid transparent;
  transition: all 0.3s;
}

.search-wrapper .el-input-group:hover,
.search-wrapper .el-input-group.is-focus {
  background: var(--bg-primary);
  border-color: var(--brand-color);
}

.search-wrapper .el-input__inner {
  border: none !important;
  background: transparent !important;
  color: var(--text-primary);
  height: 40px;
  line-height: 40px;
  font-size: 14px;
}

.search-wrapper .el-input-group__append {
  border: none !important;
  background: transparent !important;
  color: var(--text-secondary);
  font-size: 18px;
  padding: 0 15px;
}

.search-wrapper .el-input-group__append .el-button {
  margin: 0;
  transition: color 0.2s;
}

.search-wrapper .el-input-group:hover .el-input-group__append .el-button,
.search-wrapper .el-input-group.is-focus .el-input-group__append .el-button {
  color: var(--brand-color);
}

.custom-suggestions {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  width: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 2000;
  max-height: 300px;
  overflow-y: auto;
  padding: 8px 0;
}

.suggestion-item {
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background-color: var(--bg-secondary);
}

.suggestion-icon {
  margin-right: 10px;
  color: var(--text-light);
}

/* --- Right: User Controls (FIXED STYLES) --- */
.header-action-item {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-primary);
  transition: color 0.2s;
}

.action-icon {
  font-size: 24px;
  width: 24px;
  height: 24px;
  vertical-align: middle;
}

.action-badge {
  line-height: 1;
}

.ai-assistant-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: var(--bg-hover);
  border-radius: 8px;
  padding: 6px 12px;
  height: 38px;
  font-size: 14px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.ai-assistant-btn>span {
  white-space: nowrap;
}

.upload-btn {
  background: var(--upload-color);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  height: 38px;
  padding: 0 18px;
  transition: filter 0.2s;
}

.upload-btn:hover {
  background: var(--upload-color);
  /* Keep color on hover */
  filter: brightness(1.1);
}

.user-dropdown .el-avatar {
  border: 2px solid var(--b-blue);
  box-shadow: 0 0 8px rgba(0, 111, 255, 0.3);
  transition: transform 0.2s;
  width: 40px !important;
  height: 40px !important;
}

.user-dropdown .el-dropdown-link:hover .el-avatar {
  transform: scale(1.1);
}

.user-dropdown-info {
  text-align: center;
  padding: 10px 20px !important;
}

.user-dropdown-info .user-nick {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.logout-item {
  color: #f56c6c;
  display: flex;
  align-items: center;
}

.logout-item i {
  margin-right: 8px;
}

.notification-menu {
  width: 420px !important;
  padding: 0 !important;
  border-radius: 8px !important;
  overflow: hidden;
  border: 1px solid var(--border-color) !important;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-color);
}

.notification-header span {
  font-weight: 500;
  color: var(--text-primary);
}

.notification-content-wrapper {
  display: flex;
  height: 350px;
}

.notification-nav {
  width: 120px;
  border-right: 1px solid var(--border-color);
  background-color: #fafafc;
  padding: 8px 0;
}

.notification-main {
  flex: 1;
  overflow-y: auto;
}

.nav-item {
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  position: relative;
  transition: all 0.2s;
  color: var(--text-secondary);
}

.nav-item i {
  margin-right: 8px;
  font-size: 16px;
}

.nav-item:hover {
  background-color: var(--bg-hover);
}

.nav-item.active {
  background-color: var(--bg-primary);
  color: var(--brand-color);
}

.nav-badge {
  position: static;
  margin-left: auto;
}

.notification-list .el-dropdown-item {
  padding: 10px 16px !important;
  line-height: 1.5 !important;
  border-bottom: 1px solid #f0f0f0;
}

.notification-list .el-dropdown-item:last-child {
  border-bottom: none;
}

.notification-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sender-name,
.uploader-name {
  color: var(--brand-color);
  font-weight: 500;
}

.notification-text {
  color: var(--text-secondary);
  font-size: 13px;
}

.video-title,
.message-content {
  font-size: 13px;
  color: var(--text-primary);
  white-space: normal;
  word-break: break-word;
}

.empty-notification {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
  padding: 40px 0;
  gap: 10px;
  font-size: 14px;
}

.empty-notification i {
  font-size: 32px;
}

.clear-all {
  color: #aaa;

  &:hover {
    color: var(--brand-color);
  }
}

/* --- Main Content & Search Results --- */
#component {
  margin-top: 64px;
  padding: 20px;
  background-color: var(--bg-primary);
  min-height: calc(100vh - 64px);
}

#component.no-padding {
  padding: 0;
  background-color: #0b0b0b;
}

.search-results-container {
  max-width: 1200px;
  margin: 20px auto;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.search-header h2 {
  font-size: 24px;
  font-weight: 500;
  margin: 0;
  color: var(--text-primary);
}

.video-result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.video-result-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.video-result-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.video-result-cover {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  background-color: var(--bg-secondary);
}

.video-result-cover .el-image {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  border-radius: 6px;
}

.cover-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
  border-radius: 0 0 6px 6px;
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.video-result-info {
  padding: 12px;
  flex-grow: 1;
}

.video-result-title {
  font-weight: 500;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  font-size: 14px;
  min-height: 39.2px;
  color: var(--text-primary);
}

.video-result-metadata,
.video-result-uploader {
  font-size: 12px;
  color: var(--text-light);
  display: flex;
  align-items: center;
}

.video-result-uploader {
  margin-bottom: 6px;
}

.video-result-uploader i {
  margin-right: 4px;
}

.video-result-metadata {
  gap: 12px;
}

.video-result-metadata span {
  display: flex;
  align-items: center;
}

.video-result-metadata i {
  margin-right: 4px;
}

.user-result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.user-result-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
  background-color: var(--bg-primary);
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-result-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-result-avatar .el-avatar {
  border: 2px solid var(--bg-primary);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.user-result-info-main {
  text-align: left;
}

.user-result-name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 4px;
  color: var(--text-primary);
}

.user-result-desc {
  color: var(--text-secondary);
  font-size: 13px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.el-tabs__item {
  font-size: 16px;
  font-weight: 500;
}

.el-tabs__active-bar {
  background-color: var(--brand-color);
}
</style>
