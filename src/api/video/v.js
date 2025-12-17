import request from '../request'

const api = {
  upload (videoInfo) {
    let formDate = new FormData()
    formDate.append('videoFile', videoInfo.videoFile)
    formDate.append('coverFile', videoInfo.coverFile)
    formDate.append('md5', videoInfo.md5)
    formDate.append('userId', videoInfo.userId)
    formDate.append('title', videoInfo.title)
    formDate.append('description', videoInfo.description)
    formDate.append('area', videoInfo.area)
    formDate.append('duration', videoInfo.duration)
    for (let i = 0; i < videoInfo.tags.length; i++) {
      let tag = videoInfo.tags[i]
      formDate.append(`tags[${i}].name`, tag.name)
      if (tag.id) {
        formDate.append(`tags[${i}].id`, tag.id)
      }
    }
    return request({
      url: '/video/upload',
      headers: {
        'Content-Type': 'multipart/form-data' // 设置请求头为multipart/form-data
      },
      method: 'post',
      data: formDate,
      timeout: 3600000
    })
  },
// 修改视频信息(FormData格式)
updateVideoFormData(data) {
  return request({
    url: `/video/change`,
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
},
  getVideoDetail (videoId) {
    return request({
      url: `/video/${videoId}`,
      method: 'get'
    })
  },
  selectUserVideoStatsGroupByDay(){
    return request({
      url: `/video/selectUserVideoStatsGroupByDay`,
      method: 'get'
    })
  },
  getVideoStatsLast7Days(){
    return request({
      url: `/video/getVideoStatsLast7Days`,
      method: 'get'
    })
  },
  incrViewCounts (videoId) {
    return request({
      url: `/video/incr-view-counts/${videoId}`,
      method: 'put'
    })
  },
  queryVideos (param) {
    return request({
      url: `/video`,
      params: param,
      method: 'get'
    })
  },
  queryVideosByParam(param) {
    return request({
      url: `/video/query`,
      params: param,
      method: 'get'
    })
  },
  getAreaVideos(area){
    return request({
      url: `/video/areaVideo/${area}`,
      method: 'get'
    })
  },
  like (videoId) {
    return request({
      url: `/video/like/${videoId}`,
      method: 'put'
    })
  },
  collect (videoId) {
    return request({
      url: `/video/collect/${videoId}`,
      method: 'put'
    })
  },
  likeInfo (videoId) {
    return request({
      url: `/video/like-info/${videoId}`,
      method: 'get'
    })
  },

  // 获取视频评论列表
  getCommentList(params) {
    return request({
      url: '/video/comment/getAllCommentByVideoId',
      method: 'get',
      params: {
        videoId: params.videoId
      }
    })
  },

  // 发表评论
  publishComment(data) {
    return request({
      url: '/video/comment/publish',
      method: 'post',
      data: {
        videoId: data.videoId,
        content: data.content
      }
    })
  },

  // 回复评论
  replyComment(data) {
    return request({
      url: '/video/comment/reply',
      method: 'post',
      data: {
        videoId: data.videoId,
        content: data.content,
        parentId: data.parentId,
        replyCommentId:data.replyCommentId,
        replyToUserId: data.replyToId,
        toCreateTime: data.toCreateTime
      }
    })
  },

  // 删除评论
  deleteComment(commentId) {
    return request({
      url: '/video/comment/delete',
      method: 'post',
      params: {
        commentId: commentId
      }
    })
  },


  getAreas () {
    return request({
      url: `/video/areas`,
      method: 'get'
    })
  },
  getTags () {
    return request({
      url: `/video/tags`,
      method: 'get'
    })
  },
  recommend () {
    return request({
      url: `/video/recommend`,
      method: 'get'
    })
  },
  basedItemRecommend () {
    return request({
      url: `/video/recommendItem`,
      method: 'get'
    })
  },

  getHistory (videoId) {
    return request({
      url: `/video/history/${videoId}`,
      method: 'get'
    })
  },
  updateHistory (videoId, time) {
    return request({
      url: `/video/history/${videoId}/${time}`,
      method: 'put'
    })
  },
  updateHistoryUnlogin (videoId, time) {
    return request({
      url: `/video/history/Unlogin/${videoId}/${time}`,
      method: 'put'
    })
  },
  getHistoryList () {
    return request({
      url: '/video/history',
      method: 'get'
    })
  },
  getCollections () {
    return request({
      url: '/video/collections',
      method: 'get'
    })
  },
  getWorks (userId) {
    return request({
      url: `/video/list/${userId}`,
      method: 'get'
    })
  },

  getUserVideos (params) {
    return request({
      url: `/video/user-videos`,
      method: 'get',
      params
    })
  },
  inputQuery(params) {
    return request({
      url: '/video/input/query',
      method: 'get',
      params
    })
  }
}

export default api
