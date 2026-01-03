import axios from '../request'

/**
 * IM群组API
 */
export default {
    /**
     * 创建群组
     */
    createGroup(groupName, groupAvatar = '') {
        return axios.post('/im/group/create', null, {
            params: { groupName, groupAvatar }
        })
    },

    /**
     * 解散群组
     */
    dissolveGroup(groupId) {
        return axios.post('/im/group/dissolve', null, {
            params: { groupId }
        })
    },

    /**
     * 添加群成员
     */
    addMember(groupId, targetUserId) {
        return axios.post('/im/group/member/add', null, {
            params: { groupId, targetUserId }
        })
    },

    /**
     * 移除群成员
     */
    removeMember(groupId, targetUserId) {
        return axios.post('/im/group/member/remove', null, {
            params: { groupId, targetUserId }
        })
    },

    /**
     * 获取群成员列表
     */
    getGroupMembers(groupId) {
        return axios.get('/im/group/members', {
            params: { groupId }
        })
    },

    /**
     * 获取用户加入的群组列表
     * TODO: 后端尚未实现此接口，可能需要从会话列表或好友列表推导，或者后端增加接口
     */
    getGroupList() {
        return axios.get('/im/group/list')
    },

    /**
     * 上传群组头像
     */
    uploadAvatar(groupId, formData) {
        return axios.post('/im/group/uploadAvatar', formData, {
            params: { groupId },
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },

    /**
     * 更新群组信息
     */
    updateGroupInfo(groupId, groupName, groupAvatar, introduction, notification) {
        return axios.post('/im/group/updateInfo', null, {
            params: {
                groupId,
                groupName,
                groupAvatar,
                introduction,
                notification
            }
        })
    },

    /**
     * 退出群组
     */
    exitGroup(groupId) {
        return axios.post('/im/group/exit', null, {
            params: { groupId }
        })
    },

    /**
     * 搜索群成员(用于@提及)
     */
    searchGroupMembers(groupId, keyword = '') {
        return axios.get(`/im/group/${groupId}/members/search`, {
            params: { keyword }
        })
    }
}
