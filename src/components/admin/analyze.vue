<template>
  <div>
    <div class="video-stats-container">
      <div class="chart-container">
        <div ref="statsChart" class="stats-chart"></div>
      </div>
      <div class="data-table">
        <el-table :data="tableData" border style="width: 100%">
          <el-table-column prop="date" label="日期" align="center"></el-table-column>
          <el-table-column prop="view_count" label="观看视频数" align="center"></el-table-column>
          <el-table-column prop="like_count" label="点赞数" align="center"></el-table-column>
          <el-table-column prop="collect_count" label="收藏数" align="center"></el-table-column>
          <el-table-column prop="comment_count" label="评论数" align="center"></el-table-column>
          <el-table-column prop="danmaku_count" label="弹幕数" align="center"></el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 新增的用户所有视频统计数据 -->
    <div class="video-stats-container" style="margin-top: 30px;">
      <div class="chart-container">
        <div ref="allStatsChart" class="stats-chart"></div>
      </div>
      <div class="data-table">
        <el-table :data="allVideoTableData" border style="width: 100%">
          <el-table-column prop="date" label="日期" align="center"></el-table-column>
          <el-table-column prop="view_count" label="观看视频数" align="center"></el-table-column>
          <el-table-column prop="like_count" label="点赞数" align="center"></el-table-column>
          <el-table-column prop="collect_count" label="收藏数" align="center"></el-table-column>
          <el-table-column prop="comment_count" label="评论数" align="center"></el-table-column>
          <el-table-column prop="danmaku_count" label="弹幕数" align="center"></el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import commentApi from '@/api/admin/comment'

