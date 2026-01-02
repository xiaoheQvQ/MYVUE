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

      <div v-for="(message, index) in messages" :key="message.id || index" class="message-wrapper"
        :class="{ 'is-mine': message.fromUserId === currentUserId, 'is-system': message.msgType === 12 || message.fromUserId === 0 }">
        <!-- 系统消息/通知 -->
        <div v-if="message.msgType === 12 || message.fromUserId === 0" class="system-message">
          <span>{{ message.data || message.content }}</span>
        </div>

        <template v-else>
          <el-avatar :size="36"
            :src="message.fromUserAvatar || (message.fromUserId === currentUserId ? userAvatar : chatInfo.avatar)"></el-avatar>
          <div class="message-content">
            <div class="message-info">
              <span class="sender-name">{{ getSenderName(message) }}</span>
              <span class="message-time">{{ formatTime(message.msgTime) }}</span>
            </div>
            <div class="message-bubble" :class="'content-type-' + message.contentType">
              <!-- 文本内容 (无论是文本消息还是带图消息) -->
              <div
                v-if="message.content || message.contentType === 1 || message.atAll || (message.atUserIds && message.atUserIds.length > 0)"
                class="text-message">
                <span v-if="isAtMe(message)" class="at-me-text">[@我] </span>
                <span v-if="message.atAll || (message.atUserIds && message.atUserIds.length > 0)"
                  class="at-mention-text">
                  {{ message.atAll ? '@所有人' : getMentionNames(message.atUserIds) }}
                </span>
                {{ message.content }}
              </div>

              <!-- 图片内容 (无论是图片消息还是带文字的图片消息) -->
              <div v-if="message.mediaUrl || message.contentType === 2" class="image-message"
                :class="{ 'has-text': !!message.content }">
                <el-image :src="message.mediaUrl || message.content" fit="contain"
                  :preview-src-list="[message.mediaUrl || message.content]" lazy>
                  <div slot="error" class="image-error">
                    <i class="el-icon-picture-outline"></i>
                    <span>加载失败</span>
                  </div>
                </el-image>
              </div>

              <!-- 其他富媒体类型 -->
              <div v-if="message.contentType === 3" class="audio-message">
                [语音消息]
              </div>
              <div v-if="message.contentType === 4" class="video-message">
                [视频消息]
              </div>
              <div v-if="message.contentType === 5" class="file-message">
                [文件: {{ message.fileName }}]
              </div>
            </div>
            <div v-if="message.status === 2" class="read-status">已读</div>
          </div>
        </template>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <!-- 待发送图片预览 -->
      <div v-if="pendingImage" class="pending-image-preview">
        <div class="preview-container">
          <el-image :src="pendingImage.url" fit="cover"></el-image>
          <div class="remove-btn" @click="clearPendingImage">
            <i class="el-icon-close"></i>
          </div>
        </div>
      </div>
      <div class="input-toolbar">
        <el-button type="text" icon="el-icon-picture" @click="triggerImageUpload">图片</el-button>
        <el-button type="text" icon="el-icon-folder" @click="sendFile">文件</el-button>
        <input ref="imageInput" type="file" accept="image/*" style="display: none" @change="handleImageSelect" />
      </div>
      <div class="input-box">
        <el-popover v-model="showAtPopover" placement="top-start" width="150" trigger="manual">
          <div class="at-list">
            <div class="at-item" @click="selectAtAll">
              <el-avatar :size="20" icon="el-icon-user-solid"></el-avatar>
              <span>所有人 (@All)</span>
            </div>
            <div v-for="member in groupMembers" :key="member.userId" class="at-item" @click="selectAtMember(member)">
              <el-avatar :size="20" :src="member.avatar"></el-avatar>
              <span>{{ member.nickname || member.username }}</span>
            </div>
          </div>
          <el-input slot="reference" ref="inputRef" v-model="inputMessage" type="textarea" :rows="4"
            placeholder="输入消息，使用 @ 提到他人..." @keyup.enter.native="handleEnter" @input="handleInput"
            @keydown.native="handleKeyDown" resize="none"></el-input>
        </el-popover>
      </div>
      <div class="input-actions">
        <div v-if="atUserIds.length > 0 || atAll" class="at-meta">
          已@: {{ atLabels }}
          <el-button type="text" size="mini" @click="clearAt">清除@</el-button>
        </div>
        <el-button size="small" @click="clearInput">清空</el-button>
        <el-button type="primary" size="small" @click="sendMessage" :loading="sending">
          发送 (Ctrl+Enter)
        </el-button>
      </div>
    </div>

    <!-- 群组信息抽屉 -->
    <group-info-drawer v-if="chatInfo.type === 'group'" :show.sync="drawerVisible" :group-info="chatInfo" />
  </div>
