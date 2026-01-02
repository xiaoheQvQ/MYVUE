import axios from '../request'

/**
 * IM好友API
 */
export default {
    /**
     * 申请添加好友
     */
    applyFriend(friendId, applyMsg = '') {
        return axios.post('/im/friend/apply', null, {
            params: { friendId, applyMsg }
        })
    },

    /**
     * 同意好友申请
     */
    acceptApply(applyId) {
        return axios.post('/im/friend/apply/accept', null, {
            params: { applyId }
        })
    },

    /**
     * 拒绝好友申请
     */
    rejectApply(applyId) {
        return axios.post('/im/friend/apply/reject', null, {
            params: { applyId }
        })
    },

    /**
     * 删除好友
     */
    deleteFriend(friendId) {
        return axios.post('/im/friend/delete', null, {
            params: { friendId }
        })
    },

    /**
     * 拉黑好友
     */
    blockFriend(friendId) {
        return axios.post('/im/friend/block', null, {
            params: { friendId }
        })
    },

    /**
     * 获取好友列表
     */
    getFriendList() {
        return axios.get('/im/friend/list')
    },

    /**
     * 获取好友申请列表
     */
    getApplyList() {
        return axios.get('/im/friend/apply/list')
    }
}
