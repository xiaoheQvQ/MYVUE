<template>
  <div class="im-main">
    <!-- 侧边栏 -->
    <div class="im-sidebar">
      <div class="sidebar-header">
        <el-avatar :size="40" :src="userInfo.avatar"></el-avatar>
      </div>
      <div class="sidebar-menu">
        <div 
          class="menu-item" 
          :class="{ active: activeTab === 'conversation' }"
          @click="activeTab = 'conversation'"
        >
          <el-badge :value="totalUnread" :hidden="totalUnread === 0" class="badge">
            <i class="el-icon-chat-dot-round"></i>
          </el-badge>
          <span>消息</span>
        </div>
        <div 
          class="menu-item" 
          :class="{ active: activeTab === 'friend' }"
          @click="activeTab = 'friend'"
        >
          <el-badge :value="friendApplyCount" :hidden="friendApplyCount === 0" class="badge">
            <i class="el-icon-user"></i>
          </el-badge>
          <span>好友</span>
        </div>
        <div 
          class="menu-item" 
          :class="{ active: activeTab === 'group' }"
          @click="activeTab = 'group'"
        >
          <i class="el-icon-s-custom"></i>
          <span>群组</span>
        </div>
      </div>
      <div class="sidebar-footer">
        <div class="menu-item" @click="handleSettings">
          <i class="el-icon-setting"></i>
        </div>
      </div>
    </div>

    <!-- 列表区 -->
    <div class="im-list">
      <div class="list-header">
        <h3>{{ listTitle }}</h3>
        <el-button 
          v-if="activeTab === 'friend'" 
          type="text" 
          icon="el-icon-plus"
          @click="showAddFriend = true"
        >添加好友</el-button>
        <el-button 
          v-if="activeTab === 'group'" 
          type="text" 
          icon="el-icon-plus"
          @click="showCreateGroup = true"
        >创建群组</el-button>
      </div>
      <div class="list-content">
        <!-- 会话列表 -->
        <conversation-list 
          v-show="activeTab === 'conversation'"
          @select="handleSelectConversation"
        />
        <!-- 好友列表 -->
        <friend-list 
          v-show="activeTab === 'friend'"
          @select="handleSelectFriend"
        />
        <!-- 群组列表 -->
        <group-list 
          v-show="activeTab === 'group'"
          @select="handleSelectGroup"
        />
      </div>
    </div>

    <!-- 聊天区 -->
    <div class="im-chat">
      <chat-window 
        v-if="currentChat"
        :chat-info="currentChat"
      />
      <div v-else class="empty-chat">
        <i class="el-icon-chat-line-square"></i>
        <p>选择一个会话开始聊天</p>
      </div>
    </div>

    <!-- 添加好友对话框 -->
    <el-dialog title="添加好友" :visible.sync="showAddFriend" width="400px">
      <el-form>
        <el-form-item label="用户ID">
          <el-input v-model="addFriendForm.friendId" placeholder="请输入用户ID"></el-input>
        </el-form-item>
        <el-form-item label="申请消息">
          <el-input 
            v-model="addFriendForm.applyMsg" 
            type="textarea"
            :rows="3"
            placeholder="请输入申请消息"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showAddFriend = false">取消</el-button>
        <el-button type="primary" @click="handleAddFriend">发送申请</el-button>
      </span>
    </el-dialog>

    <!-- 创建群组对话框 -->
    <el-dialog title="创建群组" :visible.sync="showCreateGroup" width="400px">
      <el-form>
        <el-form-item label="群组名称">
          <el-input v-model="createGroupForm.groupName" placeholder="请输入群组名称"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showCreateGroup = false">取消</el-button>
        <el-button type="primary" @click="handleCreateGroup">创建</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import Global from '@/components/Global.vue'
import IMWebSocket from '@/api/im/websocket'
import friendApi from '@/api/im/friend'
import groupApi from '@/api/im/group'
import messageApi from '@/api/im/message'
import ConversationList from './ConversationList.vue'
import FriendList from './FriendList.vue'
import GroupList from './GroupList.vue'
import ChatWindow from './ChatWindow.vue'
import { EventBus } from '@/api/event-bus'

