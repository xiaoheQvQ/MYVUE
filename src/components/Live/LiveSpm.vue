<template>
    <div class="live-container">
      <h2>直播间列表</h2>
      
      <div class="stream-list">
        <div v-if="loading" class="loading">加载中...</div>
        <div v-if="error" class="error">{{ error }}</div>
        
        <div v-for="stream in streams" :key="stream.roomId" class="stream-item">
          <div class="stream-info">
            <h3>{{ stream.title || '未命名直播间' }}</h3>
            <p>主播: {{ stream.userNickname || '匿名主播' }}</p>
            <p >状态: {{ streamStatus(stream.living) }}</p>
         
          </div>
          <div class="stream-actions">
            <el-button 
              type="primary" 
              size="small" 
              @click="enterStream(stream.userId,stream.userNickname)"
             :disabled="!stream.living"
            >
              进入直播间
            </el-button>
            <el-button 
              type="info" 
              size="small" 
              @click="checkStatus(stream.roomId)"
            >
              刷新状态
            </el-button>
          </div>
        </div>
        
        <div v-if="streams.length === 0 && !loading" class="empty">
          暂无直播
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import liveApi from '@/api/live/live'
  
  export default {
    name: 'LiveSpm',
  
    data() {
      return {
        streams: [],
        loading: false,
        error: null
      }
    },
    
    created() {
      this.fetchLivingStreams()
    },
    
    methods: {
      // 获取直播间列表
      async fetchLivingStreams() {
        this.loading = true
        this.error = null
        try {
          const response = await liveApi.getLivingStreams()
          this.streams = response.data || []
          console.log("streams:"+response.data);
          
        } catch (err) {
          console.error('获取直播间列表失败:', err)
          this.error = '获取直播间列表失败，请稍后重试'
        } finally {
          this.loading = false
        }
      },
      
      // 检查直播间状态
      async checkStatus(roomId) {
        try {
          const response = await liveApi.getStatus(roomId)
          const updatedStream = this.streams.find(s => s.roomId === roomId)
          if (updatedStream) {
            updatedStream.status = response.data.status
            this.$message.success('状态已刷新')
          }
        } catch (err) {
          console.error('获取状态失败:', err)
          this.$message.error('获取状态失败')
        }
      },
      
      // 进入直播间
      enterStream(roomId,userNickname) {
        console.log("Spm:roomId"+roomId)
        this.$router.push({
                name:'LivePlayer',
                params: {
                    roomId:String(roomId)
                },
                query: {
                  nick: userNickname,
                  live_from: '71005',
                  visit_id: '33llw6rlnmm0'
                }
              })
      },
      
      // 状态文本显示
      streamStatus(Living) {

        const statusMap = {
            true: '直播中',
            false: '未开播'
            // 如果需要保留"已结束"状态，可能需要额外逻辑
        }
        return statusMap[Living] || '未知状态'
        }
    }
  }
  </script>
  
  <style scoped>
  .live-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  h2 {
    text-align: center;
    margin-bottom: 30px;
    color: #333;
  }
  
  .stream-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }
  
  .stream-item {
    border: 1px solid #eaeaea;
    border-radius: 8px;
    padding: 15px;
    transition: all 0.3s ease;
  }
  
  .stream-item:hover {
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }
  
  .stream-info h3 {
    margin-top: 0;
    color: #409EFF;
  }
  
  .stream-actions {
    margin-top: 15px;
    display: flex;
    justify-content: space-between;
  }
  
  .loading, .empty, .error {
    text-align: center;
    padding: 20px;
    grid-column: 1 / -1;
  }
  
  .error {
    color: #F56C6C;
  }
  
  .empty {
    color: #909399;
  }
  </style>