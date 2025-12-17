// 管理员相关API
import request from '../request'

const adminApi = {
  // 获取用户列表（分页）
  getUserList(params) {
    return request({
      url: '/admin/user/page',
      method: 'get',
      params
    })
  },
  
  // 删除用户
  deleteUser(id) {
    return request({
      url: `/admin/user/delete/${id}`,
      method: 'delete'
    })
  }
}

export default adminApi 