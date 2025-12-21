import request from '../request'

export default {
  getLivingStreams () {
    return request({
      url: '/live/livingList',
      method: 'get'
    })
  },
  getStream () {
    return request({
      url: '/live/getStream',
      method: 'get'
    })
  },
  notify (nick) {
    return request({
      url: '/live/notify',
      method: 'post',
      params: {
        nick: nick
      }
    })
  },
  unpublish () {
    return request({
      url: '/live/unpublish',
      method: 'post'
    })
  },
  getStatus (roomId) {
    return request({
      url: '/live/status',
      method: 'get',
      params: { roomId }
    })
  },
  // 修改支付接口为POST请求
  createPayment (amount) {
    return request({
      url: '/pay/paymoney',
      method: 'post', // 改为POST方法
      params: { // 或者使用 data 传递参数
        amount: amount
      }
    })
  },

  // 获取用户余额
  getBalance (userId) {
    return request({
      url: '/balance/info',
      method: 'get',
      params: { userId }
    })
  },

  // 充值
  recharge (userId, amount) {
    return request({
      url: '/balance/recharge',
      method: 'post',
      params: {
        userId,
        amount,
        orderId: 'RECHARGE_' + Date.now()
      }
    })
  },

  // 消费金币
  consumeCoins (userId, coins, businessId, remark) {
    return request({
      url: '/balance/consume',
      method: 'post',
      params: {
        userId,
        coins,
        businessId,
        remark
      }
    })
  }

}
