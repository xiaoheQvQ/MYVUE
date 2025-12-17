<template>
  <div class="anime-upload-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>上传番剧</span>
      </div>
      
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <!-- 番剧基本信息 -->
        <el-form-item label="番剧标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入番剧标题"></el-input>
        </el-form-item>
        
        <el-form-item label="番剧描述" prop="description">
          <el-input
            type="textarea"
            :rows="3"
            v-model="form.description"
            placeholder="请输入番剧描述"
          ></el-input>
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="地区" prop="area">
              <el-select v-model="form.area" placeholder="请选择地区">
                <el-option label="中国大陆" value="中国大陆"></el-option>
                <el-option label="日本" value="日本"></el-option>
                <el-option label="欧美" value="欧美"></el-option>
                <el-option label="其他" value="其他"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="季数" prop="seasonNumber">
              <el-input-number v-model="form.seasonNumber" :min="1"></el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="封面图片" prop="coverFile">
          <el-upload
            class="cover-uploader"
            action="#"
            :show-file-list="false"
            :before-upload="beforeCoverUpload"
            :on-change="handleCoverChange"
            accept="image/*"
          >
            <img v-if="coverUrl" :src="coverUrl" class="cover-image" />
            <i v-else class="el-icon-plus cover-uploader-icon"></i>
          </el-upload>
        </el-form-item>
        
        <el-form-item label="标签" prop="tags">
          <el-checkbox-group v-model="form.tags">
            <el-checkbox v-for="tag in availableTags" :key="tag" :label="tag">{{ tag }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <!-- 分集上传 -->
        <el-divider content-position="left">分集上传</el-divider>
        
        <div class="episode-list">
          <div class="episode-item" v-for="(episode, index) in form.episodes" :key="index">
            <el-card shadow="hover">
              <div slot="header" class="clearfix">
                <span>第 {{ episode.episodeNumber }} 集</span>
                <el-button
                  v-if="form.episodes.length > 1"
                  style="float: right; padding: 3px 0"
                  type="text"
                  @click="removeEpisode(index)"
                >删除</el-button>
              </div>
              
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item
                    :label="'第' + (index + 1) + '集标题'"
                    :prop="'episodes.' + index + '.title'"
                    :rules="{
                      required: true, message: '分集标题不能为空', trigger: 'blur'
                    }"
                  >
                    <el-input v-model="episode.title" placeholder="请输入分集标题"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item
                    label="分集号"
                    :prop="'episodes.' + index + '.episodeNumber'"
                    :rules="{
                      required: true, message: '分集号不能为空', trigger: 'blur'
                    }"
                  >
                    <el-input-number
                      v-model="episode.episodeNumber"
                      :min="1"
                      :max="100"
                    ></el-input-number>
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-form-item label="分集描述">
                <el-input
                  type="textarea"
                  :rows="2"
                  v-model="episode.description"
                  placeholder="请输入分集描述"
                ></el-input>
              </el-form-item>
              
              <el-form-item
                label="视频文件"
                :prop="'episodes.' + index + '.videoFile'"
                :rules="{
                  required: true, message: '视频文件不能为空', trigger: 'change'
                }"
              >
                <el-upload
                  class="video-uploader"
                  action="#"
                  :show-file-list="false"
                  :before-upload="(file) => beforeVideoUpload(file, index)"
                  :on-change="(file) => handleVideoChange(file, index)"
                  accept="video/*"
                >
                  <div v-if="episode.videoFile" class="video-info">
                    <i class="el-icon-video-camera"></i>
                    <div class="video-name">{{ episode.videoFile.name }}</div>
                    <div class="video-size">{{ formatFileSize(episode.videoFile.size) }}</div>
                    <div class="video-progress" v-if="episode.uploadProgress > 0">
                      <el-progress 
                        :percentage="episode.uploadProgress" 
                        :status="episode.uploadStatus"
                        :stroke-width="6"
                      ></el-progress>
                    </div>
                  </div>
                  <el-button v-else size="small" type="primary">点击上传</el-button>
                </el-upload>
              </el-form-item>
              
              <el-form-item
                label="视频时长(秒)"
                :prop="'episodes.' + index + '.duration'"
                :rules="{
                  required: true, message: '视频时长不能为空', trigger: 'blur'
                }"
              >
                <el-input-number
                  v-model="episode.duration"
                  :min="1"
                  :max="3600"
                ></el-input-number>
              </el-form-item>
            </el-card>
          </div>
        </div>
        
        <el-button type="primary" @click="addEpisode">添加分集</el-button>
        
        <el-form-item class="submit-btn">
          <el-button
            type="primary"
            :loading="uploading"
            @click="submitForm"
          >提交上传</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 上传状态对话框 -->
    <el-dialog
      title="上传状态"
      :visible.sync="statusDialogVisible"
      width="50%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <el-steps :active="currentStatusStep" finish-status="success" class="status-steps">
        <el-step title="准备上传" description="填写视频信息">
          <template slot="icon">
            <i v-if="currentStatusStep === 0" class="el-icon-edit status-icon"></i>
            <i v-else class="el-icon-check status-icon success"></i>
          </template>
        </el-step>
        <el-step title="上传中" description="正在上传视频文件">
          <template slot="icon">
            <i v-if="currentStatusStep === 1" class="el-icon-loading status-icon"></i>
            <i v-else-if="currentStatusStep < 1" class="el-icon-upload status-icon"></i>
            <i v-else class="el-icon-check status-icon success"></i>
          </template>
        </el-step>
        <el-step title="处理中" description="视频转码处理">
          <template slot="icon">
            <i v-if="currentStatusStep === 2" class="el-icon-loading status-icon"></i>
            <i v-else-if="currentStatusStep < 2" class="el-icon-setting status-icon"></i>
            <i v-else class="el-icon-check status-icon success"></i>
          </template>
        </el-step>
        <el-step title="已完成" description="视频发布完成">
          <template slot="icon">
            <i v-if="currentStatusStep === 3" class="el-icon-success status-icon success"></i>
            <i v-else class="el-icon-video-play status-icon"></i>
          </template>
        </el-step>
      </el-steps>
      
      <div class="status-message" :class="statusClass">
        <i :class="statusIcon"></i>
        <span>{{ statusMessage }}</span>
      </div>
      
      <div class="video-preview" v-if="currentStatusStep > 0">
        <div class="preview-content">
          <div class="cover-container" v-if="coverUrl">
            <el-image :src="coverUrl" fit="cover" class="video-cover"></el-image>
            <div class="cover-overlay">
              <i class="el-icon-picture"></i>
            </div>
          </div>
          <div class="info-preview">
            <h3 class="preview-title">{{ form.title }}</h3>
            <p class="preview-description">{{ form.description || '暂无描述' }}</p>
            <div class="preview-tags" v-if="form.tags && form.tags.length > 0">
              <el-tag v-for="(tag, index) in form.tags" :key="index" size="small" class="tag">
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
      
      <span slot="footer" class="dialog-footer">
        <el-button
          type="primary"
          @click="handleStatusDialogClose"
          :disabled="!uploadComplete"
        >{{ uploadComplete ? '完成' : '取消' }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { MD5 } from 'crypto-js'
import animeApi from '@/api/anime/anime'
import Global from '@/components/Global.vue'
export default {
  name: 'AnimeUpload',
  data() {
    return {
      form: {
        userId: null,
        title: '',
        description: '',
        area: '中国大陆',
        seasonNumber: 1,
        coverFile: null,
        tags: [],
        episodes: [
          {
            episodeNumber: 1,
            title: '',
            description: '',
            videoFile: null,
            duration: null,
            md5: '',
            uploadProgress: 0,
            uploadStatus: '',
            uploadMessage: '等待上传'
          }
        ]
      },
      availableTags: ['热血', '恋爱', '搞笑', '玄幻', '科幻', '悬疑', '治愈', '校园'],
      rules: {
        title: [
          { required: true, message: '请输入番剧标题', trigger: 'blur' },
          { max: 100, message: '长度在100个字符以内', trigger: 'blur' }
        ],
        description: [
          { required: true, message: '请输入番剧描述', trigger: 'blur' }
        ],
        coverFile: [
          { required: true, message: '请上传封面图片', trigger: 'change' }
        ],
        tags: [
          { required: true, message: '请至少选择一个标签', trigger: 'change' }
        ]
      },
      coverUrl: '',
      uploading: false,
      statusDialogVisible: false,
      uploadComplete: false,
      currentStatusStep: 0,
      statusMessage: '准备上传',
      statusClass: 'info',
      statusIcon: 'el-icon-edit'
    }
  },
  created() {
    this.form.userId = Global.user.id
  },
  computed: {
    statusSteps() {
      return {
        'INIT': 0,
        'UPLOADING': 1,
        'PROCESSING': 2,
        'PUBLISHED': 3,
        'FAILED': 3
      }
    }
  },
  methods: {
    // 封面图片上传
    beforeCoverUpload(file) {
      const isImage = file.type.startsWith('image/')
      const isLt5M = file.size / 1024 / 1024 < 5
      
      if (!isImage) {
        this.$message.error('上传文件必须是图片格式!')
      }
      if (!isLt5M) {
        this.$message.error('封面图片大小不能超过5MB!')
      }
      
      return isImage && isLt5M
    },
    handleCoverChange(file) {
      this.form.coverFile = file
      this.coverUrl = URL.createObjectURL(file.raw)
    },
    
    // 分集相关方法
    addEpisode() {
      const nextNumber = this.form.episodes.length + 1
      this.form.episodes.push({
        episodeNumber: nextNumber,
        title: `第${nextNumber}集`,
        description: '',
        videoFile: null,
        duration: null,
        md5: '',
        uploadProgress: 0,
        uploadStatus: '',
        uploadMessage: '等待上传'
      })
    },
    removeEpisode(index) {
      this.form.episodes.splice(index, 1)
      // 重新排序集数
      this.form.episodes.forEach((episode, i) => {
        episode.episodeNumber = i + 1
      })
    },
    
    // 视频上传相关方法
    beforeVideoUpload(file, index) {
      const isVideo = file.type.startsWith('video/')
      const isLt2G = file.size / 1024 / 1024 < 2048
      
      if (!isVideo) {
        this.$message.error('上传文件必须是视频格式!')
      }
      if (!isLt2G) {
        this.$message.error('视频大小不能超过2GB!')
      }
      
      return isVideo && isLt2G
    },
    async handleVideoChange(file, index) {
      this.form.episodes[index].videoFile = file
      
      // 计算视频MD5
      try {
        this.$message.info('正在计算视频MD5，请稍候...')
        const md5 = await this.calculateFileMD5(file.raw)
        this.form.episodes[index].md5 = md5
        this.$message.success('MD5计算完成')
        
        // 获取视频时长
        const duration = await this.getVideoDuration(file.raw)
        this.form.episodes[index].duration = Math.floor(duration)
      } catch (error) {
        this.$message.error('MD5计算失败: ' + error.message)
        this.form.episodes[index].videoFile = null
      }
    },
    
    calculateFileMD5(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        
        reader.onload = (event) => {
          try {
            const wordArray = MD5(event.target.result)
            const md5 = wordArray.toString()
            resolve(md5)
          } catch (error) {
            reject(error)
          }
        }
        
        reader.onerror = (error) => {
          reject(error)
        }
        
        reader.readAsBinaryString(file)
      })
    },
    
    getVideoDuration(file) {
      return new Promise((resolve) => {
        const video = document.createElement('video')
        video.preload = 'metadata'
        
        video.onloadedmetadata = () => {
          resolve(video.duration)
          URL.revokeObjectURL(video.src)
        }
        
        video.src = URL.createObjectURL(file)
      })
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i])
    },
    
    // 提交表单
    async submitForm() {
      try {
        await this.$refs.form.validate()
        
        // 检查必填项
        if (!this.form.coverFile) {
          this.$message.error('请上传封面图片')
          return
        }
        
        if (this.form.tags.length === 0) {
          this.$message.error('请至少选择一个标签')
          return
        }
        
        for (const episode of this.form.episodes) {
          if (!episode.videoFile) {
            this.$message.error('请上传所有分集的视频文件')
            return
          }
        }
        
        this.uploading = true
        this.statusDialogVisible = true
        this.updateStatus('INIT', '准备上传')
        
        // 创建FormData对象
        const formData = new FormData()
        
        // 添加基本信息
        formData.append('title', this.form.title)
        formData.append('description', this.form.description)
        formData.append('area', this.form.area)
        formData.append('seasonNumber', this.form.seasonNumber)
        formData.append('coverFile', this.form.coverFile.raw)
        
        // 添加标签
        this.form.tags.forEach(tag => {
          formData.append('tags', tag)
        })
        
        // 添加分集信息
        this.form.episodes.forEach((episode, index) => {
          formData.append(`episodes[${index}].episodeNumber`, episode.episodeNumber)
          formData.append(`episodes[${index}].title`, episode.title)
          formData.append(`episodes[${index}].description`, episode.description || '')
          formData.append(`episodes[${index}].videoFile`, episode.videoFile.raw)
          formData.append(`episodes[${index}].duration`, episode.duration)
          formData.append(`episodes[${index}].md5`, episode.md5)
        })
        
        // 配置上传进度
        const config = {
          onUploadProgress: progressEvent => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            this.updateStatus('UPLOADING', `上传中... ${percentCompleted}%`, percentCompleted)
          }
        }
        
        // 调用上传API
        this.updateStatus('UPLOADING', '开始上传...', 0)
        const response = await animeApi.uploadAnime(formData, config)
        
        // 上传完成，开始处理
        this.updateStatus('PROCESSING', '视频处理中，请稍候...', 100)
        
        // 模拟处理过程
        setTimeout(() => {
          this.updateStatus('PUBLISHED', '番剧上传成功!', 100)
          this.uploadComplete = true
          this.$message.success('番剧上传成功!')
        }, 3000)
        
      } catch (error) {
        console.error('上传失败:', error)
        this.updateStatus('FAILED', '上传失败: ' + (error.message || '服务器错误'), 0)
        this.$message.error('番剧上传失败: ' + (error.message || '服务器错误'))
      } finally {
        this.uploading = false
      }
    },
    
    updateStatus(status, message, progress = 0) {
      this.currentStatusStep = this.statusSteps[status] || 0
      this.statusMessage = message
      
      // 更新状态样式
      switch(status) {
        case 'UPLOADING':
          this.statusClass = 'processing'
          this.statusIcon = 'el-icon-loading'
          break
        case 'PROCESSING':
          this.statusClass = 'processing'
          this.statusIcon = 'el-icon-loading'
          break
        case 'PUBLISHED':
          this.statusClass = 'success'
          this.statusIcon = 'el-icon-success'
          break
        case 'FAILED':
          this.statusClass = 'error'
          this.statusIcon = 'el-icon-error'
          break
        default:
          this.statusClass = 'info'
          this.statusIcon = 'el-icon-info'
      }
      
      // 更新分集上传进度
      if (status === 'UPLOADING') {
        this.form.episodes.forEach(episode => {
          episode.uploadProgress = progress
          episode.uploadStatus = progress === 100 ? 'success' : ''
          episode.uploadMessage = message
        })
      }
    },
    
    handleStatusDialogClose() {
      this.statusDialogVisible = false
      if (this.uploadComplete) {
        this.resetForm()
      }
    },
    
    resetForm() {
      this.$refs.form.resetFields()
      this.coverUrl = ''
      this.form.tags = []
      this.form.episodes = [
        {
          episodeNumber: 1,
          title: '',
          description: '',
          videoFile: null,
          duration: null,
          md5: '',
          uploadProgress: 0,
          uploadStatus: '',
          uploadMessage: '等待上传'
        }
      ]
      this.uploadComplete = false
      this.currentStatusStep = 0
    }
  }
}
</script>

