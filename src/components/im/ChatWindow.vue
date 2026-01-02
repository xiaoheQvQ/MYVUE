<template>
  <div class="chat-window">
    <!-- 聊天头部 -->
    <div class="chat-header">
      <div class="header-left">
        <el-avatar :size="35" :src="chatInfo.avatar"></el-avatar>
        <div class="chat-title">
          <h3>{{ chatInfo.name }}</h3>
          <span class="chat-subtitle">{{ chatSubtitle }}</span>
        </div>
      </div>
      <div class="header-right">
        <el-button type="text" icon="el-icon-more" @click="showChatInfo"></el-button>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="message-list" ref="messageList" @scroll="handleScroll">
      <div v-if="hasMore" class="load-more" @click="loadMore">
        <span>加载更多消息</span>
      </div>
      
      <div 
        v-for="(message, index) in messages" 
        :key="message.id || index"
        class="message-wrapper"
        :class="{ 'is-mine': message.fromUserId === currentUserId }"
      >
        <el-avatar 
          :size="36" 
          :src="message.fromUserId === currentUserId ? userAvatar : chatInfo.avatar"
        ></el-avatar>
        <div class="message-content">
          <div class="message-info">
            <span class="sender-name">{{ message.fromUserId === currentUserId ? '我' : chatInfo.name }}</span>
            <span class="message-time">{{ formatTime(message.msgTime) }}</span>
          </div>
          <div class="message-bubble" :class="'content-type-' + message.contentType">
            <!-- 文本消息 -->
            <div v-if="message.contentType === 1" class="text-message">
              {{ message.content }}
            </div>
            <!-- 图片消息 -->
            <div v-else-if="message.contentType === 2" class="image-message">
              <el-image :src="message.content" fit="cover" :preview-src-list="[message.content]"></el-image>
            </div>
            <!-- 其他类型 -->
            <div v-else class="other-message">
              [暂不支持的消息类型]
            </div>
          </div>
          <div v-if="message.status === 2" class="read-status">已读</div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <div class="input-toolbar">
        <el-button type="text" icon="el-icon-picture" @click="sendImage">图片</el-button>
        <el-button type="text" icon="el-icon-folder" @click="sendFile">文件</el-button>
      </div>
      <div class="input-box">
        <el-input
          v-model="inputMessage"
          type="textarea"
          :rows="4"
          placeholder="输入消息..."
          @keyup.enter.native="handleEnter"
          resize="none"
        ></el-input>
      </div>
      <div class="input-actions">
        <el-button size="small" @click="inputMessage = ''">清空</el-button>
        <el-button type="primary" size="small" @click="sendMessage" :loading="sending">
          发送 (Ctrl+Enter)
        </el-button>
      </div>
    </div>

    <!-- 群组信息抽屉 -->
    <group-info-drawer 
      v-if="chatInfo.type === 'group'"
      :show.sync="drawerVisible" 
      :group-info="chatInfo" 
    />
  </div>
</template>

<script>
import Global from '@/components/Global.vue'
import IMWebSocket from '@/api/im/websocket'
import messageApi from '@/api/im/message'
import { EventBus } from '@/api/event-bus'
import GroupInfoDrawer from './GroupInfoDrawer.vue'

