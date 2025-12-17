// 视频管理相关API
import request from '../request'

const adminVideoApi = {
  // 获取视频列表（分页）
  getVideoList(params) {
    return request({
      url: '/admin/video/page',
      method: 'get',
      params
    })
  },
  
  // 视频转字幕
  WavSub(id) {
    return request({
      url: `/admin/video/Wav/${id}`,
      method: 'get'
    })
  },

  // 删除视频
  deleteVideo(id) {
    return request({
      url: `/admin/video/delete/${id}`,
      method: 'delete'
    })
  },
  
  // 审核通过视频 (后端需要实现此接口)
  approveVideo(id) {
    return request({
      url: `/admin/video/approve/${id}`,
      method: 'put'
    })
  },
  
  // 拒绝视频审核 (后端需要实现此接口)
  rejectVideo(id, reason) {
    return request({
      url: `/admin/video/reject/${id}`,
      method: 'put',
      data: { reason }
    })
  }
}

export default adminVideoApi 