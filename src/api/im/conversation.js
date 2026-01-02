import axios from '../request'

/**
 * IM会话API
 */
export default {
    /**
     * 获取会话列表
     */
    getConversationList() {
        return axios.get('/im/conversation/list')
    },

    /**
     * 清除未读数
     */
    clearUnread(conversationType, targetId) {
        return axios.post('/im/conversation/clearUnread', null, {
            params: { conversationType, targetId }
        })
    },

    /**
     * 删除会话
     */
    deleteConversation(conversationType, targetId) {
        return axios.post('/im/conversation/delete', null, {
            params: { conversationType, targetId }
        })
    },

    /**
     * 置顶/取消置顶会话
     */
    pinConversation(conversationType, targetId, isTop) {
        return axios.post('/im/conversation/pin', null, {
            params: { conversationType, targetId, isTop }
        })
    },

    /**
     * 免打扰/取消免打扰
     */
    muteConversation(conversationType, targetId, isMute) {
        return axios.post('/im/conversation/mute', null, {
            params: { conversationType, targetId, isMute }
        })
    }
}
