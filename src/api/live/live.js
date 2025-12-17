import request from '../request'

export default {
  getLivingStreams() {
    return request({
      url: '/live/livingList',
      method: 'get'
    })
  },
  
  getStream() {
    return request({
      url: '/live/getStream',
      method: 'get'
    })
  },
  
  notify(nick) {
    return request({
      url: '/live/notify',
      method: 'post',
      params: {
        nick: nick
      }
    })
  },
  
  unpublish() {
    return request({
      url: '/live/unpublish',
      method: 'post',
    })
  },
  
  getStatus(roomId) {
    return request({
      url: '/live/status',
      method: 'get',
      params: { roomId }
    })
  },
  
  // 余额相关API
  getBalance() {
    return request({
      url: '/balance/info',
      method: 'get'
    })
  },
  
  recharge(amount, orderId) {
    return request({
      url: '/balance/recharge',
      method: 'post',
      params: { 

        amount,
        orderId
      }
    })
  },
  
  consumeCoins( coins, businessId, remark) {
    return request({
      url: '/balance/consume',
      method: 'post',
      params: {
        coins,
        businessId,
        remark
      }
    })
  },
  
  // 支付接口
  createRechargeOrder(amount, subject) {
    return request({
      url: '/alipay/create-order',
      method: 'get',
      params: {
        amount,
        subject
      }
    })
  },
  
  checkPaymentStatus(orderId) {
    return request({
      url: '/alipay/check-pay',
      method: 'get',
      params: {
        orderId
      }
    })
  },



}