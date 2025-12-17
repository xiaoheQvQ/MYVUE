import request from '../request'

export default {
  getAvailablePlans() {
    return request({
      url: '/member/plans',
      method: 'get'
    })
  },
  
  getMemberInfo() {
    return request({
      url: '/member/info',
      method: 'get'
    })
  },
  
  purchaseMember( planId, useCoins = false) {
    return request({
      url: '/member/purchase',
      method: 'post',
      params: { planId, useCoins }
    })
  },
  
  renewMember( planId, useCoins = false) {
    return request({
      url: '/member/renew',
      method: 'post',
      params: {  planId, useCoins }
    })
  },
  
  checkMemberStatus() {
    return request({
      url: '/member/check',
      method: 'get'
    })
  }
}