export default {
  name: 'IMMain',
  components: {
    ConversationList,
    FriendList,
    GroupList,
    ChatWindow
  },
  data() {
    return {
      activeTab: 'conversation',
      currentChat: null,
      userInfo: Global.user || {},
      totalUnread: 0,
      friendApplyCount: 0,
      showAddFriend: false,
      showCreateGroup: false,
      addFriendForm: {
        friendId: '',
        applyMsg: '你好，我想加你为好友'
      },
      createGroupForm: {
        groupName: ''
      }
    }
  },
  computed: {
    listTitle() {
      const titles = {
        conversation: '消息',
        friend: '好友',
        group: '群组'
      }
      return titles[this.activeTab] || '消息'
    }
  },
  created() {
    if (!Global.user) {
      this.$message.warning('请先登录')
      this.$router.push('/login')
      return
    }

    // 连接IM WebSocket
    const token = localStorage.getItem('accessToken')
    IMWebSocket.connect(token, Global.user.id)

    // 初始化获取未读计数
    this.loadCounts()

    // 监听WebSocket事件
    EventBus.$on('im-ws-connected', this.onConnected)
    EventBus.$on('im-ws-disconnected', this.onDisconnected)
    EventBus.$on('im-friend-apply', this.onFriendApply)
    EventBus.$on('refresh-apply-count', this.loadCounts)
    EventBus.$on('update-total-unread', (count) => {
      this.totalUnread = count
    })
  },
  beforeDestroy() {
    EventBus.$off('im-ws-connected', this.onConnected)
    EventBus.$off('im-ws-disconnected', this.onDisconnected)
    EventBus.$off('im-friend-apply', this.onFriendApply)
    EventBus.$off('refresh-apply-count', this.loadCounts)
    IMWebSocket.disconnect()
  },
  methods: {
    onConnected() {
      console.log('IM WebSocket已连接')
      this.$message.success('IM连接成功')
    },
    onDisconnected() {
      console.log('IM WebSocket已断开')
    },
    async loadCounts() {
      try {
        // 加载好友申请计数
        const appRes = await friendApi.getApplyList()
        const applies = appRes.data || []
        this.friendApplyCount = applies.filter(a => a.status === 0).length
        
        // 加载未读消息总数
        const msgRes = await messageApi.getUnreadCount()
        this.totalUnread = msgRes.data || 0
      } catch (error) {
        console.error('加载未读计数失败:', error)
      }
    },
    onFriendApply() {
      this.loadCounts()
    },
    handleSelectConversation(conversation) {
      this.currentChat = {
        type: conversation.conversationType === 1 ? 'single' : 'group',
        targetId: conversation.targetId,
        name: conversation.name,
        avatar: conversation.avatar
      }
    },
    handleSelectFriend(friend) {
      this.currentChat = {
        type: 'single',
        targetId: friend.friendId,
        name: friend.nick,
        avatar: friend.avatar
      }
      this.activeTab = 'conversation'
    },
    handleSelectGroup(group) {
      this.currentChat = {
        type: 'group',
        targetId: group.id,
        name: group.groupName,
        avatar: group.groupAvatar
      }
      this.activeTab = 'conversation'
    },
    async handleAddFriend() {
      if (!this.addFriendForm.friendId) {
        this.$message.warning('请输入用户ID')
        return
      }
      try {
        await friendApi.applyFriend(this.addFriendForm.friendId, this.addFriendForm.applyMsg)
        this.$message.success('好友申请已发送')
        this.showAddFriend = false
        this.addFriendForm = {
          friendId: '',
          applyMsg: '你好，我想加你为好友'
        }
      } catch (error) {
        this.$message.error('发送好友申请失败')
      }
    },
    async handleCreateGroup() {
      if (!this.createGroupForm.groupName) {
        this.$message.warning('请输入群组名称')
        return
      }
      try {
        await groupApi.createGroup(this.createGroupForm.groupName)
        this.$message.success('群组创建成功')
        this.showCreateGroup = false
        this.createGroupForm.groupName = ''
        EventBus.$emit('refresh-group-list')
      } catch (error) {
        this.$message.error('创建群组失败')
      }
    },
    handleSettings() {
      this.$message.info('设置功能开发中...')
    }
  }
}
</script>

<style scoped>
.im-main {
  display: flex;
  height: 100vh;
  background: #f7f7f7;
}

/* 侧边栏 */
.im-sidebar {
  width: 60px;
  background: #2e2e2e;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
}

.sidebar-header {
  margin-bottom: 20px;
}

.sidebar-menu {
  flex: 1;
}

.menu-item {
  width: 50px;
  height: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 10px 0;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
  color: #999;
  font-size: 12px;
}

.menu-item i {
  font-size: 24px;
  margin-bottom: 4px;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.menu-item.active {
  background: rgba(7, 193, 96, 0.2);
  color: #07c160;
}

.badge {
  display: block;
}

.sidebar-footer {
  margin-top: auto;
}

/* 列表区 */
.im-list {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.list-header {
  height: 60px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e0e0e0;
}

.list-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.list-content {
  flex: 1;
  overflow-y: auto;
}

/* 聊天区 */
.im-chat {
  flex: 1;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.empty-chat i {
  font-size: 80px;
  margin-bottom: 20px;
}

.empty-chat p {
  font-size: 16px;
}
</style>
