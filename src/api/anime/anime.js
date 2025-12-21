import request from '../request'

export default {
  uploadAnime (data, config) {
    return request({
      url: '/anime/upload',
      method: 'post',
      data,
      ...config
    })
  },

  // 获取番剧列表
  listAnimeSeries (params) {
    return request({
      url: '/anime/list',
      method: 'get',
      params
    })
  },

  // 获取单个番剧详情
  getAnimeSeries (id) {
    return request({
      url: `/anime/${id}`,
      method: 'get'
    })
  },

  // 获取分集详情
  getEpisode (id) {
    return request({
      url: `/anime/episode/${id}`,
      method: 'get'
    })
  },

  // 获取番剧分集播放信息
  getEpisodePlayInfo (episodeId) {
    return request({
      url: `/anime/episode/${episodeId}`,
      method: 'get'
    })
  },

  // 添加评论
  addComment (data) {
    return request({
      url: '/anime/comment/add',
      method: 'post',
      data
    })
  },

  // 获取评论列表
  listComments (params) {
    return request({
      url: '/anime/comment/list',
      method: 'get',
      params
    })
  },

  // 点赞评论
  likeComment (commentId) {
    return request({
      url: `/anime/comment/like/${commentId}`,
      method: 'post'
    })
  },

  // 取消点赞评论
  unlikeComment (commentId) {
    return request({
      url: `/anime/comment/unlike/${commentId}`,
      method: 'post'
    })
  },

  // 添加评分
  addRating (data) {
    return request({
      url: '/anime/comment/rating/add',
      method: 'post',
      data
    })
  },

  // 获取评分信息
  getRatingInfo (seriesId) {
    return request({
      url: '/anime/comment/rating/info',
      method: 'get',
      params: { seriesId }
    })
  },

  // 获取用户评分
  getUserRating (seriesId) {
    return request({
      url: '/anime/comment/rating/user',
      method: 'get',
      params: { seriesId }
    })
  }

}
