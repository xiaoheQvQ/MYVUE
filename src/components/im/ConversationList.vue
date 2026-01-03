<template>
  <div class="conversation-list">
    <div v-for="conversation in conversations" :key="conversation.id" class="conversation-item"
      :class="{ active: selectedId === conversation.id }" @click="selectConversation(conversation)">
      <el-badge :value="conversation.unreadCount" :hidden="conversation.unreadCount === 0">
        <el-avatar :size="45" :src="conversation.avatar"></el-avatar>
      </el-badge>
      <div class="conversation-info">
        <div class="info-top">
          <span class="name">{{ conversation.name }}</span>
          <span class="time">{{ formatTime(conversation.lastMsgTime) }}</span>
        </div>
        <div class="info-bottom">
          <span v-if="conversation.atMeStatus === 1" class="at-me-tag">[@我] </span>
          <span v-if="conversation.atMeStatus === 2" class="at-me-tag">[@所有人] </span>
          <span class="last-msg">{{ conversation.lastMsgContent }}</span>
          <i v-if="conversation.isMute" class="el-icon-bell-off mute-icon"></i>
        </div>
      </div>
      <i v-if="conversation.isTop" class="el-icon-top top-icon"></i>
    </div>
    <div v-if="conversations.length === 0" class="empty">
      <p>暂无会话</p>
    </div>
  </div>
</template>

<script>
import { EventBus } from '@/api/event-bus'
import conversationApi from '@/api/im/conversation'
import Global from '@/components/Global.vue'

export default {
  name: 'ConversationList',
  data() {
    return {
      conversations: [],
      selectedId: null
    }
  },
  created() {
    this.loadConversations()
    EventBus.$on('im-single-message', this.onNewMessage)
    EventBus.$on('im-group-message', this.onNewMessage)
    EventBus.$on('im-read-receipt', this.onReadReceipt)
    EventBus.$on('im-group-notify', this.onGroupNotify)
    EventBus.$on('refresh-conversation-list', this.loadConversations)
  },
  beforeDestroy() {
    EventBus.$off('im-single-message', this.onNewMessage)
    EventBus.$off('im-group-message', this.onNewMessage)
    EventBus.$off('im-read-receipt', this.onReadReceipt)
    EventBus.$off('im-group-notify', this.onGroupNotify)
    EventBus.$off('refresh-conversation-list', this.loadConversations)
  },
  methods: {
    async loadConversations() {
      try {
        const res = await conversationApi.getConversationList()
        this.conversations = (res.data || []).map(conv => {
          // 处理头像字段：优先使用targetAvatar，如果是群组则尝试groupAvatar
          let avatar = conv.targetAvatar
          if (!avatar && conv.conversationType === 2) {
            // 群组类型，尝试使用groupAvatar字段
            avatar = conv.groupAvatar
          }
          if (!avatar) {
            // 如果还是没有，使用默认头像
            avatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
          }

          return {
            ...conv,
            name: conv.targetName || conv.groupName || (conv.conversationType === 1 ? '好友' : '群组'),
            avatar: avatar
          }
        })
      } catch (error) {
        console.error('加载会话列表失败:', error)
      }
    },
    async selectConversation(conversation) {
      this.selectedId = conversation.id
      this.$emit('select', conversation)

      if (conversation.unreadCount > 0) {
        try {
          await conversationApi.clearUnread(conversation.conversationType, conversation.targetId)
          conversation.unreadCount = 0
          this.emitTotalUnread()
        } catch (error) {
          console.error('清除未读数失败:', error)
        }
      }
    },
    onNewMessage(message) {
      // 更新会话列表
      // msgType 3 is single chat, 4 is group chat
      const conversationType = (message.msgType === 3 || message.msgType === 1) ? 1 : 2
      const targetId = (message.msgType === 3 || message.msgType === 1)
        ? (String(message.fromUserId) === String(Global.user.id) ? message.toUserId : message.fromUserId)
        : message.toGroupId

      const conversation = this.conversations.find(c =>
        c.conversationType === conversationType && String(c.targetId) === String(targetId)
      )

      if (conversation) {
        conversation.lastMsgContent = this.getMessagePreview(message)
        conversation.lastMsgTime = new Date(message.msgTime)
        if (this.selectedId !== conversation.id && String(message.fromUserId) !== String(Global.user.id)) {
          conversation.unreadCount++

          // 处理@状态
          if (message.atAll) {
            conversation.atMeStatus = 2
          } else if (message.atUserIds && message.atUserIds.includes(Global.user.id)) {
            conversation.atMeStatus = 1
          }

          this.emitTotalUnread()
        }
        // 将会话移到顶部
        this.moveToTop(conversation)
      } else {
        // 重新加载列表以获取新会话
        this.loadConversations().then(() => {
          this.emitTotalUnread()
        })
      }
    },
    emitTotalUnread() {
      const total = this.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
      EventBus.$emit('update-total-unread', total)
    },
    onReadReceipt(message) {
      // 处理已读回执
    },
    getMessagePreview(message) {
      if (message.contentType === 1) {
        return message.content
      } else if (message.contentType === 2) {
        return '[图片]'
      } else if (message.contentType === 3) {
        return '[语音]'
      } else if (message.contentType === 4) {
        return '[视频]'
      } else if (message.contentType === 5) {
        return '[文件]'
      }
      return ''
    },
    moveToTop(conversation) {
      const index = this.conversations.indexOf(conversation)
      if (index > 0) {
        this.conversations.splice(index, 1)
        this.conversations.unshift(conversation)
      }
    },
    onGroupNotify(message) {
      if (message.content === 'JOIN' || message.content === 'INVITED' || message.content === 'CREATE') {
        this.loadConversations()

        // 显示通知
        if (message.data) {
          this.$notify({
            title: '群组通知',
            message: message.data,
            type: 'info',
            position: 'bottom-right'
          })
        }
      }
    },
    formatTime(time) {
      if (!time) return ''
      const now = new Date()
      const msgTime = new Date(time)
      const diff = now - msgTime

      if (diff < 60000) { // 1分钟内
        return '刚刚'
      } else if (diff < 3600000) { // 1小时内
        return Math.floor(diff / 60000) + '分钟前'
      } else if (diff < 86400000) { // 24小时内
        return Math.floor(diff / 3600000) + '小时前'
      } else if (diff < 172800000) { // 48小时内
        return '昨天'
      } else {
        return msgTime.toLocaleDateString()
      }
    }
  }
}
</script>

<style scoped>
.conversation-list {
  height: 100%;
  overflow-y: auto;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.3s;
  position: relative;
}

.conversation-item:hover {
  background: #f5f5f5;
}

.conversation-item.active {
  background: #e6f7ff;
}

.conversation-info {
  flex: 1;
  margin-left: 12px;
  overflow: hidden;
}

.info-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.time {
  font-size: 12px;
  color: #999;
}

.info-bottom {
  display: flex;
  align-items: center;
}

.last-msg {
  flex: 1;
  font-size: 13px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.at-me-tag {
  color: #f56c6c;
  font-size: 13px;
  font-weight: bold;
}

.mute-icon {
  margin-left: 8px;
  color: #999;
  font-size: 14px;
}

.top-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #07c160;
  font-size: 14px;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
}
</style>
