// apis.js
import request from '../request'
import JSEncrypt from 'jsencrypt'

const api = {
  getCaptcha (email) {
    return request({
      url: `user/mail-captcha?email=${email}`,
      method: 'post'
    })
  },
  loginSuccess (app, res) {
    app.$message.success(res.msg)
    localStorage.setItem('accessToken', res.data.accessToken)
    localStorage.setItem('refreshToken', res.data.refreshToken)
    app.$router.push('/')
    location.reload()
  },
  login (user) {
    return request({
      url: '/user/login',
      method: 'post',
      data: {
        'email': encode(user.email),
        'password': encode(user.password),
        'type': user.type
      }
    })
  },
  refresh (refreshToken) {
    return request({
      url: `/user/refresh-token?refreshToken=${refreshToken}`,
      method: 'put'
    })
  },
  signup (user) {
    user.email = encode(user.email)
    user.password = encode(user.password)
    return request({
      url: '/user/signup',
      method: 'post',
      data: user
    })
  },
  getInfo () {
    return request({
      url: '/user/info',
      method: 'get'
    })
  },
  logout () {
    return request({
      url: '/user/logout',
      method: 'delete'
    })
  },
  getMsg () {
    return request({
      url: '/user/subscribe/msg',
      method: 'get'
    })
  },
  consumeMsg (index) {
    return request({
      url: `/user/subscribe/msg/${index}`,
      method: 'delete'
    })
  },
  consumePrivateMsg (index) {
    return request({
      url: `/user/subscribe/chatMsg/${index}`,
      method: 'delete'
    })
  },
  consumeAllMsg () {
    return request({
      url: '/user/subscribe/msg/all',
      method: 'delete'
    })
  },
  consumeAllChatMsg () {
    return request({
      url: '/user/subscribe/chatMsg/all',
      method: 'delete'
    })
  },
  subscribe (userId) {
    return request({
      url: `/user/subscribe/${userId}`,
      method: 'post'
    })
  },
  cancelSubscribe (userId) {
    return request({
      url: `/user/subscribe/${userId}`,
      method: 'delete'
    })
  },
  getIsSubscribe (userId) {
    return request({
      url: `/user/is-subscription/${userId}`,
      method: 'get'
    })
  },
  updateInfo (user) {
    let formData = new FormData()
    if (user.avatarFile) {
      formData.append('avatarFile', user.avatarFile)
    }
    formData.append('id', user.id)
    formData.append('nick', user.nick)
    formData.append('gender', user.gender)
    formData.append('sign', user.sign)
    formData.append('birth', user.birth)
    return request({
      url: `/user/info`,
      method: 'put',
      headers: {
        'Content-Type': 'multipart/form-data' // 设置请求头为multipart/form-data
      },
      data: formData
    })
  },
  getUserInfo (id) {
    return request({
      url: `/user/info/${id}`,
      method: 'get'
    })
  },
  getSubscriptions () {
    return request({
      url: '/user/subscription',
      method: 'get'
    })
  },
  getSubscribedList () {
    return request({
      url: '/user/subscribed',
      method: 'get'
    })
  },
  searchUsers (params) {
    return request({
      url: '/user/search',
      method: 'get',
      params
    })
  },
  checkSubscription (userId) {
    return request({
      url: `/user/is-subscription/${userId}`,
      method: 'get'
    })
  },
  unsubscribe (userId) {
    return request({
      url: `/user/subscribe/${userId}`,
      method: 'delete'
    })
  },
  getNewVideoNotifications () {
    return request({
      url: '/video/new-video-notifications',
      method: 'get'
    })
  }
}

const encryptor = new JSEncrypt()
const publicKey = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCRgzk2FilxvtmiAowOdk4zKON6fMPq3tFz+2f5RDC152fGGWWGgxBtjz3jdJ3kcQVStij5Mkf6Ak3C7vUpTtjBMGJCfDwfXkL0DXGTRTlbhLep2N8LxMAv/nh2yibiO8vaDZiPt20AGX6FPgi/C82gq5MTk+DBkdWk0v6Llkzm/QIDAQAB'
encryptor.setPublicKey(publicKey)
function encode (content) {
  return encryptor.encrypt(content)
}

export default api
