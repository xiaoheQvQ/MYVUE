import request from '../request'

const BASE_URL = '/im/message'

export default {
  /**
   * 发送单聊消息
   */
  sendSingleMessage(data) {
    return request.post(`${BASE_URL}/send/single`, data)
  },

  /**
   * 发送群聊消息
   */
  sendGroupMessage(data) {
    return request.post(`${BASE_URL}/send/group`, data)
  },

  /**
   * 拉取历史消息
   */
  pullHistory(targetId, sessionType, startSeq, limit = 50) {
    return request.get(`${BASE_URL}/history`, {
      params: { targetId, sessionType, startSeq, limit }
    })
  },

  /**
   * 获取未读消息数
   */
  getUnreadCount() {
    return request.get(`${BASE_URL}/unread/count`)
  },

  /**
   * 同步消息
   */
  syncMessages(lastSeq) {
    return request.post(`${BASE_URL}/sync`, null, {
      params: { lastSeq }
    })
  },

  /**
   * 上传聊天图片
   */
  uploadImage(file) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post(`${BASE_URL}/uploadImage`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /**
   * 上传语音消息
   */
  uploadVoice(file) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post(`${BASE_URL}/uploadVoice`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /**
   * 上传视频消息
   */
  uploadVideo(file) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post(`${BASE_URL}/uploadVideo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /**
   * 上传文件
   */
  uploadFile(file) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post(`${BASE_URL}/uploadFile`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}
