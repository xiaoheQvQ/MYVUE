import request from '../request'

const chat = {
  /**
   * 发送聊天消息
   * @param {string} content 聊天内容
   * @returns {Promise} 请求Promise
   */
  sendMessage (content) {
    return request({
      url: '/chat/message',
      method: 'post',
      data: {
        content
      }
    })
  },

  /**
   * 清除聊天历史
   * @returns {Promise} 请求Promise
   */
  clearHistory () {
    return request({
      url: '/chat/clear',
      method: 'post'
    })
  },

  /**
   * 创建新的聊天会话
   * @returns {Promise} 请求Promise
   */
  createNewSession () {
    return request({
      url: '/chat/new-session',
      method: 'post'
    })
  },
  getChatHistory (params) {
    return request({
      url: '/chat/message/history',
      method: 'get',
      params
    })
  },
  sendPrivateMessage (data) {
    return request({
      url: '/chat/message/send',
      method: 'post',
      data,
      headers: {
        'Content-Type': 'application/json' // 明确设置Content-Type
      }
    })
  },
  sendPrivateVideoChatMessage (data) {
    return request({
      url: '/chat/videoChatMessage/send',
      method: 'post',
      data,
      headers: {
        'Content-Type': 'application/json' // 明确设置Content-Type
      }
    })
  },
  sendPrivateVideoChatResponseMessage (data) {
    return request({
      url: '/chat/videoChatResponseMessage/send',
      method: 'post',
      data,
      headers: {
        'Content-Type': 'application/json' // 明确设置Content-Type
      }
    })
  },
  sendPrivateVideoChatEndMessage (data) {
    return request({
      url: '/chat/videoChatEndmessage/send',
      method: 'post',
      data,
      headers: {
        'Content-Type': 'application/json' // 明确设置Content-Type
      }
    })
  },
  /**
   * 检查用户是否在线
   */
  checkUserOnline (userId) {
    return request({
      url: '/chat/online',
      method: 'get',
      params: {
        userId
      }
    })
  }

}

export default chat