<style >
.anime-upload-container {
  padding: 20px;
  
  .box-card {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .cover-uploader {
    ::v-deep .el-upload {
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      width: 178px;
      height: 250px;
      
      &:hover {
        border-color: #409EFF;
      }
    }
    
    .cover-uploader-icon {
      font-size: 28px;
      color: #8c939d;
      width: 178px;
      height: 250px;
      line-height: 250px;
      text-align: center;
    }
    
    .cover-image {
      width: 178px;
      height: 250px;
      display: block;
      object-fit: cover;
    }
  }
  
  .video-uploader {
    ::v-deep .el-upload {
      display: block;
    }
    
    .video-info {
      padding: 10px;
      border: 1px solid #ebeef5;
      border-radius: 4px;
      
      .video-name {
        margin-top: 5px;
        font-size: 14px;
        word-break: break-all;
      }
      
      .video-size {
        margin-top: 5px;
        font-size: 12px;
        color: #909399;
      }
      
      .video-progress {
        margin-top: 10px;
      }
    }
  }
  
  .episode-list {
    margin-bottom: 20px;
    
    .episode-item {
      margin-bottom: 20px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
  
  .el-tag {
    margin-right: 10px;
  }
  
  .el-checkbox {
    margin-right: 15px;
  }
  
  .submit-btn {
    margin-top: 30px;
    text-align: center;
  }
  
  .status-steps {
    margin-bottom: 30px;
  }
  
  .status-icon {
    font-size: 24px;
    
    &.success {
      color: #67C23A;
    }
  }
  
  .status-message {
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    
    i {
      margin-right: 10px;
      font-size: 20px;
    }
    
    &.info {
      background-color: #f4f4f5;
      color: #909399;
    }
    
    &.processing {
      background-color: #f0f9eb;
      color: #67C23A;
    }
    
    &.success {
      background-color: #f0f9eb;
      color: #67C23A;
    }
    
    &.error {
      background-color: #fef0f0;
      color: #F56C6C;
    }
  }
  
  .video-preview {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #ebeef5;
  }
  
  .preview-content {
    display: flex;
    gap: 20px;
  }
  
  .cover-container {
    width: 200px;
    height: 120px;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
    
    .video-cover {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .cover-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
    }
  }
  
  .info-preview {
    flex: 1;
    
    .preview-title {
      margin: 0 0 10px 0;
      font-size: 18px;
    }
    
    .preview-description {
      color: #606266;
      font-size: 14px;
      margin-bottom: 10px;
    }
    
    .preview-tags {
      .tag {
        margin-right: 8px;
        margin-bottom: 8px;
      }
    }
  }
}
</style>