<template>
  <div class="chat-bar-container">
    <el-popover
      placement="bottom-end"
      width="380"
      trigger="click"
      v-model="popoverVisible"
      popper-class="chat-popover"
      @show="handlePopoverShow"
    >
      <div class="chat-popover-container">
        <div class="chat-header">
          <div class="chat-title">
            <i class="el-icon-s-opportunity"></i>
            <h3>AI智能助手【思考完才回答】</h3>
          </div>
          <div class="chat-actions">
            <el-tooltip content="清除历史对话" placement="top">
              <el-button size="mini" type="text" icon="el-icon-delete" circle @click.stop="clearHistory"></el-button>
            </el-tooltip>
            <el-tooltip content="新会话" placement="top">
              <el-button size="mini" type="text" icon="el-icon-refresh" circle @click.stop="createNewSession"></el-button>
            </el-tooltip>
          </div>
        </div>

        <div class="chat-messages" ref="chatMessages">
          <template v-if="messages.length > 0">
            <div
              v-for="(message, index) in messages"
              :key="index"
              class="message-item"
              :class="{ 'user-message': message.isUser, 'ai-message': !message.isUser }"
            >
              <div class="message-avatar">
                <el-avatar :size="36" :src="message.isUser ? userAvatar : aiAvatar"></el-avatar>
              </div>
              <div class="message-content">
                <div class="message-text">{{ message.content }}</div>
                <div class="message-time">{{ message.time }}</div>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="empty-messages">
              <i class="el-icon-magic-stick"></i>
              <p>欢迎使用AI智能助手，有什么可以帮您？</p>
            </div>
          </template>
        </div>

        <div class="chat-input">
          <el-input
            v-model="messageInput"
            placeholder="输入你的问题..."
            @keyup.enter.native="sendMessage"
            :disabled="isLoading"
          >
            <el-button
              slot="append"
              icon="el-icon-s-promotion"
              type="primary"
              @click="sendMessage"
              :loading="isLoading"
            ></el-button>
          </el-input>
        </div>
      </div>

      <el-button slot="reference" type="info" plain class="ai-button">
        <i class="el-icon-s-opportunity"></i>
        AI智能助手
      </el-button>
    </el-popover>
  </div>
</template>

<script>
import chatApi from '@/api/chat/chat'
import Global from '@/components/Global.vue'

export default {
  name: 'ChatBar',
  data () {
    return {
      popoverVisible: false,
      messages: [],
      messageInput: '',
      isLoading: false,
      userAvatar: Global.user ? Global.user.avatar : 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
      aiAvatar: require('@/assets/ai-avatar.png')
    }
  },
  methods: {
    handlePopoverShow () {
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },
    scrollToBottom () {
      if (this.$refs.chatMessages) {
        this.$refs.chatMessages.scrollTop = this.$refs.chatMessages.scrollHeight
      }
    },
    sendMessage () {
      if (!this.messageInput.trim() || this.isLoading) return

      if (!Global.user) {
        this.$message.warning('请先登录再使用AI对话')
        return
      }

      // 添加用户消息
      const userMessage = {
        content: this.messageInput,
        isUser: true,
        time: this.formatTime(new Date())
      }
      this.messages.push(userMessage)

      // 清空输入框
      const userInput = this.messageInput
      this.messageInput = ''

      // 滚动到底部
      this.$nextTick(() => {
        this.scrollToBottom()
      })

      // 设置加载状态
      this.isLoading = true

      // 发送请求
      chatApi.sendMessage(userInput)
        .then(res => {
          // 添加AI回复
          const aiMessage = {
            content: res.data,
            isUser: false,
            time: this.formatTime(new Date())
          }
          this.messages.push(aiMessage)

          // 滚动到底部
          this.$nextTick(() => {
            this.scrollToBottom()
          })
        })
        .catch(err => {
          console.error('AI回复失败:', err)
          this.$message.error('AI回复失败，请稍后重试')
        })
        .finally(() => {
          this.isLoading = false
        })
    },
    clearHistory () {
      this.$confirm('确认清除所有历史对话记录？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        chatApi.clearHistory().then(() => {
          this.messages = []
          this.$message.success('历史记录已清除')
          // 保持弹出框打开状态
          this.popoverVisible = true
          // 聚焦输入框
          this.$nextTick(() => {
            const inputEl = this.$el.querySelector('.chat-input input')
            if (inputEl) {
              inputEl.focus()
            }
          })
        })
      }).catch(() => {})
    },
    createNewSession () {
      this.$confirm('确认开始新的对话会话？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        chatApi.createNewSession().then(() => {
          this.messages = []
          this.$message.success('新会话已创建')
          // 保持弹出框打开状态
          this.popoverVisible = true
          // 聚焦输入框
          this.$nextTick(() => {
            const inputEl = this.$el.querySelector('.chat-input input')
            if (inputEl) {
              inputEl.focus()
            }
          })
        })
      }).catch(() => {})
    },
    formatTime (date) {
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }
  }
}
</script>

<style scoped>
.chat-bar-container {
  display: inline-block;
}

.ai-button {
  background: linear-gradient(45deg, #3498db, #9b59b6);
  border: none;
  color: white;
  padding: 10px 15px;
  border-radius: 20px;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.ai-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
  opacity: 0.9;
  color: white;
  border: none;
}

.ai-button i {
  margin-right: 5px;
  font-size: 16px;
}

.chat-popover-container {
  display: flex;
  flex-direction: column;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(to bottom, #f9f9f9, #ffffff);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: linear-gradient(45deg, #3498db, #9b59b6);
  color: white;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.chat-title {
  display: flex;
  align-items: center;
}

.chat-title i {
  font-size: 20px;
  margin-right: 8px;
}

.chat-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.chat-actions {
  display: flex;
  gap: 5px;
}

.chat-actions button {
  color: white;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  background-color: #f9f9f9;
  border-left: 1px solid #eee;
  border-right: 1px solid #eee;
}

.message-item {
  display: flex;
  margin-bottom: 15px;
}

.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  margin: 0 8px;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message-text {
  padding: 10px 15px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.user-message .message-text {
  background: linear-gradient(45deg, #3498db, #9b59b6);
  color: white;
  border-top-right-radius: 4px;
}

.ai-message .message-text {
  background-color: white;
  color: #333;
  border-top-left-radius: 4px;
}

.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
  text-align: right;
}

.user-message .message-content {
  align-items: flex-end;
}

.ai-message .message-content {
  align-items: flex-start;
}

.chat-input {
  padding: 15px;
  background-color: white;
  border-top: 1px solid #eee;
}

.empty-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.empty-messages i {
  font-size: 48px;
  margin-bottom: 15px;
  background: linear-gradient(45deg, #3498db, #9b59b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.empty-messages p {
  font-size: 14px;
  opacity: 0.8;
}
</style>

<style>
/* 全局样式，确保弹出窗口在屏幕右侧 */
.chat-popover {
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: none;
  right: 0 !important;
}
</style>
