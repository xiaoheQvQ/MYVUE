<template>
  <div class="upload">
    <!-- 上传状态栏 -->
    <div class="upload-status-bar">
      <el-card class="status-card" :class="{ 'uploading': videoInfo.status === 'UPLOADING' }">
        <div class="status-header">
          <h2 class="status-title">视频上传</h2>
          <div class="upload-progress" v-if="videoInfo.status !== 'INIT'">
            <div class="progress-text">{{ statusMessage }}</div>
          </div>
        </div>

        <el-steps :active="currentStatusStep" finish-status="success" class="custom-steps">
          <el-step title="填写信息" description="填写视频基本信息">
            <template slot="icon">
              <i v-if="videoInfo.status === 'INIT'" class="el-icon-edit status-icon"></i>
              <i v-else class="el-icon-check status-icon success"></i>
            </template>
          </el-step>
          <el-step title="上传中" description="正在上传视频文件">
            <template slot="icon">
              <i v-if="videoInfo.status === 'UPLOADING'" class="el-icon-loading status-icon"></i>
              <i v-else-if="videoInfo.status === 'INIT'" class="el-icon-upload status-icon"></i>
              <i v-else class="el-icon-check status-icon success"></i>
            </template>
          </el-step>
          <el-step title="已发布" description="视频发布完成">
            <template slot="icon">
              <i v-if="videoInfo.status === 'PUBLISHED'" class="el-icon-check status-icon success"></i>
              <i v-else-if="videoInfo.status === 'UPLOAD_FAILED'" class="el-icon-close status-icon error"></i>
              <i v-else class="el-icon-video-play status-icon"></i>
            </template>
          </el-step>
        </el-steps>

        <div class="status-message" :class="{
          'error': videoInfo.status === 'UPLOAD_FAILED',
          'success': videoInfo.status === 'PUBLISHED',
          'processing': videoInfo.status === 'UPLOADING' || videoInfo.status === 'PROCESSING'
        }">
          <i :class="[getStatusIcon, 'status-icon']"></i>
          <span class="message-text">{{ statusMessage }}</span>
          <el-button
            v-if="videoInfo.status === 'PUBLISHED'"
            type="primary"
            size="medium"
            @click="goToVideoPlayer"
            class="watch-button"
            icon="el-icon-video-play"
          >
            点击前去观看
          </el-button>
        </div>

        <div v-if="videoInfo.status !== 'INIT'" class="video-preview">
          <div class="preview-content">
            <div class="cover-container" v-if="videoInfo.cover">
              <el-image :src="videoInfo.cover" fit="cover" class="video-cover"></el-image>
              <div class="cover-overlay">
                <i class="el-icon-picture"></i>
              </div>
            </div>
            <div class="info-preview">
              <h3 class="preview-title">{{ videoInfo.title }}</h3>
              <p class="preview-description">{{ videoInfo.description || '暂无描述' }}</p>
              <div class="preview-tags" v-if="videoInfo.tags && videoInfo.tags.length > 0">
                <el-tag v-for="(tag, index) in videoInfo.tags" :key="index" size="small" class="tag" effect="dark">
                  {{ typeof tag === 'object' ? tag.name : tag }}
                </el-tag>
              </div>
              <!-- 分P视频列表 -->
              <div class="series-list" v-if="videoSeries.length > 0">
                <h4 class="series-title">分P列表</h4>
                <el-table :data="videoSeries" style="width: 100%">
                  <el-table-column prop="sortOrder" label="序号" width="80"></el-table-column>
                  <el-table-column prop="title" label="分P标题"></el-table-column>
                  <el-table-column prop="description" label="分P描述"></el-table-column>
                  <el-table-column label="状态" width="120">
                    <template slot-scope="scope">
                      <el-tag :type="getStatusTagType(scope.row.status)">
                        {{ getStatusText(scope.row.status) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="120">
                    <template slot-scope="scope">
                      <el-button
                        size="mini"
                        @click="goToSeriesVideo(scope.row.videoId)"
                        :disabled="scope.row.status !== 'PUBLISHED'"
                      >观看</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 上传表单 -->
    <div class="upload-form" v-if="videoInfo.status === 'INIT'">
      <el-card class="form-card" shadow="hover">
        <div slot="header" class="form-header">
          <span class="form-title">视频信息</span>
          <el-switch
            v-model="isSeriesVideo"
            active-text="分P视频"
            inactive-text="单视频"
            @change="handleSeriesChange">
          </el-switch>
        </div>
        <el-form ref="form" :model="videoInfo" label-width="80px">
          <el-form-item label="视频文件">
            <el-upload
              class="upload-demo"
              accept="video/*"
              drag
              ref="videos"
              :file-list="fileList"
              :action="uploadUrl"
              :auto-upload=false
              :on-change="onChangeVideoFileHandler"
              :limit="1"
              multiple>
              <i class="el-icon-upload"></i>
              <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
              <div class="el-upload__tip" slot="tip">只能上传 1 个视频文件，大小小于 500M</div>
            </el-upload>
          </el-form-item>
          <el-form-item label="封面">
            <el-upload
              action="/"
              accept="image/*"
              ref="covers"
              list-type="picture-card"
              :auto-upload=false
              :limit="1"
              :on-change="onChangeCoverFileHandler"
              :on-preview="handlePictureCardPreview">
              <i class="el-icon-plus"></i>
              <div class="el-upload__tip" slot="tip">只能上传 1 个封面</div>
            </el-upload>
            <el-dialog :visible.sync="dialogVisible">
              <img width="100%" :src="dialogImageUrl" alt="">
            </el-dialog>
          </el-form-item>
          <el-form-item label="视频名称" prop="title"
                        :rules="[
                          {required: true, message: '请输入标题', trigger: 'blur'},
                          { min: 4, max: 20, message: '长度在 4 到 20 个字符', trigger: 'blur' }
                        ]">
            <el-input v-model="videoInfo.title"></el-input>
          </el-form-item>
          <!-- 分P视频特定字段 -->
          <template v-if="isSeriesVideo">
            <el-form-item label="分P标题" prop="partTitle"
                          :rules="[
                            {required: true, message: '请输入分P标题', trigger: 'blur'},
                            { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
                          ]">
              <el-input v-model="videoInfo.partTitle"></el-input>
            </el-form-item>
            <el-form-item label="分P描述">
              <el-input type="textarea" v-model="videoInfo.partDescription"></el-input>
            </el-form-item>
            <el-form-item label="排序序号">
              <el-input-number v-model="videoInfo.sortOrder" :min="0" :max="100"></el-input-number>
            </el-form-item>
            <el-form-item label="系列选择">
              <el-radio-group v-model="seriesOption" @change="handleSeriesOptionChange">
                <el-radio label="new">创建新系列</el-radio>
                <el-radio label="existing">选择现有系列</el-radio>
              </el-radio-group>
              <el-select 
                v-if="seriesOption === 'existing'"
                v-model="videoInfo.seriesId" 
                placeholder="选择现有系列"
                style="width: 100%; margin-top: 10px;"
                filterable>
                <el-option
                  v-for="series in existingSeries"
                  :key="series.seriesId"
                  :label="series.title"
                  :value="series.seriesId">
                  <span style="float: left">{{ series.title }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">
                    {{ series.videoCount }}个视频
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
          </template>
          <el-form-item label="视频分区" prop="area"
                        :rules="[
                          {required: true, message: '请选择分区', trigger: 'blur'}
                        ]">
            <el-select v-model="videoInfo.area" placeholder="请选择">
              <el-option
                v-for="(key, value) in areas"
                :key="key"
                :label="key"
                :value="value">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="视频标签">
            <div class="tag-input-container">
              <el-tag
                v-for="(tag, index) in videoInfo.tags"
                :key="index"
                closable
                @close="handleTagClose(index)"
                size="small"
                class="tag-item"
              >
                {{ typeof tag === 'object' ? tag.name : tag }}
              </el-tag>
              <el-input
                class="input-new-tag"
                v-if="inputVisible"
                v-model="inputValue"
                ref="saveTagInput"
                size="small"
                @keyup.enter.native="handleInputConfirm"
                @blur="handleInputConfirm"
              >
              </el-input>
              <el-button v-else class="button-new-tag" size="small" @click="showInput">+ 添加标签</el-button>
            </div>
            <div class="tag-select-hint" v-if="tags && tags.length > 0">
              <span class="hint-text">可选标签：</span>
              <el-tag
                v-for="tag in tags"
                :key="tag.id"
                size="mini"
                class="suggest-tag"
                @click="addPredefinedTag(tag)"
              >
                {{ tag.name }}
              </el-tag>
            </div>
          </el-form-item>
          <el-form-item label="视频描述">
            <el-input type="textarea" v-model="videoInfo.description"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="upload" v-loading.fullscreen.lock="fullscreenLoading">上传</el-button>
            <el-button @click="resetForm">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script>
import {MD5} from 'crypto-js'
import videoApi from '@/api/video/video'
import Global from '@/components/Global.vue'
import { apiBaseUrl, apiHostname } from '@/config/api'

export default {
  name: 'Upload',
  data () {
    return {
      videoInfo: {
        title: '',
        description: '',
        duration: 0,
        status: 'INIT',
        cover: '',
        area: '',
        tags: [],
        // 分P视频特有字段
        partTitle: '',
        partDescription: '',
        sortOrder: 0,
        seriesId: null
      },
      fileList: [],
      dialogImageUrl: '',
      dialogVisible: false,
      areas: null,
      tags: null,
      fullscreenLoading: false,
      videoId: null,
      statusWebSocket: null,
      statusPollingTimer: null,
      uploadUrl: `${apiBaseUrl}/video/upload-video`,
      inputVisible: false,
      inputValue: '',
      // 分P视频相关
      isSeriesVideo: false,
      videoSeries: [],
      existingSeries: [],
      seriesOption: 'new', // 'new' or 'existing'
      seriesPollingTimer: null
    }
  },
  computed: {
    currentStatusStep() {
      const statusSteps = {
        'INIT': 1,
        'UPLOADING': 2,
        'PUBLISHED': 3,
        'UPLOAD_FAILED': 2
      }
      return statusSteps[this.videoInfo.status] || 0
    },
    statusMessage() {
      const messages = {
        'INIT': '请填写视频信息',
        'UPLOADING': '视频上传中，请稍候...',
        'PROCESSING': 'AI审核中，请稍候...',
        'PUBLISHED': '视频已发布，可以观看了！',
        'UPLOAD_FAILED': this.videoInfo.message || '视频上传失败，请重试'
      }
      return messages[this.videoInfo.status] || '处理中...'
    },
    getStatusIcon() {
      const icons = {
        'INIT': 'el-icon-edit',
        'UPLOADING': 'el-icon-loading',
        'PROCESSING': 'el-icon-loading',
        'PUBLISHED': 'el-icon-success',
        'UPLOAD_FAILED': 'el-icon-error'
      }
      return icons[this.videoInfo.status] || 'el-icon-loading'
    }
  },
  created() {
    if (!localStorage.getItem('accessToken')) {
      this.$router.push('/login')
      return
    }
    this.resetComponent()
    this.getAreas()
    this.getTags()
  },
  beforeDestroy() {
    this.clearAllTimers()
    if (this.statusWebSocket) {
      this.statusWebSocket.close()
    }
  },
  watch: {
    '$route'(to, from) {
      if (to.path === '/upload-video') {
        this.resetComponent()
      }
    },
    isSeriesVideo(newVal) {
      if (newVal) {
        this.getUserSeries()
      } else {
        this.videoInfo.seriesId = null
        this.seriesOption = 'new'
      }
    }
  },
  methods: {
    resetComponent() {
      this.videoInfo = {
        title: '',
        description: '',
        duration: 0,
        status: 'INIT',
        cover: '',
        area: '',
        tags: [],
        partTitle: '',
        partDescription: '',
        sortOrder: 0,
        seriesId: null
      }
      this.fileList = []
      this.dialogImageUrl = ''
      this.dialogVisible = false
      this.fullscreenLoading = false
      this.videoId = null
      this.inputVisible = false
      this.inputValue = ''
      this.videoSeries = []
      this.seriesOption = 'new'

      this.clearAllTimers()

      if (this.$refs.videos) {
        this.$refs.videos.clearFiles()
      }
      if (this.$refs.covers) {
        this.$refs.covers.clearFiles()
      }
    },
    clearAllTimers() {
      if (this.statusPollingTimer) {
        clearInterval(this.statusPollingTimer)
        this.statusPollingTimer = null
      }
      if (this.seriesPollingTimer) {
        clearInterval(this.seriesPollingTimer)
        this.seriesPollingTimer = null
      }
    },
    resetForm() {
      this.$refs.form.resetFields()
      this.resetComponent()
    },
    handleSeriesOptionChange(val) {
      if (val === 'new') {
        this.videoInfo.seriesId = null
      }
    },
    handleSeriesChange() {
      if (this.isSeriesVideo) {
        this.getUserSeries()
      } else {
        this.videoInfo.seriesId = null
        this.seriesOption = 'new'
      }
    },
    getUserSeries() {
      if (Global.user && Global.user.id) {
        videoApi.getUserSeries(Global.user.id).then(res => {
          this.existingSeries = res.data || []
        }).catch(err => {
          console.error('获取用户系列失败:', err)
          this.$message.error('获取用户系列失败')
        })
      }
    },
    onChangeVideoFileHandler(file) {
      this.$refs.videos.uploadFiles = []
      this.$refs.videos.uploadFiles.push(file)

      if (file.raw && file.raw.type.startsWith('video/')) {
        const videoElement = document.createElement('video')
        videoElement.preload = 'metadata'

        videoElement.onloadedmetadata = () => {
          this.videoInfo.duration = Math.floor(videoElement.duration)
          URL.revokeObjectURL(videoElement.src)
        }

        videoElement.src = URL.createObjectURL(file.raw)
      }
    },
    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url
      this.dialogVisible = true
    },
    onChangeCoverFileHandler(file) {
      this.$refs.covers.uploadFiles = []
      this.$refs.covers.uploadFiles.push(file)
    },
    handleTagClose(index) {
      this.videoInfo.tags.splice(index, 1);
    },
    showInput() {
      this.inputVisible = true;
      this.$nextTick(_ => {
        this.$refs.saveTagInput.$refs.input.focus();
      });
    },
    handleInputConfirm() {
      let inputValue = this.inputValue;
      if (inputValue) {
        this.videoInfo.tags.push(inputValue);
      }
      this.inputVisible = false;
      this.inputValue = '';
    },
    addPredefinedTag(tag) {
      const exists = this.videoInfo.tags.some(t =>
        (typeof t === 'object' && t.id === tag.id) ||
        (typeof t === 'string' && t === tag.name)
      );

      if (!exists) {
        this.videoInfo.tags.push(tag);
      } else {
        this.$message.warning('该标签已添加');
      }
    },
    upload() {
      this.$refs.form.validate(valid => {
        if (valid) {
          this.fullscreenLoading = true

          for (let i = 0; i < this.videoInfo.tags.length; i++) {
            if ((typeof this.videoInfo.tags[i]) !== 'object') {
              this.videoInfo.tags[i] = {'name': this.videoInfo.tags[i]}
            }
          }

          if (!this.$refs.videos.uploadFiles[0]) {
            this.$message.error('请选择视频')
            this.fullscreenLoading = false
            return
          }

          let video = this.$refs.videos.uploadFiles[0].raw
          if (video.size >= 500 * 1024 * 1024) {
            this.$message.error('视频文件大小超过限制')
            this.fullscreenLoading = false
            return
          }

          if (!this.$refs.covers.uploadFiles[0]) {
            this.$message.error('请选择封面')
            this.fullscreenLoading = false
            return
          }

          let cover = this.$refs.covers.uploadFiles[0].raw
          if (cover.size >= 5 * 1024 * 1024) {
            this.$message.error('封面大小超过限制')
            this.fullscreenLoading = false
            return
          }

          if (!Global.user) {
            this.$message.error('请登录后再操作')
            this.fullscreenLoading = false
            return
          }

          let reader = new FileReader()
          reader.onload = () => {
            let fileContent = reader.result
            let md5 = MD5(fileContent).toString()

            this.videoInfo.userId = Global.user.id
            this.videoInfo.md5 = md5
            this.videoInfo.videoFile = video
            this.videoInfo.coverFile = cover

            const coverUrl = URL.createObjectURL(cover)
            this.videoInfo.cover = coverUrl
            this.videoInfo.status = 'UPLOADING'

            if (this.isSeriesVideo) {
              // 上传分P视频
              videoApi.uploadSeriesVideo(this.videoInfo).then(res => {
                this.videoId = res.data.videoId
                this.$message.success('上传成功！')
                this.videoInfo.status = 'PROCESSING'
                this.videoInfo.seriesId = res.data.seriesId
                this.connectStatusWebSocket()
                this.startSeriesPolling()
              }).catch(err => {
                this.videoInfo.status = 'UPLOAD_FAILED'
                this.videoInfo.message = err.message || '未知错误'
                this.$message.error('上传失败：' + this.videoInfo.message)
              }).finally(() => {
                if (this.videoInfo.status === 'UPLOAD_FAILED') {
                  this.fullscreenLoading = false
                }
              })
            } else {
              // 上传普通视频
              videoApi.upload(this.videoInfo).then(res => {
                this.videoId = res.data
                this.$message.success('上传成功！')
                this.videoInfo.status = 'PROCESSING'
                this.connectStatusWebSocket()
              }).catch(err => {
                this.videoInfo.status = 'UPLOAD_FAILED'
                this.videoInfo.message = err.message || '未知错误'
                this.$message.error('上传失败：' + this.videoInfo.message)
              }).finally(() => {
                if (this.videoInfo.status === 'UPLOAD_FAILED') {
                  this.fullscreenLoading = false
                }
              })
            }
          }

          reader.onerror = (error) => {
            this.videoInfo.status = 'UPLOAD_FAILED'
            this.videoInfo.message = '文件读取失败'
            this.$message.error('文件读取失败')
            this.fullscreenLoading = false
          }

          reader.readAsBinaryString(video)
        } else {
          this.$message.error('请填写完整信息')
        }
      })
    },
    startSeriesPolling() {
      if (this.seriesPollingTimer) {
        clearInterval(this.seriesPollingTimer)
      }
      this.seriesPollingTimer = setInterval(() => {
        if (this.videoInfo.seriesId) {
          this.getVideoSeries(this.videoInfo.seriesId)
        }
      }, 5000)
    },
    getAreas() {
      videoApi.getAreas().then(res => {
        this.areas = res.data
      })
    },
    getTags() {
      videoApi.getTags().then(res => {
        this.tags = res.data
      })
    },
    connectStatusWebSocket() {
      if (Global.user) {
        const wsUrl = `ws://${apiHostname}/ws/notification`
        this.statusWebSocket = new WebSocket(wsUrl)

        this.statusWebSocket.onopen = () => {
          const token = localStorage.getItem('accessToken')
          if (!token) {
            console.error('No auth token found in localStorage')
            return
          }
          this.statusWebSocket.send(JSON.stringify({
            type: 'auth',
            token: token
          }))

          this.statusWebSocket.send(JSON.stringify({
            type: 'subscribe',
            videoId: this.videoId
          }))
        }

        this.statusWebSocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'VIDEO_STATUS_UPDATE' && data.data && data.data.status) {
              this.videoInfo.status = data.data.status

              if (data.data.status === 'PUBLISHED') {
                this.handlePublishedStatus()
              } else if (data.data.status === 'PROCESSING') {
                this.startStatusPolling()
              }
            }
          } catch (err) {
            console.error('Failed to process message:', err)
          }
        }

        this.statusWebSocket.onclose = (event) => {
          this.clearStatusPolling()
          if (this.videoInfo.status !== 'PUBLISHED') {
            setTimeout(() => this.connectStatusWebSocket(), 5000)
          }
        }

        this.statusWebSocket.onerror = (error) => {
          console.error('Connection error:', error)
          this.clearStatusPolling()
        }
      }
    },
    handlePublishedStatus() {
      videoApi.getVideoDetail(this.videoId)
        .then(res => {
          this.videoInfo = {
            ...this.videoInfo,
            ...res.data,
            status: 'PUBLISHED'
          }
          this.clearStatusPolling()
          this.fullscreenLoading = false
          
          // 如果是分P视频，获取系列列表
          if (this.isSeriesVideo && this.videoInfo.seriesId) {
            this.getVideoSeries(this.videoInfo.seriesId)
          }
        })
        .catch(err => {
          console.error('Failed to fetch video details:', err)
          this.$message.error('获取视频信息失败，请刷新页面重试')
          this.fullscreenLoading = false
        })
    },
    getVideoSeries(seriesId) {
      videoApi.getVideoSeries(seriesId).then(res => {
        this.videoSeries = res.data || []
        // 如果所有视频都已发布，停止轮询
        if (this.videoSeries.every(v => v.status === 'PUBLISHED')) {
          clearInterval(this.seriesPollingTimer)
          this.seriesPollingTimer = null
        }
      }).catch(err => {
        console.error('获取视频系列失败:', err)
      })
    },
    startStatusPolling() {
      this.clearStatusPolling()
      this.statusPollingTimer = setInterval(() => {
        this.checkVideoStatus()
      }, 10000)
    },
    clearStatusPolling() {
      if (this.statusPollingTimer) {
        clearInterval(this.statusPollingTimer)
        this.statusPollingTimer = null
      }
    },
    checkVideoStatus() {
      videoApi.getVideoDetail(this.videoId)
        .then(res => {
          if (res.data && res.data.status) {
            const newStatus = res.data.status
            this.videoInfo.status = newStatus

            if (newStatus === 'PUBLISHED') {
              this.handlePublishedStatus()
            }
          }
        })
        .catch(err => {
          console.error('Failed to check video status:', err)
        })
    },
    goToVideoPlayer() {
      this.$router.push({
        path: '/video-player',
        query: {
          videoId: this.videoId
        }
      })
    },
    goToSeriesVideo(videoId) {
      this.$router.push({
        path: '/video-player',
        query: {
          videoId: videoId
        }
      })
    },
    formatDuration(seconds) {
      if (!seconds) return '00:00'
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    },
    getStatusTagType(status) {
      const types = {
        'UPLOADING': 'warning',
        'PROCESSING': 'info',
        'PUBLISHED': 'success',
        'UPLOAD_FAILED': 'danger'
      }
      return types[status] || ''
    },
    getStatusText(status) {
      const texts = {
        'UPLOADING': '上传中',
        'PROCESSING': '处理中',
        'PUBLISHED': '已发布',
        'UPLOAD_FAILED': '上传失败'
      }
      return texts[status] || '未知'
    }
  }
}
</script>

