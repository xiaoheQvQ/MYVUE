<template>
  <div class="conversation-list">
    <div 
      v-for="conversation in conversations" 
      :key="conversation.id"
      class="conversation-item"
      :class="{ active: selectedId === conversation.id }"
      @click="selectConversation(conversation)"
    >
      <el-badge :value="conversation.unreadCount" :hidden="conversation.unreadCount === 0">
        <el-avatar :size="45" :src="conversation.avatar"></el-avatar>
      </el-badge>
      <div class="conversation-info">
        <div class="info-top">
          <span class="name">{{ conversation.name }}</span>
          <span class="time">{{ formatTime(conversation.lastMsgTime) }}</span>
        </div>
        <div class="info-bottom">
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
  },
  beforeDestroy() {
    EventBus.$off('im-single-message', this.onNewMessage)
    EventBus.$off('im-group-message', this.onNewMessage)
    EventBus.$off('im-read-receipt', this.onReadReceipt)
  },
  methods: {
    async loadConversations() {
      try {
        const res = await conversationApi.getConversationList()
        this.conversations = (res.data || []).map(conv => {
            // 这里可能需要根据 targetId 获取更详细的用户/群组信息
            // 暂时使用 backend 返回的基本信息
            return {
                ...conv,
                name: conv.targetName || (conv.conversationType === 1 ? '好友' : '群组'),
                avatar: conv.targetAvatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
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
      const targetId = (message.msgType === 3 || message.msgType === 1) ? 
        (String(message.fromUserId) === String(Global.user.id) ? message.toUserId : message.fromUserId) : 
        message.toGroupId
      
      const conversation = this.conversations.find(c => 
        c.conversationType == conversationType && String(c.targetId) === String(targetId)
      )
      
      if (conversation) {
        conversation.lastMsgContent = this.getMessagePreview(message)
        conversation.lastMsgTime = new Date(message.msgTime)
        if (this.selectedId != conversation.id && String(message.fromUserId) !== String(Global.user.id)) {
          conversation.unreadCount++
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