export default {
  name: 'ChatWindow',
  components: {
    GroupInfoDrawer
  },
  props: {
    chatInfo: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      messages: [],
      inputMessage: '',
      sending: false,
      currentUserId: Global.user ? Global.user.id : null,
      userAvatar: Global.user ? Global.user.avatar : '',
      hasMore: false,
      oldestSeq: null,
      isTyping: false,
      typingTimer: null,
      drawerVisible: false
    }
  },
  computed: {
    chatSubtitle() {
      if (this.chatInfo.type === 'group') {
        return '群聊'
      }
      return '在线' // TODO: 实际在线状态
    }
  },
  watch: {
    chatInfo: {
      handler() {
        this.loadMessages()
      },
      immediate: true
    },
    inputMessage(val) {
      if (val && !this.isTyping) {
        this.sendTypingStatus()
      }
    }
  },
  created() {
    EventBus.$on('im-single-message', this.onReceiveMessage)
    EventBus.$on('im-group-message', this.onReceiveMessage)
    EventBus.$on('im-message-ack', this.onMessageAck)
    EventBus.$on('im-read-receipt', this.onReadReceipt)
  },
  beforeDestroy() {
    EventBus.$off('im-single-message', this.onReceiveMessage)
    EventBus.$off('im-group-message', this.onReceiveMessage)
    EventBus.$off('im-message-ack', this.onMessageAck)
    EventBus.$off('im-read-receipt', this.onReadReceipt)
  },
  methods: {
    async loadMessages() {
      try {
        const sessionType = this.chatInfo.type === 'single' ? 1 : 2
        const res = await messageApi.pullHistory(
          this.chatInfo.targetId,
          sessionType,
          null,
          50
        )
        // res is the R object, res.data is the list of messages
        const historyMessages = res.data || []
        // Backend returns DESC (newest first), reverse it for chronological display
        this.messages = historyMessages.reverse()
        this.hasMore = historyMessages.length >= 50
        if (this.messages.length > 0) {
          this.oldestSeq = this.messages[0].msgSeq
        }
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      } catch (error) {
        console.error('加载消息失败:', error)
      }
    },
    async loadMore() {
      if (!this.hasMore || !this.oldestSeq) return
      
      try {
        const sessionType = this.chatInfo.type === 'single' ? 1 : 2
        const res = await messageApi.pullHistory(
          this.chatInfo.targetId,
          sessionType,
          this.oldestSeq,
          50
        )
        const newMessages = res.data || []
        if (newMessages.length > 0) {
          this.oldestSeq = newMessages[newMessages.length - 1].msgSeq
          // Reverse and unshift
          this.messages.unshift(...newMessages.reverse())
        }
        this.hasMore = newMessages.length >= 50
      } catch (error) {
        console.error('加载更多消息失败:', error)
      }
    },
    sendMessage() {
      if (!this.inputMessage.trim()) {
        return
      }

      this.sending = true
      const content = this.inputMessage.trim()
      
      if (this.chatInfo.type === 'single') {
        IMWebSocket.sendSingleMessage(this.chatInfo.targetId, content, 1)
      } else {
        IMWebSocket.sendGroupMessage(this.chatInfo.targetId, content, 1)
      }

      // 添加到消息列表（乐观更新）
      this.messages.push({
        id: Date.now(),
        fromUserId: this.currentUserId,
        toUserId: this.chatInfo.type === 'single' ? this.chatInfo.targetId : null,
        toGroupId: this.chatInfo.type === 'group' ? this.chatInfo.targetId : null,
        content: content,
        contentType: 1,
        msgTime: Date.now(),
        status: 0 // 发送中
      })

      this.inputMessage = ''
      this.sending = false
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },
    handleEnter(e) {
      if (e.ctrlKey) {
        this.sendMessage()
      }
    },
    sendImage() {
      this.$message.info('图片发送功能开发中...')
    },
    sendFile() {
      this.$message.info('文件发送功能开发中...')
    },
    sendTypingStatus() {
      this.isTyping = true
      const sessionType = this.chatInfo.type === 'single' ? 1 : 2
      IMWebSocket.sendTyping(this.chatInfo.targetId, sessionType)
      
      if (this.typingTimer) {
        clearTimeout(this.typingTimer)
      }
      this.typingTimer = setTimeout(() => {
        this.isTyping = false
      }, 3000)
    },
    onReceiveMessage(message) {
      // 检查是否是当前会话的消息
      const isCurrentChat = 
        (this.chatInfo.type === 'single' && message.fromUserId == this.chatInfo.targetId) ||
        (this.chatInfo.type === 'group' && message.toGroupId == this.chatInfo.targetId)
      
      if (isCurrentChat) {
        this.messages.push(message)
        this.$nextTick(() => {
          this.scrollToBottom()
        })
        
        // 发送已读回执
        const sessionType = this.chatInfo.type === 'single' ? 1 : 2
        IMWebSocket.sendReadReceipt(this.chatInfo.targetId, sessionType, message.msgSeq)
      }
    },
    onMessageAck(ackMessage) {
      // 更新消息状态为已送达
      const message = this.messages.find(m => m.clientMsgId === ackMessage.clientMsgId)
      if (message) {
        message.status = 1
      }
    },
    onReadReceipt(receipt) {
      // 更新消息状态为已读
      const message = this.messages.find(m => m.msgSeq === receipt.msgSeq)
      if (message) {
        message.status = 2
      }
    },
    scrollToBottom() {
      if (this.$refs.messageList) {
        this.$refs.messageList.scrollTop = this.$refs.messageList.scrollHeight
      }
    },
    handleScroll(e) {
      // 检测是否滚动到顶部
      if (e.target.scrollTop === 0 && this.hasMore) {
        this.loadMore()
      }
    },
    formatTime(timestamp) {
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now - date
      
      if (diff < 60000) {
        return '刚刚'
      } else if (diff < 3600000) {
        return Math.floor(diff / 60000) + '分钟前'
      } else if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      } else {
        return date.toLocaleString('zh-CN', { 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }
    },
    showChatInfo() {
      if (this.chatInfo.type === 'group') {
        this.drawerVisible = true
      } else {
        this.$message.info('成员资料功能开发中...')
      }
    }
  }
}
</script>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 聊天头部 */
.chat-header {
  height: 60px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e0e0e0;
  background: #fff;
}

.header-left {
  display: flex;
  align-items: center;
}

.chat-title {
  margin-left: 12px;
}

.chat-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.chat-subtitle {
  font-size: 12px;
  color: #999;
}

/* 消息列表 */
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f5f5;
}

.load-more {
  text-align: center;
  padding: 10px;
  cursor: pointer;
  color: #07c160;
  font-size: 14px;
}

.load-more:hover {
  text-decoration: underline;
}

.message-wrapper {
  display: flex;
  margin-bottom: 20px;
}

.message-wrapper.is-mine {
  flex-direction: row-reverse;
}

.message-content {
  max-width: 60%;
  margin: 0 12px;
}

.message-wrapper.is-mine .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-info {
  margin-bottom: 6px;
  font-size: 12px;
  color: #999;
}

.sender-name {
  margin-right: 8px;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 8px;
  background: #fff;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-wrapper.is-mine .message-bubble {
  background: #95ec69;
}

.text-message {
  font-size: 14px;
  line-height: 1.6;
}

.image-message {
  max-width: 300px;
}

.image-message img {
  max-width: 100%;
  border-radius: 4px;
}

.read-status {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}

/* 输入区域 */
.input-area {
  border-top: 1px solid #e0e0e0;
  background: #fff;
}

.input-toolbar {
  padding: 10px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.input-box {
  padding: 0 20px;
}

.input-box >>> .el-textarea__inner {
  border: none;
  padding: 10px 0;
}

.input-actions {
  padding: 10px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
