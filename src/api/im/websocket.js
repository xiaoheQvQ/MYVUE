import { EventBus } from '@/api/event-bus'

/**
 * IM WebSocket管理器
 * 负责与后端Netty服务器建立WebSocket连接
 */
class IMWebSocket {
  constructor () {
    this.ws = null
    this.url = 'ws://localhost:9000/ws/im'
    this.isConnected = false
    this.reconnectTimer = null
    this.heartbeatTimer = null
    this.heartbeatInterval = 30000 // 30秒心跳
    this.reconnectInterval = 5000 // 5秒重连
    this.messageQueue = [] // 消息队列
    this.token = null
    this.userId = null
  }

  /**
   * 连接WebSocket
   */
  connect (token, userId) {
    if (this.ws && this.isConnected) {
      console.log('IM WebSocket已连接')
      return
    }

    this.token = token
    this.userId = userId

    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        console.log('IM WebSocket连接成功')
        this.isConnected = true
        this.sendAuth()
        this.startHeartbeat()
        this.flushMessageQueue()
        EventBus.$emit('im-ws-connected')
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data)
      }

      this.ws.onerror = (error) => {
        console.error('IM WebSocket错误:', error)
        EventBus.$emit('im-ws-error', error)
      }

      this.ws.onclose = () => {
        console.log('IM WebSocket连接关闭')
        this.isConnected = false
        this.stopHeartbeat()
        EventBus.$emit('im-ws-disconnected')
        this.reconnect()
      }
    } catch (error) {
      console.error('IM WebSocket连接失败:', error)
      this.reconnect()
    }
  }

  /**
   * 发送认证消息
   */
  sendAuth () {
    const authMsg = {
      msgType: 1, // 认证
      token: this.token,
      userId: this.userId,
      msgTime: Date.now()
    }
    this.send(authMsg)
  }

  /**
   * 开始心跳
   */
  startHeartbeat () {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        const heartbeatMsg = {
          msgType: 2, // 心跳
          msgTime: Date.now()
        }
        this.send(heartbeatMsg)
      }
    }, this.heartbeatInterval)
  }

  /**
   * 停止心跳
   */
  stopHeartbeat () {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 重连
   */
  reconnect () {
    if (this.reconnectTimer) {
      return
    }

    this.reconnectTimer = setTimeout(() => {
      console.log('尝试重连IM WebSocket...')
      this.reconnectTimer = null
      if (this.token && this.userId) {
        this.connect(this.token, this.userId)
      }
    }, this.reconnectInterval)
  }

  /**
   * 发送消息
   */
  send (message) {
    if (!this.isConnected || !this.ws) {
      console.log('WebSocket未连接，消息加入队列')
      this.messageQueue.push(message)
      return false
    }

    try {
      this.ws.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('发送消息失败:', error)
      this.messageQueue.push(message)
      return false
    }
  }

  /**
   * 刷新消息队列
   */
  flushMessageQueue () {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift()
      this.send(message)
    }
  }

  /**
   * 处理接收到的消息
   */
  handleMessage (data) {
    try {
      const message = JSON.parse(data)
      console.log('收到IM消息:', message)

      switch (message.msgType) {
        case 2: // 心跳
          // 心跳包无需处理
          break
        case 3: // 单聊消息
          this.sendAck(message.msgSeq)
          EventBus.$emit('im-single-message', message)
          break
        case 4: // 群聊消息
          this.sendAck(message.msgSeq)
          EventBus.$emit('im-group-message', message)
          break
        case 5: // ACK确认
          EventBus.$emit('im-message-ack', message)
          break
        case 6: // 已读回执
          EventBus.$emit('im-read-receipt', message)
          break
        case 7: // 正在输入
          EventBus.$emit('im-typing', message)
          break
        case 9: // 同步响应
          EventBus.$emit('im-sync-response', message)
          break
        case 10: // 在线状态
          EventBus.$emit('im-online-status', message)
          break
        case 11: // 好友申请
          EventBus.$emit('im-friend-apply', message)
          break
        case 12: // 群组通知
          EventBus.$emit('im-group-notify', message)
          break
        default:
          console.log('未知消息类型:', message.msgType)
      }
    } catch (error) {
      console.error('解析消息失败:', error)
    }
  }

  /**
   * 发送单聊消息
   */
  sendSingleMessage (toUserId, content, contentType = 1, extraData = null) {
    const message = {
      msgType: 3,
      clientMsgId: this.generateMsgId(),
      fromUserId: this.userId,
      toUserId: toUserId,
      content: content,
      contentType: contentType,
      msgTime: Date.now()
    }
    
    // 合并富媒体字段
    if (extraData) {
      Object.assign(message, extraData)
    }
    
    return this.send(message)
  }

  /**
   * 发送群聊消息
   */
  sendGroupMessage (toGroupId, content, contentType = 1, atUserIds = null, atAll = false, extraData = null) {
    const message = {
      msgType: 4,
      clientMsgId: this.generateMsgId(),
      fromUserId: this.userId,
      toGroupId: toGroupId,
      content: content,
      contentType: contentType,
      atUserIds: atUserIds,
      atAll: atAll,
      msgTime: Date.now()
    }
    
    // 合并富媒体字段
    if (extraData) {
      Object.assign(message, extraData)
    }
    
    return this.send(message)
  }

  /**
   * 发送ACK
   */
  sendAck (msgSeq) {
    if (!msgSeq) return
    const message = {
      msgType: 5,
      msgSeq: msgSeq,
      fromUserId: this.userId,
      msgTime: Date.now()
    }
    this.send(message)
  }

  /**
   * 发送已读回执
   */
  sendReadReceipt (targetId, sessionType, msgSeq) {
    const message = {
      msgType: 6,
      sessionType: sessionType,
      targetId: targetId,
      msgSeq: msgSeq,
      msgTime: Date.now()
    }
    this.send(message)
  }

  /**
   * 发送正在输入
   */
  sendTyping (targetId, sessionType) {
    const message = {
      msgType: 7,
      sessionType: sessionType,
      targetId: targetId,
      msgTime: Date.now()
    }
    this.send(message)
  }

  /**
   * 生成消息ID
   */
  generateMsgId () {
    return `${this.userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 断开连接
   */
  disconnect () {
    this.stopHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
  }
}

// 单例模式
export default new IMWebSocket()
