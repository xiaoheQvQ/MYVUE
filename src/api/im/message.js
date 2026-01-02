import axios from '../request'

/**
 * IM消息API
 */
export default {
    /**
     * 发送单聊消息
     */
    sendSingleMessage(data) {
        return axios.post('/im/message/send/single', data)
    },

    /**
     * 发送群聊消息
     */
    sendGroupMessage(data) {
        return axios.post('/im/message/send/group', data)
    },

    /**
     * 拉取历史消息
     */
    pullHistory(targetId, sessionType, startSeq = null, limit = 50) {
        const params = {
            targetId,
            sessionType,
            limit
        }
        if (startSeq) {
            params.startSeq = startSeq
        }
        return axios.get('/im/message/history', { params })
    },

    /**
     * 同步消息
     */
    syncMessages(lastSeq) {
        return axios.post('/im/message/sync', null, {
            params: { lastSeq }
        })
    },

    /**
     * 获取未读消息数
     */
    getUnreadCount() {
        return axios.get('/im/message/unread/count')
    }
}
