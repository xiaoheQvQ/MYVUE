import request from '../request'

export default {

  // 新增：获取动态的评论列表
  getPostComments (postId, params) {
    return request({
      url: `/api/posts/${postId}/comments`,
      method: 'get',
      params
    })
  },

  // 新增：添加评论
  addPostComment (postId, data) {
    return request({
      url: `/api/posts/${postId}/comments`,
      method: 'post',
      data
    })
  },

  // 新增：获取评论通知
  getCommentNotifications () {
    return request({
      url: '/api/posts/notifications/comment',
      method: 'get'
    })
  },

  // 新增：获取点赞通知
  getLikeNotifications () {
    return request({
      url: '/api/posts/notifications/like',
      method: 'get'
    })
  },
  // 创建动态
  createPost (data) {
    return request({
      url: '/api/posts',
      method: 'post',
      data
    })
  },

  // 获取动态列表
  getPostFeed (params) {
    return request({
      url: '/api/posts/feed',
      method: 'get',
      params
    })
  },

  // 点赞动态
  likePost (postId) {
    return request({
      url: `/api/posts/${postId}/like`,
      method: 'post'
    })
  },

  // 取消点赞
  unlikePost (postId) {
    return request({
      url: `/api/posts/${postId}/like`,
      method: 'delete'
    })
  },

  // 上传图片（单文件）
  uploadImage (file) {
    const formData = new FormData()
    formData.append('file', file)
    return request({
      url: '/api/posts/upload-image',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 修改后的批量上传方法 - 逐个上传
  async uploadImages (files) {
    const results = []
    for (const file of files) {
      try {
        const res = await this.uploadImage(file)
        results.push(res)
      } catch (error) {
        console.error('上传图片失败:', error)
        // 可以选择继续上传其他图片或终止上传
        throw error // 或者 return Promise.reject(error)
      }
    }
    return { data: results }
  }
}