export default {
  name: 'AdminAnalyze',
  props: {
    userId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      chart: null,
      allStatsChart: null, // 新增的图表实例
      statsData: [],
      allVideoStatsData: [], // 新增的用户所有视频统计数据
      tableData: [],
      allVideoTableData: [], // 新增的用户所有视频表格数据
      defaultDates: [] // 存储最近7天日期作为备用
    }
  },
  mounted() {
    this.generateDefaultDates() // 生成最近7天日期
    this.initChart()
    this.initAllStatsChart() // 初始化新增的图表
    this.fetchData()
    this.fetchAllVideoStats() // 获取新增的用户所有视频数据
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose()
    }
    if (this.allStatsChart) {
      this.allStatsChart.dispose()
    }
    window.removeEventListener('resize', this.resizeCharts)
  },
  methods: {
    // 生成最近7天的日期作为备用
    generateDefaultDates() {
      const dates = []
      const today = new Date()
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        dates.push(this.formatDate(date))
      }
      this.defaultDates = dates
    },
    // 格式化日期为 YYYY-MM-DD
    formatDate(date) {
      if (typeof date === 'string') {
        // 如果已经是字符串格式，直接返回
        return date
      }
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    initChart() {
      this.chart = echarts.init(this.$refs.statsChart)
      const option = {
        title: {
          text: '近七日用户视频数据统计',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['观看视频数', '点赞数', '评论数', '收藏数', '弹幕数'],
          top: 30
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
          top: 80
        },
        xAxis: {
          type: 'category',
          data: this.defaultDates // 初始使用默认日期
        },
        yAxis: {
          type: 'value',
          name: '数量',
          position: 'left',
          axisLabel: {
            formatter: '{value}'
          }
        },
        series: [
          {
            name: '观看视频数',
            type: 'bar',
            data: new Array(7).fill(0), // 初始填充7个0
            barWidth: 15
          },
          {
            name: '点赞数',
            type: 'bar',
            data: new Array(7).fill(0),
            barWidth: 15
          },
          {
            name: '评论数',
            type: 'bar',
            data: new Array(7).fill(0),
            barWidth: 15
          },
          {
            name: '收藏数',
            type: 'bar',
            data: new Array(7).fill(0),
            barWidth: 15
          },
          {
            name: '弹幕数',
            type: 'bar',
            data: new Array(7).fill(0),
            barWidth: 15
          }
        ]
      }
      this.chart.setOption(option)
      window.addEventListener('resize', this.resizeCharts)
    },
    // 初始化新增的用户所有视频统计图表
    initAllStatsChart() {
      this.allStatsChart = echarts.init(this.$refs.allStatsChart)
      const option = {
        title: {
          text: '近七日用户所有视频数据统计',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['观看视频数', '点赞数', '评论数', '收藏数', '弹幕数'],
          top: 30
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
          top: 80
        },
        xAxis: {
          type: 'category',
          data: this.defaultDates
        },
        yAxis: {
          type: 'value',
          name: '数量',
          position: 'left',
          axisLabel: {
            formatter: '{value}'
          }
        },
        series: [
          {
            name: '观看视频数',
            type: 'bar',
            data: new Array(7).fill(0),
            barWidth: 15
          },
          {
            name: '点赞数',
            type: 'bar',
            data: new Array(7).fill(0),
            barWidth: 15
          },
          {
            name: '评论数',
            type: 'bar',
            data: new Array(7).fill(0),
            barWidth: 15
          },
          {
            name: '收藏数',
            type: 'bar',
            data: new Array(7).fill(0),
            barWidth: 15
          },
          {
            name: '弹幕数',
            type: 'bar',
            data: new Array(7).fill(0),
            barWidth: 15
          }
        ]
      }
      this.allStatsChart.setOption(option)
    },
    resizeCharts() {
      if (this.chart) {
        this.chart.resize()
      }
      if (this.allStatsChart) {
        this.allStatsChart.resize()
      }
    },
    async fetchData() {
      try {
        const response = await commentApi.selectUserVideoStatsGroupByDay(String(this.userId))
    
        console.log("API响应数据:", response)
        
        if (response.code === 200000) {
          this.statsData = response.data || []
          this.processData()
        } else {
          console.error('API返回错误:', response.msg)
          this.$message.error('获取数据失败: ' + response.msg)
        }
      } catch (error) {
        console.error('获取视频统计数据失败:', error)
        this.$message.error('获取视频统计数据失败')
      }
    },
    // 新增：获取用户所有视频统计数据
    async fetchAllVideoStats() {
      try {
        const response = await commentApi.getVideoStatsLast7Days(String(this.userId))
        console.log("用户所有视频API响应数据:", response)
        
        if (response.code === 200000) {
          this.allVideoStatsData = response.data || []
          this.processAllVideoData()
        } else {
          console.error('API返回错误:', response.msg)
          this.$message.error('获取用户所有视频数据失败: ' + response.msg)
        }
      } catch (error) {
        console.error('获取用户所有视频统计数据失败:', error)
        this.$message.error('获取用户所有视频统计数据失败')
      }
    },
    processData() {
      // 创建日期到数据的映射
      const dateDataMap = {}
      
      // 首先填充默认日期，确保所有7天都有数据
      this.defaultDates.forEach(date => {
        dateDataMap[date] = {
          viewCount: 0,
          likeCount: 0,
          collectCount: 0,
          commentCount: 0,
          danmakuCount: 0
        }
      })
      
      // 然后用API返回的数据覆盖默认数据
      this.statsData.forEach(item => {
        // 确保日期格式与defaultDates一致
        const date = item.statDate ? this.formatDate(item.statDate) : this.formatDate(new Date())
        dateDataMap[date] = {
          viewCount: item.viewCount || 0,
          likeCount: item.likeCount || 0,
          collectCount: item.collectCount || 0,
          commentCount: item.commentCount || 0,
          danmakuCount: item.danmakuCount || 0
        }
      })

      // 处理表格数据 - 按日期排序
      this.tableData = this.defaultDates.map(date => {
        const dataForDate = dateDataMap[date] || {}
        return {
          date,
          view_count: dataForDate.viewCount,
          like_count: dataForDate.likeCount,
          collect_count: dataForDate.collectCount,
          comment_count: dataForDate.commentCount,
          danmaku_count: dataForDate.danmakuCount
        }
      })

      // 处理图表数据
      const chartData = {
        dates: this.defaultDates,
        viewCounts: this.defaultDates.map(date => dateDataMap[date].viewCount),
        likeCounts: this.defaultDates.map(date => dateDataMap[date].likeCount),
        commentCounts: this.defaultDates.map(date => dateDataMap[date].commentCount),
        collectCounts: this.defaultDates.map(date => dateDataMap[date].collectCount),
        danmakuCounts: this.defaultDates.map(date => dateDataMap[date].danmakuCount)
      }

      this.chart.setOption({
        xAxis: {
          data: chartData.dates
        },
        series: [
          { data: chartData.viewCounts },
          { data: chartData.likeCounts },
          { data: chartData.commentCounts },
          { data: chartData.collectCounts },
          { data: chartData.danmakuCounts }
        ]
      })

      this.resizeCharts()
    },
    // 新增：处理用户所有视频数据
    processAllVideoData() {
      // 创建日期到数据的映射
      const dateDataMap = {}
      
      // 首先填充默认日期，确保所有7天都有数据
      this.defaultDates.forEach(date => {
        dateDataMap[date] = {
          viewCount: 0,
          likeCount: 0,
          collectCount: 0,
          commentCount: 0,
          danmakuCount: 0
        }
      })
      
      // 然后用API返回的数据覆盖默认数据
      this.allVideoStatsData.forEach(item => {
        // 确保日期格式与defaultDates一致
        const date = item.statDate ? this.formatDate(item.statDate) : this.formatDate(new Date())
        dateDataMap[date] = {
          viewCount: item.viewCount || 0,
          likeCount: item.likeCount || 0,
          collectCount: item.collectCount || 0,
          commentCount: item.commentCount || 0,
          danmakuCount: item.danmakuCount || 0
        }
      })

      // 处理表格数据 - 按日期排序
      this.allVideoTableData = this.defaultDates.map(date => {
        const dataForDate = dateDataMap[date] || {}
        return {
          date,
          view_count: dataForDate.viewCount,
          like_count: dataForDate.likeCount,
          collect_count: dataForDate.collectCount,
          comment_count: dataForDate.commentCount,
          danmaku_count: dataForDate.danmakuCount
        }
      })

      // 处理图表数据
      const chartData = {
        dates: this.defaultDates,
        viewCounts: this.defaultDates.map(date => dateDataMap[date].viewCount),
        likeCounts: this.defaultDates.map(date => dateDataMap[date].likeCount),
        commentCounts: this.defaultDates.map(date => dateDataMap[date].commentCount),
        collectCounts: this.defaultDates.map(date => dateDataMap[date].collectCount),
        danmakuCounts: this.defaultDates.map(date => dateDataMap[date].danmakuCount)
      }

      this.allStatsChart.setOption({
        xAxis: {
          data: chartData.dates
        },
        series: [
          { data: chartData.viewCounts },
          { data: chartData.likeCounts },
          { data: chartData.commentCounts },
          { data: chartData.collectCounts },
          { data: chartData.danmakuCounts }
        ]
      })

      this.resizeCharts()
    }
  }
}
</script>

<style scoped>
.video-stats-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.chart-container {
  width: 100%;
  height: 500px;
  margin-bottom: 30px;
}

.stats-chart {
  width: 100%;
  height: 100%;
}

.data-table {
  margin-top: 30px;
}
</style>