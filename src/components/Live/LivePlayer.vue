<template>
  <div class="live-container">
    <!-- 余额显示 -->
    <div class="balance-display">
      <span class="balance-label">金币余额:</span>
      <span class="balance-value">{{ balance }}</span>
      <el-button type="text" @click="rechargeDialogVisible = true" class="recharge-btn">充值</el-button>
    </div>

    <div class="video-section">
      <div class="video-dplayer">
        <div id="dplayer"></div>
      </div>
      <div class="gift-section">
        <h3 class="section-title">🎁 礼物区</h3>
        <div class="gift-list">
          <div v-for="gift in gifts" :key="gift.id" class="gift-item" @click="sendGift(gift)">
            <img :src="gift.icon" :alt="gift.name" class="gift-icon">
            <span class="gift-name">{{ gift.name }}</span>
            <span class="gift-price">{{ gift.price }}金币</span>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-section">
      <!-- 聊天室部分保持不变 -->
      <div class="chat-header">
        <h3 class="section-title">💬 聊天室</h3>
        <el-dropdown v-if="isHost" trigger="click" @command="handleManagementCommand">
          <el-button type="primary" size="small" class="manage-btn">
            管理直播间<i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="notify">通知粉丝</el-dropdown-item>
            <el-dropdown-item command="endLive" divided>结束直播</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>

      <div class="chat-messages" ref="chatMessages">
        <div v-for="(message, index) in messages" :key="index" class="message"
             :class="{'message-self': message.userId === currentUserId}">
          <span class="message-user">
            {{ message.userName }}:
          </span>
          <span class="message-text">{{ message.text }}</span>
          <span class="message-time">{{ formatTime(message.time) }}</span>
        </div>
      </div>
      <div class="chat-input">
        <input v-model="newMessage" placeholder="输入聊天内容" @keyup.enter="sendMessage" />
        <button @click="sendMessage" class="send-btn">发送</button>
      </div>
    </div>

    <!-- 礼物支付弹窗 -->
    <el-dialog title="礼物支付" :visible.sync="payDialogVisible" width="30%" center>
      <div style="padding: 10px">
        <el-table :data="[currentGift]" border>
          <el-table-column label="礼物名称" prop="name" />
          <el-table-column label="价格">
            <template v-slot="scope">
              {{ scope.row.price }}金币
            </template>
          </el-table-column>
          <el-table-column label="当前余额">
            <template>
              {{ balance }}金币
            </template>
          </el-table-column>
        </el-table>

        <div style="margin-top: 20px; text-align: center">
          <el-button
            @click="payGift"
            type="primary"
            size="medium"
            :disabled="balance < currentGift.price"
            v-loading="payLoading"
          >
            确认支付
          </el-button>
          <el-button @click="payDialogVisible = false" type="info" size="medium">
            取消
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 充值弹窗 -->
    <el-dialog title="金币充值" :visible.sync="rechargeDialogVisible" width="30%" center>
      <div style="padding: 20px">
        <div style="margin-bottom: 20px">
          <span style="font-size: 16px">当前金币余额: </span>
          <span style="font-size: 18px; font-weight: bold; color: #FF9900">{{ balance }}金币</span>
        </div>

        <el-radio-group v-model="rechargeAmount" style="display: flex; flex-direction: column; gap: 15px">
          <el-radio :label="10">10元 (100金币)</el-radio>
          <el-radio :label="50">50元 (500金币)</el-radio>
          <el-radio :label="100">100元 (1000金币)</el-radio>
          <el-radio :label="500">500元 (5000金币)</el-radio>
        </el-radio-group>

        <div style="margin-top: 30px; text-align: center">
          <el-button
            @click="handleRecharge"
            type="primary"
            size="medium"
            v-loading="rechargeLoading"
          >
            立即充值
          </el-button>
          <el-button
            @click="rechargeDialogVisible = false"
            type="info"
            size="medium"
          >
            取消
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 支付结果弹窗 -->
    <el-dialog
      title="支付结果"
      :visible.sync="payResultDialogVisible"
      width="30%"
      center>
      <div style="text-align: center">
        <i :class="paySuccess ? 'el-icon-success success-icon' : 'el-icon-error error-icon'"></i>
        <p style="font-size: 18px; margin-top: 15px">{{ payResultMessage }}</p>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="payResultDialogVisible = false">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 结束直播确认对话框 -->
    <el-dialog
      title="提示"
      :visible.sync="endLiveDialogVisible"
      width="30%"
      center>
      <span>确定要结束当前直播吗？</span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="endLiveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEndLive" :loading="endingLive">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import DPlayer from 'dplayer'
