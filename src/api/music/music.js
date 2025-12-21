import axios from 'axios'

const localBaseUrl = 'http://localhost:8088'
const externalBaseUrl = 'https://music-dl.sayqz.com'

// 默认使用开放平台接口，或者从缓存读取
let useLocal = localStorage.getItem('music_api_local') === 'true'

export const setUseLocal = (val) => {
    useLocal = val
    localStorage.setItem('music_api_local', val)
    // 可以在这里触发全局刷新或者通过事件总线通知组件
}

export const getUseLocal = () => useLocal

const musicRequest = axios.create({
    timeout: 30000
})

musicRequest.interceptors.request.use(config => {
    config.baseURL = useLocal ? localBaseUrl : externalBaseUrl
    return config
})

// 响应拦截器
musicRequest.interceptors.response.use(
    response => response.data,
    error => Promise.reject(error)
)

export default {
    /**
     * 获取歌曲基本信息
     */
    getSongInfo: (source, id) => musicRequest.get(`/api/?source=${source}&id=${id}&type=info`),

    /**
     * 获取音乐文件链接 (重定向地址)
     */
    getSongUrl: (source, id, br = '320k') => `${useLocal ? localBaseUrl : externalBaseUrl}/api/?source=${source}&id=${id}&type=url&br=${br}`,

    /**
     * 获取专辑封面 (重定向地址)
     */
    getAlbumPic: (source, id) => `${useLocal ? localBaseUrl : externalBaseUrl}/api/?source=${source}&id=${id}&type=pic`,

    /**
     * 获取歌词
     */
    getSongLrc: (source, id) => musicRequest.get(`/api/?source=${source}&id=${id}&type=lrc`),

    /**
     * 搜索歌曲
     */
    search: (source, keyword, limit = 20) => musicRequest.get(`/api/?source=${source}&type=search&keyword=${keyword}&limit=${limit}`),

    /**
     * 聚合搜索
     */
    aggregateSearch: (keyword) => musicRequest.get(`/api/?type=aggregateSearch&keyword=${keyword}`),

    /**
     * 获取歌单详情
     */
    getPlaylist: (source, id) => musicRequest.get(`/api/?source=${source}&id=${id}&type=playlist`),

    /**
     * 获取排行榜列表
     */
    getToplists: (source) => musicRequest.get(`/api/?source=${source}&type=toplists`),

    /**
     * 获取排行榜歌曲
     */
    getToplist: (source, id) => musicRequest.get(`/api/?source=${source}&id=${id}&type=toplist`),

    /**
     * 本地扩展：获取歌手
     */
    getArtist: (id) => {
        if (!useLocal) return Promise.reject(new Error('Artist API only available in local mode'))
        return musicRequest.get(`/api/artist/${id}`)
    }
}