<style scoped>
.upload {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 30px;
  background: #f5f7fa;
  min-height: 100vh;
}

.upload-status-bar {
  margin-bottom: 40px;
}

.status-card {
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  background: #fff;
  transition: all 0.3s ease;
}

.status-card.uploading {
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border: 2px solid #409EFF;
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
}

.status-title {
  font-size: 24px;
  color: #303133;
  margin: 0;
  font-weight: 600;
}

.upload-progress {
  display: flex;
  align-items: center;
}

.progress-text {
  font-size: 16px;
  color: #409EFF;
  font-weight: 500;
}

.custom-steps {
  margin: 40px 0;
  padding: 20px 0;
  border-radius: 8px;
  background: #f8fafc;
}

.status-icon {
  font-size: 20px;
}

.status-icon.success {
  color: #67c23a;
}

.status-icon.error {
  color: #f56c6c;
}

.status-message {
  margin-top: 25px;
  padding: 15px 20px;
  border-radius: 8px;
  font-size: 16px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.status-message.error {
  background-color: #fef0f0;
  color: #f56c6c;
  border-left: 4px solid #f56c6c;
}

.status-message.success {
  background-color: #f0f9eb;
  color: #67c23a;
  border-left: 4px solid #67c23a;
}

.status-message.processing {
  background-color: #ecf5ff;
  color: #409EFF;
  border-left: 4px solid #409EFF;
}

.message-text {
  margin-left: 10px;
  font-weight: 500;
}

.watch-button {
  margin-left: auto;
  padding: 12px 25px;
  font-weight: 500;
  border-radius: 25px;
  transition: all 0.3s ease;
}

.watch-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.video-preview {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid #ebeef5;
}

.preview-content {
  display: flex;
  gap: 30px;
  background: #f8fafc;
  padding: 20px;
  border-radius: 8px;
}

.cover-container {
  width: 280px;
  height: 160px;
  overflow: hidden;
  border-radius: 8px;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.video-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.cover-container:hover .video-cover {
  transform: scale(1.05);
}

.cover-container:hover .cover-overlay {
  opacity: 1;
}

.cover-overlay i {
  color: #fff;
  font-size: 32px;
}

.info-preview {
  flex: 1;
}

.preview-title {
  margin: 0 0 15px 0;
  font-size: 20px;
  color: #303133;
  font-weight: 600;
}

.preview-description {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 20px;
}

.preview-tags {
  margin-top: 15px;
}

.series-list {
  margin-top: 20px;
}

.series-title {
  font-size: 16px;
  color: #303133;
  margin-bottom: 10px;
}

.tag {
  margin-right: 10px;
  margin-bottom: 10px;
  padding: 6px 12px;
  border-radius: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.form-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.form-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

:deep(.el-step__title) {
  font-size: 16px;
  font-weight: 500;
}

:deep(.el-step__description) {
  font-size: 13px;
  color: #909399;
}

:deep(.el-step__icon) {
  width: 32px;
  height: 32px;
  border-width: 2px;
}

:deep(.el-step.is-success .el-step__title) {
  color: #67c23a;
}

:deep(.el-step__head.is-success) {
  color: #67c23a;
  border-color: #67c23a;
}

.upload-form {
  margin-top: 30px;
}

.tag-input-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 5px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  min-height: 40px;
}

.tag-item {
  margin-right: 6px;
}

.input-new-tag {
  width: 120px;
}

.button-new-tag {
  height: 32px;
  line-height: 30px;
  padding: 0 10px;
}

.tag-select-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.hint-text {
  margin-right: 8px;
}

.suggest-tag {
  margin-right: 6px;
  margin-bottom: 6px;
  cursor: pointer;
}

.suggest-tag:hover {
  background-color: #ecf5ff;
  color: #409EFF;
  border-color: #c6e2ff;
}
</style>