import Hls from 'hls.js'
import Global from '@/components/Global.vue'
import liveApi from '@/api/live/live'

const baseUrl = 'http://localhost:8088'

export default {
  data () {
    return {
      currentUserId: Global.user ? String(Global.user.id) : null,
      currentUserName: Global.user ? Global.user.nick : '匿名用户',
      messages: [],
      newMessage: '',
      gifts: [
        { id: 1, name: '玫瑰', price: 10, icon: 'https://man-yue.oss-cn-beijing.aliyuncs.com/%E7%8E%AB%E7%91%B0%E8%8A%B1.png' },
        { id: 2, name: '跑车', price: 100, icon: 'https://man-yue.oss-cn-beijing.aliyuncs.com/%E8%B7%91%E8%BD%A6.png' },
        { id: 3, name: '火箭', price: 500, icon: 'https://man-yue.oss-cn-beijing.aliyuncs.com/%E7%81%AB%E7%AE%AD.png' },
        { id: 4, name: '飞机', price: 300, icon: 'https://man-yue.oss-cn-beijing.aliyuncs.com/%E9%A3%9E%E6%9C%BA.png' },
        { id: 5, name: '饮料', price: 1000, icon: 'https://man-yue.oss-cn-beijing.aliyuncs.com/%E9%A5%AE%E6%96%99.png' },
        { id: 6, name: '蛋糕', price: 50, icon: 'https://man-yue.oss-cn-beijing.aliyuncs.com/%E8%9B%8B%E7%B3%95.png' }
      ],
      dp: null,
      chatChannel: null,
      payDialogVisible: false,
      payLoading: false,
      endLiveDialogVisible: false,
      endingLive: false,
      currentGift: {
        price: 0,
        name: '',
        id: null,
        icon: ''
      },
      hls: null,
      balance: 0,
      rechargeDialogVisible: false,
      rechargeAmount: 100,
      rechargeLoading: false,
      payResultDialogVisible: false,
      paySuccess: false,
      payResultMessage: '',
      pollingInterval: null
    }
  },
  props: {
    roomId: {type: String, required: true},
    nick: {type: String, required: true},
    live_from: {type: String, required: true},
    visit_id: {type: String, required: true}
  },
  computed: {
    isHost () {
      return this.roomId === this.currentUserId
    }
  },
  async mounted () {
    await this.checkBalance()
    this.initPlayer()
    this.initWebSocket()
    this.checkPayCallback()
  },
  beforeDestroy () {
    this.cleanupWebSocket()
    this.destroyPlayer()
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
    }
  },
  methods: {
    async checkBalance () {
      try {
        const response = await liveApi.getBalance()
        this.balance = response.data.coinBalance || 0
      } catch (error) {
        console.error('获取余额失败:', error)
        this.$message.error('获取余额失败')
      }
    },

    async sendGift (gift) {
      this.currentGift = gift

      // 检查余额
      if (this.balance < gift.price) {
        this.$confirm(`您的金币不足，当前余额${this.balance}金币，需要${gift.price}金币，是否立即充值?`, '金币不足', {
          confirmButtonText: '立即充值',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.rechargeDialogVisible = true
        })
        return
      }

      this.payDialogVisible = true
    },

    async payGift () {
      if (!this.currentGift) return

      this.payLoading = true
      const gift = this.currentGift

      try {
        // 扣除金币
        const businessId = `GIFT_${Date.now()}`
        await liveApi.consumeCoins(

          gift.price,
          businessId,
          `赠送礼物: ${gift.name}`
        )

        // 发送礼物消息
        if (Global.socket && Global.socket.readyState === WebSocket.OPEN) {
          const message = {
            type: 'LIVE_GIFT_MESSAGE',
            roomId: this.roomId,
            userId: this.currentUserId,
            userName: this.currentUserName,
            giftId: gift.id,
            giftName: gift.name,
            giftPrice: gift.price,
            time: new Date().getTime()
          }

          Global.socket.send(JSON.stringify(message))
        }

        this.paySuccess = true
        this.payResultMessage = '礼物发送成功！'
        this.payResultDialogVisible = true
        this.payDialogVisible = false
        await this.checkBalance()
      } catch (error) {
        console.error('支付失败:', error)
        this.paySuccess = false
        this.payResultMessage = '支付失败: ' + (error.message || '')
        this.payResultDialogVisible = true
      } finally {
        this.payLoading = false
      }
    },

    async handleRecharge () {
      this.rechargeLoading = true
      try {
        // 创建充值订单
        const orderRes = await liveApi.createRechargeOrder(
          this.rechargeAmount,
          `金币充值-${this.rechargeAmount}元`
        )

        const orderId = orderRes.data.orderId
        const amount = this.rechargeAmount

        // 打开支付宝支付页面
        const payUrl = `${baseUrl}/alipay/pay?traceNo=${orderId}&totalAmount=${amount}&subject=金币充值`
        const newWindow = window.open(payUrl, '_blank')

        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          this.$message.warning('请允许弹出窗口以完成支付')
          this.rechargeLoading = false
          return
        }

        // 开始轮询检查支付状态
        this.startPollingPaymentStatus(orderId, amount)

        this.rechargeDialogVisible = false
        this.$message.info('请在支付宝页面完成支付')
      } catch (error) {
        console.error('充值失败:', error)
        this.$message.error('充值失败: ' + (error.message || ''))
        this.rechargeLoading = false
      }
    },

    startPollingPaymentStatus (orderId, amount) {
      // 先清除之前的轮询
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval)
      }

      // 开始新的轮询
      this.pollingInterval = setInterval(async () => {
        try {
          const res = await liveApi.checkPaymentStatus(orderId)
          if (res.data.paid) {
            clearInterval(this.pollingInterval)

            // 支付成功，更新余额
            await liveApi.recharge(amount, orderId)
            await this.checkBalance()

            this.paySuccess = true
            this.payResultMessage = `充值成功！${amount}元已到账`
            this.payResultDialogVisible = true
          }
        } catch (error) {
          console.error('检查支付状态失败:', error)
        }
      }, 3000) // 每3秒检查一次
    },

    // ... 其他现有方法保持不变
    handleManagementCommand (command) {
      if (command === 'notify') {
        this.notifyFans()
      } else if (command === 'endLive') {
        this.endLiveDialogVisible = true
      }
    },

    notifyFans () {
      if (!this.nick) {
        console.error('用户昵称未定义')
        return
      }
      liveApi.notify(this.nick).then(() => {
        this.$message.success('已通知粉丝')
      })
        .catch(error => {
          console.error('通知粉丝失败:', error)
          this.$message.error('通知粉丝失败')
        })
    },

    async confirmEndLive () {
      this.endingLive = true
      try {
        await liveApi.unpublish()
        this.$message.success('直播已结束')
        this.endLiveDialogVisible = false

        // 通知所有观众直播已结束
        if (Global.socket && Global.socket.readyState === WebSocket.OPEN) {
          Global.socket.send(JSON.stringify({
            type: 'LIVE_ENDED',
            roomId: this.roomId,
            userId: this.currentUserId,
            userName: this.currentUserName
          }))
        }

        // 销毁播放器
        this.destroyPlayer()

        // 如果是主播，跳转到其他页面
        if (this.isHost) {
          setTimeout(() => {
            this.$router.push('/liveSpm')
          }, 1500)
        }
      } catch (error) {
        console.error('结束直播失败:', error)
        this.$message.error('结束直播失败')
      } finally {
        this.endingLive = false
      }
    },

    destroyPlayer () {
      if (this.dp) {
        this.dp.destroy()
        this.dp = null
      }
      if (this.hls) {
        this.hls.destroy()
        this.hls = null
      }
    },

    checkPayCallback () {
      const urlParams = new URLSearchParams(window.location.search)
      const paySuccess = urlParams.get('pay_success')
      const orderId = urlParams.get('order_id')
      const amount = urlParams.get('amount')

      if (paySuccess === 'true' && orderId) {
        this.paySuccess = true
        this.payResultMessage = `支付成功！订单号: ${orderId}, 金额: ${amount}元`
        this.payResultDialogVisible = true

        // 更新余额
        this.checkBalance()

        // 清除URL参数
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    },

    initPlayer () {
      const videoUrl = 'http://8.140.29.27:8080/live/livestream.m3u8'

      if (Hls.isSupported()) {
        this.hls = new Hls()
        this.hls.loadSource(videoUrl)

        this.dp = new DPlayer({
          container: document.getElementById('dplayer'),
          live: true,
          video: {
            url: videoUrl,
            type: 'hls',
            customType: {
              hls: (video, player) => {
                this.hls.attachMedia(video)
                this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                  video.play()
                })
                this.hls.on(Hls.Events.ERROR, (event, data) => {
                  if (data.fatal) {
                    switch (data.type) {
                      case Hls.ErrorTypes.NETWORK_ERROR:
                        console.error('网络错误，尝试重新加载')
                        this.hls.startLoad()
                        break
                      case Hls.ErrorTypes.MEDIA_ERROR:
                        console.error('媒体错误，尝试恢复')
                        this.hls.recoverMediaError()
                        break
                      default:
                        console.error('无法恢复的错误')
                        this.initPlayer()
                        break
                    }
                  }
                })
              }
            }
          },
          autoplay: true
        })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        this.dp = new DPlayer({
          container: document.getElementById('dplayer'),
          video: {
            url: videoUrl,
            type: 'auto'
          },
          autoplay: true
        })
      } else {
        this.$message.error('您的浏览器不支持播放此视频')
      }
    },

    initWebSocket () {
      if (!Global.socket) {
        console.error('WebSocket连接未初始化')
        return
      }

      this.chatChannel = `live_room_${this.roomId}`

      Global.socket.addEventListener('message', this.handleSocketMessage)

      this.joinLiveRoom()
      this.loadHistoryMessages()
    },

    cleanupWebSocket () {
      if (Global.socket && this.chatChannel) {
        this.leaveLiveRoom()
        Global.socket.removeEventListener('message', this.handleSocketMessage)
      }
    },

    joinLiveRoom () {
      if (Global.socket && Global.socket.readyState === WebSocket.OPEN) {
        Global.socket.send(JSON.stringify({
          type: 'JOIN_LIVE_ROOM',
          roomId: this.roomId,
          userId: String(this.currentUserId),
          userName: this.currentUserName
        }))
      }
    },

    leaveLiveRoom () {
      if (Global.socket && Global.socket.readyState === WebSocket.OPEN) {
        Global.socket.send(JSON.stringify({
          type: 'LEAVE_LIVE_ROOM',
          roomId: this.roomId,
          username: this.currentUserName,
          userId: String(this.currentUserId)
        }))
      }
    },

    sendMessage () {
      if (!this.newMessage.trim()) return

      if (Global.socket && Global.socket.readyState === WebSocket.OPEN) {
        const message = {
          type: 'LIVE_CHAT_MESSAGE',
          roomId: this.roomId,
          userId: String(this.currentUserId),
          userName: this.currentUserName,
          text: this.newMessage,
          time: new Date().getTime()
        }

        Global.socket.send(JSON.stringify(message))
        this.newMessage = ''
        this.scrollToBottom()
      } else {
        console.error('WebSocket连接不可用')
      }
    },

    handleSocketMessage (event) {
      try {
        const message = JSON.parse(event.data)

        if (message.type === 'LIVE_CHAT_MESSAGE') {
          this.handleChatMessage(message)
        } else if (message.type === 'LIVE_GIFT_MESSAGE') {
          this.handleGiftMessage(message)
        } else if (message.type === 'LIVE_ENDED') {
          this.handleLiveEnded(message)
        } else if (message.type === 'LIVE_USER_JOIN') {
          this.handleUserJoin(message)
        } else if (message.type === 'LIVE_USER_LEAVE') {
          this.handleUserLeave(message)
        }
      } catch (error) {
        console.error('处理WebSocket消息出错:', error)
      }
    },

    handleChatMessage (message) {
      if (message.roomId === this.roomId) {
        this.messages.push({
          userId: String(message.userId),
          userName: message.userName,
          text: message.text,
          time: message.time || new Date().getTime()
        })
        this.scrollToBottom()
      }
    },

    handleGiftMessage (message) {
      if (message.roomId === this.roomId) {
        this.messages.push({
          userId: String(message.userId),
          userName: message.userName,
          text: `送出了${message.giftName}`,
          time: message.time || new Date().getTime(),
          isGift: true
        })
        this.scrollToBottom()
      }
    },

    handleLiveEnded (message) {
      if (message.roomId === this.roomId) {
        this.messages.push({
          userId: 'system',
          userName: '系统通知',
          text: '直播已结束',
          time: new Date().getTime()
        })
        this.scrollToBottom()

        this.destroyPlayer()
      }
    },

    handleUserJoin (message) {
      if (message.roomId === this.roomId) {
        this.messages.push({
          userId: 'system',
          userName: '系统通知',
          text: `${message.userName} 进入了直播间`,
          time: new Date().getTime()
        })
        this.scrollToBottom()
      }
    },

    handleUserLeave (message) {
      if (message.roomId === this.roomId) {
        this.messages.push({
          userId: 'system',
          userName: '系统通知',
          text: `${message.username} 离开了直播间`,
          time: new Date().getTime()
        })
        this.scrollToBottom()
      }
    },

    async loadHistoryMessages () {
      try {
        // 这里可以调用API获取历史消息
      } catch (error) {
        console.error('加载聊天记录失败:', error)
      }
    },

    scrollToBottom () {
      this.$nextTick(() => {
        const container = this.$refs.chatMessages
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    },

    formatTime (timestamp) {
      const date = new Date(timestamp)
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }
  }
}
</script>