</template>

<script>
import Global from '@/components/Global.vue'
import IMWebSocket from '@/api/im/websocket'
import messageApi from '@/api/im/message'
import groupApi from '@/api/im/group'
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
      drawerVisible: false,
      // @回复相关
      showAtPopover: false,
      groupMembers: [],
      atUserIds: [],
      atAll: false,
      atNames: [],
      // 待发送富媒体
      pendingImage: null
    }
  },
  computed: {
    chatSubtitle() {
      if (this.chatInfo.type === 'group') {
        return '群聊'
      }
      return '在线'
    },
    atLabels() {
      if (this.atAll) return '所有人'
      return this.atNames.join(', ')
    },
    // Bug4 Fix: Create member map for quick nickname lookup
    memberMap() {
      const map = {}
      this.groupMembers.forEach(m => {
        map[m.userId] = m.nick || m.nickname || m.username || `用户${m.userId}`
      })
      return map
    }
  },
  watch: {
    chatInfo: {
      handler() {
        this.loadMessages()
        if (this.chatInfo.type === 'group') {
          this.loadGroupMembers()
        }
        this.clearAt()
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
    EventBus.$on('im-group-notify', this.onGroupNotify)
  },
  beforeDestroy() {
    EventBus.$off('im-single-message', this.onReceiveMessage)
    EventBus.$off('im-group-message', this.onReceiveMessage)
    EventBus.$off('im-message-ack', this.onMessageAck)
    EventBus.$off('im-read-receipt', this.onReadReceipt)
    EventBus.$off('im-group-notify', this.onGroupNotify)
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
        const historyMessages = res.data || []
        // 解析历史消息的JSON content
        this.messages = historyMessages.reverse().map(msg => this.parseMessageContent(msg))
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
    // 解析消息内容（处理JSON格式的content）
    parseMessageContent(message) {
      if (!message.content) return message

      // 尝试解析JSON
      if (typeof message.content === 'string' && message.content.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(message.content)

          // 提取各个字段
          if (parsed.text !== undefined) {
            message.content = parsed.text
          }
          if (parsed.mediaUrl) {
            message.mediaUrl = parsed.mediaUrl
          }
          if (parsed.thumbnailUrl) {
            message.thumbnailUrl = parsed.thumbnailUrl
          }
          if (parsed.duration) {
            message.duration = parsed.duration
          }
          if (parsed.fileSize) {
            message.fileSize = parsed.fileSize
          }
          if (parsed.fileName) {
            message.fileName = parsed.fileName
          }
          if (parsed.atUserIds) {
            message.atUserIds = parsed.atUserIds
          }
          if (parsed.atAll !== undefined) {
            message.atAll = parsed.atAll
          }
        } catch (e) {
          // JSON解析失败，保持原样
          console.warn('解析消息内容失败:', e, message.content)
        }
      }

      return message
    },
    async loadGroupMembers() {
      try {
        const res = await groupApi.getGroupMembers(this.chatInfo.targetId)
        this.groupMembers = (res.data || []).filter(m => String(m.userId) !== String(this.currentUserId))
      } catch (error) {
        console.error('加载群成员失败:', error)
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
          // 解析并添加到消息列表前面
          const parsedMessages = newMessages.reverse().map(msg => this.parseMessageContent(msg))
          this.messages.unshift(...parsedMessages)
        }
        this.hasMore = newMessages.length >= 50
      } catch (error) {
        console.error('加载更多消息失败:', error)
      }
    },
    sendMessage() {
      if (!this.inputMessage.trim() && !this.pendingImage) {
        return
      }

      this.sending = true
      const content = this.inputMessage.trim()
      const mediaUrl = this.pendingImage ? this.pendingImage.url : null
      const contentType = mediaUrl ? 2 : 1 // 如果有图，类型设为图片(富媒体)

      const extraData = mediaUrl ? {
        mediaUrl: mediaUrl,
        fileSize: this.pendingImage.size,
        fileName: this.pendingImage.fileName
      } : null

      if (this.chatInfo.type === 'single') {
        IMWebSocket.sendSingleMessage(this.chatInfo.targetId, content, contentType, extraData)
      } else {
        IMWebSocket.sendGroupMessage(
          this.chatInfo.targetId,
          content,
          contentType,
          this.atUserIds.length > 0 ? this.atUserIds : null,
          this.atAll,
          extraData
        )
      }

      this.clearInput()
      this.pendingImage = null
      this.sending = false
    },
    clearInput() {
      this.inputMessage = ''
      this.clearAt()
    },
    clearAt() {
      this.atUserIds = []
      this.atAll = false
      this.atNames = []
      this.showAtPopover = false
    },
    // 清除待发送图片
    clearPendingImage() {
      this.pendingImage = null
    },
    handleEnter(e) {
      if (e.ctrlKey) {
        this.sendMessage()
      }
    },
    handleInput(val) {
      if (this.chatInfo.type !== 'group') return

      const cursorPos = this.$refs.inputRef.$refs.textarea.selectionStart
      const textBefore = val.slice(0, cursorPos)

      if (textBefore.endsWith('@')) {
        this.showAtPopover = true
      } else if (this.showAtPopover && (!val.includes('@') || val[cursorPos - 1] === ' ')) {
        this.showAtPopover = false
      }
    },
    handleKeyDown(e) {
      if (this.showAtPopover) {
        if (e.key === 'Escape') {
          this.showAtPopover = false
        }
      }
    },
    selectAtMember(member) {
      const name = member.nick || member.nickname || member.username || `用户${member.userId}`
      if (!this.atUserIds.includes(member.userId)) {
        this.atUserIds.push(member.userId)
        this.atNames.push(name)
      }
      this.inputMessage += name + ' '
      this.showAtPopover = false
      this.$refs.inputRef.focus()
    },
    // Bug6 Fix: Trigger image file selection
    triggerImageUpload() {
      this.$refs.imageInput.click()
    },
    // Bug6 Fix: Handle image upload
    async handleImageSelect(event) {
      const file = event.target.files[0]
      if (!file) return

      if (!file.type.startsWith('image/')) {
        this.$message.error('请选择图片文件')
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        this.$message.error('图片大小不能超过10MB')
        return
      }

      const loading = this.$loading({
        text: '上传中...',
        background: 'rgba(0, 0, 0, 0.7)'
      })

      try {
        const res = await messageApi.uploadImage(file)

        // 设为待发送状态，不立即发出
        const imageData = res.data
        this.pendingImage = {
          url: imageData.url || imageData,
          size: imageData.size,
          fileName: imageData.fileName || file.name
        }

        this.$message.success('图片已就绪，可输入文字后一同发送')
      } catch (error) {
        console.error('图片上传失败:', error)
        this.$message.error('图片上传失败')
      } finally {
        loading.close()
        event.target.value = ''
      }
    },
    sendFile() {
      this.$message.info('文件发送功能开发中...')
    },
    selectAtAll() {
      this.atAll = true
      this.inputMessage += '所有人 '
      this.showAtPopover = false
      this.$refs.inputRef.focus()
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
        (this.chatInfo.type === 'single' && String(message.fromUserId) === String(this.chatInfo.targetId)) ||
        (this.chatInfo.type === 'group' && String(message.toGroupId) === String(this.chatInfo.targetId))

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
    onGroupNotify(message) {
      if (String(message.toGroupId) === String(this.chatInfo.targetId)) {
        this.messages.push(message)
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
    },
    onMessageAck(ackMessage) {
      const message = this.messages.find(m => m.clientMsgId === ackMessage.clientMsgId)
      if (message) {
        message.status = 1
      }
    },
    onReadReceipt(receipt) {
      const message = this.messages.find(m => m.msgSeq === receipt.msgSeq)
      if (message) {
        message.status = 2
      }
    },
    isAtMe(message) {
      if (message.atAll) return true
      if (message.atUserIds && this.currentUserId) {
        return message.atUserIds.map(id => String(id)).includes(String(this.currentUserId))
      }
      return false
    },
    // 将用户ID列表转换为名称字符串
    getMentionNames(ids) {
      if (!ids || ids.length === 0) return ''
      return ids.map(id => {
        const name = this.memberMap[id] || `用户${id}`
        return `@${name}`
      }).join(' ')
    },
    scrollToBottom() {
      if (this.$refs.messageList) {
        this.$refs.messageList.scrollTop = this.$refs.messageList.scrollHeight
      }
    },
    handleScroll(e) {
      if (e.target.scrollTop === 0 && this.hasMore) {
        this.loadMore()
      }
    },
    formatTime(timestamp) {
      // Bug3 Fix: Handle invalid timestamps
      if (!timestamp || isNaN(timestamp)) {
        return ''
      }

      const date = new Date(timestamp)
      if (isNaN(date.getTime())) {
        return ''
      }

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
    // Bug4 Fix: Get sender name from member map
    getSenderName(message) {
      if (message.fromUserId === this.currentUserId) {
        return '我'
      }
      if (this.chatInfo.type === 'group' && this.memberMap[message.fromUserId]) {
        return this.memberMap[message.fromUserId]
      }
      return message.fromUserName || this.chatInfo.name
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

.message-wrapper.is-system {
  justify-content: center;
}

.system-message {
  background: rgba(0, 0, 0, 0.05);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  color: #999;
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
  position: relative;
}

.message-wrapper.is-mine .message-bubble {
  background: #95ec69;
}

.text-message {
  font-size: 14px;
  line-height: 1.6;
}

.at-me-text {
  color: #f56c6c;
  font-weight: bold;
}

.image-message {
  margin-top: 5px;
  max-width: 300px;
}

.image-message.has-text {
  margin-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding-top: 8px;
}

.image-message .el-image {
  max-width: 100%;
  border-radius: 4px;
  display: block;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
  font-size: 13px;
  padding: 20px;
  border-radius: 4px;
}

.image-error i {
  font-size: 24px;
  margin-bottom: 5px;
}

/* 待发送预览 */
.pending-image-preview {
  padding: 10px 20px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.preview-container {
  position: relative;
  display: inline-block;
  width: 80px;
  height: 80px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.preview-container .el-image {
  width: 100%;
  height: 100%;
}

.preview-container .remove-btn {
  position: absolute;
  top: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
}

.preview-container .remove-btn:hover {
  background: rgba(245, 108, 108, 0.8);
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

.input-box>>>.el-textarea__inner {
  border: none;
  padding: 10px 0;
}

.input-actions {
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.at-meta {
  flex: 1;
  font-size: 12px;
  color: #f56c6c;
}

/* @列表 */
.at-list {
  max-height: 200px;
  overflow-y: auto;
}

.at-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  gap: 8px;
  font-size: 13px;
}

.at-item:hover {
  background: #f5f5f5;
}
</style>
