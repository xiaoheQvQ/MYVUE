import request from '../request'

const api = {
  upload(videoInfo) {
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
        'Content-Type': 'multipart/form-data'
      },
      method: 'post',
      data: formDate,
      timeout: 3600000
    })
  },
  
  uploadSeriesVideo(videoInfo) {
    let formDate = new FormData()
    formDate.append('videoFile', videoInfo.videoFile)
    formDate.append('coverFile', videoInfo.coverFile)
    formDate.append('md5', videoInfo.md5)
    formDate.append('userId', videoInfo.userId)
    formDate.append('title', videoInfo.title)
    formDate.append('description', videoInfo.description)
    formDate.append('area', videoInfo.area)
    formDate.append('duration', videoInfo.duration)
    formDate.append('partTitle', videoInfo.partTitle)
    formDate.append('partDescription', videoInfo.partDescription)
    formDate.append('sortOrder', videoInfo.sortOrder)
    if (videoInfo.seriesId) {
      formDate.append('seriesId', videoInfo.seriesId)
    }
    for (let i = 0; i < videoInfo.tags.length; i++) {
      let tag = videoInfo.tags[i]
      formDate.append(`tags[${i}].name`, tag.name)
      if (tag.id) {
        formDate.append(`tags[${i}].id`, tag.id)
      }
    }
    return request({
      url: '/video/upload/series',
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      method: 'post',
      data: formDate,
      timeout: 3600000
    })
  },
  
  getVideoDetail(videoId) {
    return request({
      url: `/video/${videoId}`,
      method: 'get'
    })
  },
  
  getVideoSeries(seriesId) {
    return request({
      url: `/video/series/${seriesId}`,
      method: 'get'
    })
  },
  
  getUserSeries(userId) {
    return request({
      url: `/video/user-series/${userId}`,
      method: 'get'
    })
  },
  
  // 其他原有方法保持不变...
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
  incrViewCounts(videoId) {
    return request({
      url: `/video/incr-view-counts/${videoId}`,
      method: 'put'
    })
  },
  queryVideos(param) {
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
  like(videoId) {
    return request({
      url: `/video/like/${videoId}`,
      method: 'put'
    })
  },
  collect(videoId) {
    return request({
      url: `/video/collect/${videoId}`,
      method: 'put'
    })
  },
  likeInfo(videoId) {
    return request({
      url: `/video/like-info/${videoId}`,
      method: 'get'
    })
  },
  getCommentList(params) {
    return request({
      url: '/video/comment/getAllCommentByVideoId',
      method: 'get',
      params: {
        videoId: params.videoId
      }
    })
  },
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
  deleteComment(commentId) {
    return request({
      url: '/video/comment/delete',
      method: 'post',
      params: {
        commentId: commentId
      }
    })
  },
  getAreas() {
    return request({
      url: `/video/areas`,
      method: 'get'
    })
  },
  getTags() {
    return request({
      url: `/video/tags`,
      method: 'get'
    })
  },
  recommend() {
    return request({
      url: `/video/recommend`,
      method: 'get'
    })
  },
  basedItemRecommend() {
    return request({
      url: `/video/recommendItem`,
      method: 'get'
    })
  },
  getHistory(videoId) {
    return request({
      url: `/video/history/${videoId}`,
      method: 'get'
    })
  },
  updateHistory(videoId, time) {
    return request({
      url: `/video/history/${videoId}/${time}`,
      method: 'put'
    })
  },
  updateHistoryUnlogin(videoId, time) {
    return request({
      url: `/video/history/Unlogin/${videoId}/${time}`,
      method: 'put'
    })
  },
  getHistoryList() {
    return request({
      url: '/video/history',
      method: 'get'
    })
  },
  getCollections() {
    return request({
      url: '/video/collections',
      method: 'get'
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
  getWorks(userId) {
    return request({
      url: `/video/list/${userId}`,
      method: 'get'
    })
  },
  getUserVideos(params) {
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
  },
   // 获取视频分P列表
   getVideoSeriesList(videoId) {
    return request({
      url: '/video/series/list',
      method: 'get',
      params: { videoId }
    })
  },
  
  // 排序分P视频
  sortVideoSeries(data) {
    return request({
      url: '/video/series/sort',
      method: 'post',
      data
    })
  }
}

export default api