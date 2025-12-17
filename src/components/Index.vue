<template>
  <div class="main-container">
    <!-- Search Bar Area -->


    <!-- 分类区域 - 使用新的Tag样式 -->
    <div class="categories-bar">
      <!-- "全部" 按钮 -->
      <div
        :class="['category-tag', (!param.area || param.area === '') ? 'active' : '']"
        @click="changeArea('')">
        全部
      </div>
      <!-- 循环API获取的分类 -->
      <div
        v-for="(value, key) in areas"
        :key="key"
        :class="['category-tag', param.area === key ? 'active' : '']"
        @click="changeArea(key)">
        {{ value }}
      </div>
    </div>

    <!-- 推荐视频 - 修改为左主右辅布局 -->
    <div v-if="recommendList.length > 0" class="section-container">
      <div class="section-header">
        <h3 class="section-title">
          <i class="el-icon-star-on section-icon"></i> 为你推荐
        </h3>
        <el-button type="text" icon="el-icon-refresh" @click="refreshRecommendations" class="refresh-button">
          换一换
        </el-button>
      </div>

      <div class="recommend-layout">
        <!-- 主视觉区 - 左侧大图 -->
        <div
          class="main-feature"
          v-if="recommendList[0]"
          @click="playRecommend(recommendList[0].id)">
          <div class="main-feature-cover">
            <el-image :src="recommendList[0].cover" fit="cover"></el-image>
            <div class="video-duration">{{ formatDuration(recommendList[0].duration) }}</div>
          </div>
          <div class="main-feature-info">
            <div class="main-feature-title" v-html="recommendList[0].title"></div>
            <div class="main-feature-meta">
              <span class="uploader"><i class="el-icon-user"></i> {{ recommendList[0].nick }}</span>
              <span class="views"><i class="el-icon-view"></i> {{ recommendList[0].count || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- 次级信息聚合区 - 右侧3×2网格 -->
        <div class="secondary-grid">
          <div
            class="grid-item"
            v-for="(video, index) in recommendList.slice(1, 7)"
            :key="video.id + '-rec'"
            @click="playRecommend(video.id)">
            <div class="grid-item-cover">
              <el-image :src="video.cover" fit="cover"></el-image>
              <div class="video-duration">{{ formatDuration(video.duration) }}</div>
            </div>
            <div class="grid-item-info">
              <div class="grid-item-title" v-html="video.title"></div>
              <div class="grid-item-meta">
                <span class="uploader"><i class="el-icon-user"></i> {{ video.nick }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 所有视频区域 -->
    <div class="section-container">
      <div class="section-header">
        <h3 class="section-title">
          <i class="el-icon-video-camera section-icon"></i> 最新视频
          <span v-if="param.area && areas[param.area]" class="current-area-title"> - {{ areas[param.area] }}</span>
        </h3>
      </div>
       <!-- 使用与搜索结果相同的视频卡片网格 -->
      <div class="latest-video-grid">
        <div
          v-for="video in records"
          :key="video.id + '-latest'"
          class="video-result-card latest-video-card"
          @click="playRecommend(video.id)"
        >
          <div class="video-result-cover latest-video-cover">
            <el-image :src="video.cover" fit="cover" :lazy="true"></el-image>
            <div class="video-duration">{{ formatDuration(video.duration) }}</div>
          </div>
          <div class="video-result-info">
            <div class="video-result-title" v-html="video.title"></div>
            <div class="video-result-uploader">
              <span><i class="el-icon-view"></i> {{ video.count || 0 }}</span>
              <i class="el-icon-user" style="margin-right: -5px;"></i>
              <span>{{ video.nick }}</span>
              <span><i class="el-icon-date"></i> {{ formatDate(video.createTime) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-pagination
      v-if="param.pages > 1"
      ref="pagination"
      background
      layout="prev, pager, next"
      @current-change="changePage"
      :current-page.sync="param.current"
      :page-count="param.pages"
      class="pagination">
    </el-pagination>
  </div>
</template>

<script>
import videoApi from '@/api/video/video'
import Global from '@/components/Global.vue'

export default {
  name: 'Index',
  data () {
    return {
      Global: Global,
      param: {
        keyword: null,
        area: null,
        seed: this.getRandomInt(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER),
        current: 1,
        size: 20,
        pages: 1
      },
      searchKeyword: '',
      suggestions: [],
      showSuggestions: false,
      recommendList: [],
      records: [],
      areas: null
    }
  },
  mounted () {
    if (this.$route.query && this.$route.query.keyword) {
      // Handle keyword search scenario
    } else {
      this.getAreas()
      this.queryVideos()
      this.recommend()
    }
  },
  methods: {
    queryVideos () {
      const queryParams = { ...this.param };
      if(queryParams.area) {
          delete queryParams.seed;
      }

      videoApi.queryVideos(queryParams).then(res => {
        let data = res.data
        this.param.current = parseInt(data.current)
        this.param.pages = parseInt(data.pages)
        this.records = data.records
      }).catch(err => {
        console.error("Error fetching videos:", err);
        this.records = [];
      });
    },
    changePage (current) {
      this.param.current = current
      this.queryVideos()
    },
    playRecommend (id) {
      this.$router.push({
        path: '/video-player',
        query: {
          videoId: id
        }
      })
    },

  
    getAreas () {
      videoApi.getAreas().then(res => {
        this.areas = res.data
      }).catch(err => {
          console.error("Error fetching areas:", err);
          this.areas = {};
      });
    },
    changeArea (areaKey) {
      this.param.area = areaKey;
      this.param.current = 1;
      this.queryVideos();
    },
    recommend () {
      if (Global.user) {
        videoApi.recommend().then(res => {
          this.recommendList = res.data
        }).catch(err => {
          console.error("Error fetching recommendations:", err);
          this.recommendList = [];
        });
      }else{
        videoApi.basedItemRecommend().then(res => {
          this.recommendList = res.data
        }).catch(err => {
          console.error("Error fetching recommendations:", err);
          this.recommendList = [];
        });
      }
    },
    refreshRecommendations() {
      this.recommend();
    },
    formatDuration(seconds) {
      if (seconds === null || seconds === undefined) return '00:00';
      seconds = Math.floor(seconds);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    },
    formatDate(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },
    getRandomInt (min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min
    }
  }
}
</script>

<style scoped>
.main-container {
  padding: 0 60px 20px 60px;
}

/* Search Bar Styles */
.index-search-container {

  position: fixed;  /* 固定定位 */
  top: 0;          /* 紧贴顶部 */
  left: 0;         /* 从左侧开始 */
  right: 0;        /* 延伸到右侧 */
  z-index: 100;   /* 确保它在其他元素之上 */


  display: flex;
  align-items: center;
  max-width: 700px;
  margin: 0 auto 20px auto;
  /* background-color: #fff; */

  padding: 10px;
  border-radius: 25px;
 /* box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);  阴影  */

}

.search-outer-wrapper {
  position: relative;
  flex-grow: 1;
  margin-right: 10px;
}

.search-wrapper {
  position: relative;
  width: 100%;
}


.index-search-container .search-input >>> .el-input__inner {
  color: #303133;
  border-radius: 20px;
  border: 1px solid #dcdfe6;
  background-color: transparent !important;
}


.index-search-container .el-button {
  border-radius: 20px;
}

/* Suggestions Dropdown Styles */
.custom-suggestions {
  position: absolute;
  width: 100%;
  background: white;
  border: none;
  border-radius: 0 0 6px 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 2000;
  max-height: 300px;
  overflow-y: auto;
  top: 100%;
  left: 0;
  padding: 4px 0;
}

.suggestion-item {
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.suggestion-item:hover {
  background-color: #F5F7FA;
}

.suggestion-icon {
  color: #909399;
  margin-right: 8px;
}

.suggestion-text {
  flex: 1;
}

/* Category Bar Styles */
.categories-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 30px;
  padding: 15px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.05);
  width: 100%;
  justify-content: space-between;
}

.category-tag {
  padding: 6px 21px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  background-color: #f1f2f3;
  color: #61666d;
  white-space: nowrap;
  flex: 0 0 calc(11.11% - 10px); /* 9 items per row with gap */
  box-sizing: border-box;
  text-align: center;
  justify-content: center;
}

.category-tag:hover {
  background-color: #e7e8e9;
}

.category-tag.active {
  background-color: #409EFF;
  color: #fff;
}

/* Section Styles */
.section-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  border-left: 4px solid #409EFF;
  padding-left: 10px;
  display: flex;
  align-items: center;
  margin: 0;
}

.current-area-title {
    font-weight: normal;
    font-size: 16px;
    color: #666;
    margin-left: 8px;
}

.section-icon {
  margin-right: 8px;
  color: #409EFF;
}

.refresh-button {
  font-size: 14px;
  color: #666;
}

.refresh-button:hover {
  color: #409EFF;
}

/* New Recommend Layout Styles */
.recommend-layout {
  display: flex;
  gap: 20px;
}

.main-feature {
  flex: 0 0 40%; /* 2/5 of the width */
  cursor: pointer;
  transition: transform 0.3s ease;
}

.main-feature:hover {
  transform: translateY(-5px);
}

.main-feature-cover {
  position: relative;
  width: 100%;
  padding-top: 68.65%; /*原来： 56.25 16:9 aspect ratio */
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.main-feature-cover .el-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.main-feature-info {
  margin-top: 12px;
}

.main-feature-title {
  font-size: 18px;
  font-weight: bold;
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.main-feature-meta {
  display: flex;
  gap: 15px;
  color: #606266;
  font-size: 14px;
}

/* Secondary Grid Styles */
.secondary-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 15px;
}

.grid-item {
  cursor: pointer;
  transition: transform 0.3s ease;
}

.grid-item:hover {
  transform: translateY(-3px);
}

.grid-item-cover {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 aspect ratio */
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.grid-item-cover .el-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.grid-item-info {
  margin-top: 8px;
}

.grid-item-title {
  font-size: 14px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.grid-item-meta {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
}

/* Latest Videos Grid */
.latest-video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.video-result-card {
  cursor: pointer;
  transition: transform 0.3s ease;
}

.video-result-card:hover {
  transform: translateY(-5px);
}

.video-result-cover {
  position: relative;
  width: 100%;

  border-radius: 6px;
  overflow: hidden;
}

.video-result-cover .el-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.video-result-info {
  margin-top: 10px;
}

.video-result-title {
  font-size: 14px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-result-uploader {
  display: flex;          /* 启用 Flex 布局 */
  align-items: center;    /* 垂直居中 */
  gap: 12px;              /* 所有子元素之间都有 12px 间隔 */
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
}

.video-result-metadata {
  display: flex;
  justify-content: space-between;
}

.video-result-uploader span {
  margin-right: 10px; /* 设置右边距 */
}

/* 可选：移除最后一个 span 的右边距 */
.video-result-uploader span:last-child {
  margin-left: 0;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}
</style>
