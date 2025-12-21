import request from '@/api/request'

const api = {
  /**
   * 获取弹幕列表（分页）
   * @param {Object} params 查询参数
   * @returns {Promise}
   */
  getCommentList (params) {
    return request({
      url: '/admin/comment/page',
      method: 'get',
      params
    })
  },

  /**
   * 删除弹幕
   * @param {number|string} id 弹幕ID
   * @returns {Promise}
   */
  deleteComment (id) {
    return request({
      url: `/admin/comment/delete/${id}`,
      method: 'delete'
    })
  },
  selectUserVideoStatsGroupByDay (userId) {
    return request({
      url: `/admin/video/selectUserVideoStatsGroupByDay`,
      method: 'get',
      params: {
        userId
      }
    })
  },
  getVideoStatsLast7Days (userId) {
    return request({
      url: `/admin/video/getVideoStatsLast7Days`,
      method: 'get',
      params: {
        userId
      }
    })
  }
}

export default api