<style scoped>
.live-container {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  gap: 20px;
  width: 100%;
  height: 680px;
  position: relative;
}

.balance-display {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.6);
  padding: 5px 15px;
  border-radius: 20px;
  color: white;
  z-index: 100;
  display: flex;
  align-items: center;
}

.balance-label {
  margin-right: 5px;
}

.balance-value {
  color: #FFD700;
  font-weight: bold;
  margin-right: 10px;
}

.recharge-btn {
  color: #FFD700;
  padding: 0;
  margin-left: 5px;
}

.video-section {
  flex: 2;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.video-dplayer {
  width: 100%;
  height: 350px;
  background-color: #6a9e25;
  border-radius: 8px;
  overflow: hidden;
}

.gift-section {
  flex: 1;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-top: 20px;
  background: #fff;
  display: flex;
  flex-direction: column;
  height: calc(100% - 370px);
  min-height: 280px;
}

.section-title {
  color: #333;
  font-size: 18px;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 2px solid #7fb42b;
}

.chat-section {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 35%;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  background: #fff;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.manage-btn {
  background-color: #7fb42b;
  border-color: #7fb42b;
}

.manage-btn:hover {
  background-color: #6a9e25;
  border-color: #6a9e25;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 15px;
  border-radius: 8px;
  width: 100%;
  padding: 10px;
  background: #f9f9f9;
}

.message {
  margin-bottom: 10px;
  padding: 10px 15px;
  border-radius: 15px;
  background: #ffffff;
  word-break: break-word;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.message-self {
  background: #7fb42b;
  color: white;
  text-align: left;
}

.message-self .message-user,
.message-self .message-text,
.message-self .message-time {
  color: white;
}

.message-user {
  font-weight: bold;
  margin-right: 5px;
  color: #333;
}

.message-text {
  color: #555;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-left: 5px;
  float: right;
}

.chat-input {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: white;
  border-radius: 10px;
  width: 95%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.chat-input input {
  flex: 1;
  border: 1px solid #e0e0e0;
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 14px;
  transition: all 0.3s;
}

.chat-input input:focus {
  outline: none;
  border-color: #7fb42b;
  box-shadow: 0 0 0 2px rgba(127, 180, 43, 0.2);
}

.send-btn {
  padding: 8px 20px;
  background-color: #7fb42b;
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.send-btn:hover {
  background-color: #6a9e25;
  transform: translateY(-1px);
}

.gift-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-top: 5px;
  overflow-y: auto;
  padding: 5px;
  flex: 1;
}

.gift-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  background: #f8f8f8;
  cursor: pointer;
  transition: all 0.3s;
  height: 100px;
  box-sizing: border-box;
}

.gift-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  background: #fff;
}

.gift-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 5px;
  object-fit: contain;
}

.gift-name {
  font-weight: bold;
  margin-bottom: 3px;
  color: #333;
  font-size: 14px;
  text-align: center;
}

.gift-price {
  color: #ff9800;
  font-size: 12px;
  text-align: center;
}

.success-icon {
  font-size: 50px;
  color: #67C23A;
}

.error-icon {
  font-size: 50px;
  color: #F56C6C;
}
</style>
