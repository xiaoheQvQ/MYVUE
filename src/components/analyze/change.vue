<template>
  <div class="upload">
    <div class="upload-form">
      <el-card class="form-card" shadow="hover">
        <div slot="header" class="form-header">
          <span class="form-title">修改视频信息</span>
        </div>
        <el-form ref="form" :model="videoInfo" label-width="80px">
          <el-form-item label="封面">
            <el-upload
              action="/"
              accept="image/*"
              ref="covers"
              list-type="picture-card"
              :auto-upload="false"
              :limit="1"
              :file-list="coverFileList"
              :on-change="onChangeCoverFileHandler"
              :on-preview="handlePictureCardPreview"
              :on-remove="handleCoverRemove">
              <i class="el-icon-plus"></i>
              <div class="el-upload__tip" slot="tip">只能上传 1 个封面，支持 JPG/PNG 格式</div>
            </el-upload>
            <el-dialog :visible.sync="dialogVisible">
              <img width="100%" :src="dialogImageUrl" alt="">
            </el-dialog>
          </el-form-item>
          <el-form-item label="视频名称" prop="title"
                        :rules="[
                          {required: true, message: '请输入标题', trigger: 'blur'},
                          { min: 4, max: 50, message: '长度在 4 到 50 个字符', trigger: 'blur' }
                        ]">
            <el-input v-model="videoInfo.title" placeholder="请输入视频标题"></el-input>
          </el-form-item>
          <el-form-item label="视频分区" prop="area"
                        :rules="[
                          {required: true, message: '请选择分区', trigger: 'change'}
                        ]">
            <el-select v-model="videoInfo.area" placeholder="请选择视频分区" style="width: 100%">
              <el-option
                v-for="(label, value) in areas"
                :key="value"
                :label="label"
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
                placeholder="输入标签"
              >
              </el-input>
              <el-button v-else class="button-new-tag" size="small" @click="showInput">+ 添加标签</el-button>
            </div>
            <div class="tag-select-hint" v-if="tags && tags.length > 0">
              <span class="hint-text">热门标签：</span>
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
            <div class="tag-tip">最多可添加5个标签</div>
          </el-form-item>
          <el-form-item label="视频描述">
            <el-input 
              type="textarea" 
              v-model="videoInfo.description" 
              :rows="4" 
              maxlength="500" 
              show-word-limit
              placeholder="请输入视频描述，500字以内"></el-input>
          </el-form-item>
          
          <!-- 分P视频排序区域 -->
          <el-form-item label="分P排序" v-if="seriesList && seriesList.length > 0">
            <div class="series-sort-container">
              <div class="series-sort-hint">拖动可调整分P顺序</div>
              <draggable 
                v-model="seriesList" 
                @end="handleSeriesSortEnd"
                handle=".drag-handle"
                class="series-list">
                <div v-for="(item, index) in seriesList" :key="item.id" class="series-item">
                  <i class="el-icon-rank drag-handle"></i>
                  <span class="series-title">{{ item.title }}</span>
                  <span class="series-order">第{{ index + 1 }}P</span>
                </div>
              </draggable>
            </div>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="saveChange" :loading="loading">保存修改</el-button>
            <el-button @click="goBack">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script>
import videoApi from '@/api/video/video'
import draggable from 'vuedraggable'

export default {
  name: 'VideoEdit',
  components: {
    draggable
  },
  data() {
    return {
      videoInfo: {
        title: '',
        description: '',
        cover: '',
        area: '',
        tags: []
      },
      coverFileList: [],
      dialogImageUrl: '',
      dialogVisible: false,
      areas: {},
      tags: [],
      loading: false,
      inputVisible: false,
      inputValue: '',
      videoId: null,
      hasCoverChanged: false,
      coverFile: null,
      seriesList: [], // 分P视频列表
      mainVideo: {}, // 主视频信息
      isSeriesVideo: false // 是否是分P视频
    }
  },
  created() {
    this.videoId = this.$route.query.videoId || this.$route.params.videoId
    if (!this.videoId) {
      this.$message.error('缺少视频ID参数')
      this.$router.go(-1)
      return
    }
    this.loadVideoInfo()
    this.loadAreasAndTags()
    this.loadVideoSeries()
  },
  methods: {
    loadVideoInfo() {
      this.loading = true
      videoApi.getVideoDetail(this.videoId).then(res => {
        if (res.data) {
          this.videoInfo = {
            title: res.data.title || '',
            description: res.data.description || '',
            cover: res.data.cover || '',
            area: res.data.area || '',
            tags: res.data.tags || []
          }
          
          if (res.data.cover) {
            this.coverFileList = [{
              name: 'cover',
              url: res.data.cover
            }]
          }
        }
      }).catch(err => {
        this.$message.error('获取视频信息失败: ' + (err.message || '未知错误'))
        this.$router.go(-1)
      }).finally(() => {
        this.loading = false
      })
    },
    loadAreasAndTags() {
      videoApi.getAreas().then(res => {
        this.areas = res.data || {}
      }).catch(err => {
        console.error('获取分区失败:', err)
        this.areas = {}
      })
      
      videoApi.getTags().then(res => {
        this.tags = res.data || []
      }).catch(err => {
        console.error('获取标签失败:', err)
        this.tags = []
      })
    },
    // 加载分P视频列表
    loadVideoSeries() {
      videoApi.getVideoSeriesList(this.videoId).then(res => {
        if (res.data && res.data.seriesList && res.data.seriesList.length > 0) {
          this.seriesList = res.data.seriesList
          this.mainVideo = res.data.mainVideo
          this.isSeriesVideo = true
        }
      }).catch(err => {
        console.error('获取分P列表失败:', err)
      })
    },
    // 处理分P排序结束事件
    handleSeriesSortEnd() {
      console.log('分P排序结束'+ this.seriesList[0].sortOrder)
      console.log('分P排序结束'+ this.mainVideo.seriesId)
      const sortList = this.seriesList.map((item, index) => ({
        id: item.id,
        sortOrder: index + 1
      }))
      
      //const seriesId = this.seriesList[0] && this.seriesList[0].seriesId
      const seriesId = this.mainVideo.seriesId 
      if (!seriesId) return
      
      const dto = {
        seriesId,
        sortList
      }
      videoApi.sortVideoSeries(dto).then(() => {
        this.$message.success('分P顺序已更新')
      }).catch(err => {
        console.error('排序失败:', err)
        this.$message.error('排序失败，请重试')
        // 重新加载原始顺序
        this.loadVideoSeries()
      })
    },
    onChangeCoverFileHandler(file) {
      this.hasCoverChanged = true
      const isImage = file.raw.type.includes('image/')
      const isLt5M = file.size / 1024 / 1024 < 5
      
      if (!isImage) {
        this.$message.error('只能上传图片文件!')
        return false
      }
      if (!isLt5M) {
        this.$message.error('封面图片大小不能超过5MB!')
        return false
      }
      
      this.$refs.covers.uploadFiles = []
      this.$refs.covers.uploadFiles.push(file)
      this.coverFile = file.raw
    },
    handleCoverRemove() {
      this.hasCoverChanged = true
      this.videoInfo.cover = ''
      this.coverFile = null
    },
    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url
      this.dialogVisible = true
    },
    handleTagClose(index) {
      this.videoInfo.tags.splice(index, 1)
    },
    showInput() {
      if (this.videoInfo.tags.length >= 5) {
        this.$message.warning('最多只能添加5个标签')
        return
      }
      this.inputVisible = true
      this.$nextTick(_ => {
        this.$refs.saveTagInput.$refs.input.focus()
      })
    },
    handleInputConfirm() {
      let inputValue = this.inputValue.trim()
      if (inputValue) {
        if (this.videoInfo.tags.length >= 5) {
          this.$message.warning('最多只能添加5个标签')
          this.inputVisible = false
          this.inputValue = ''
          return
        }
        
        const exists = this.videoInfo.tags.some(tag => {
          return (typeof tag === 'object' && tag.name === inputValue) || 
                 (typeof tag === 'string' && tag === inputValue)
        })
        
        if (!exists) {
          this.videoInfo.tags.push(inputValue)
        } else {
          this.$message.warning('该标签已存在')
        }
      }
      this.inputVisible = false
      this.inputValue = ''
    },
    addPredefinedTag(tag) {
      if (this.videoInfo.tags.length >= 5) {
        this.$message.warning('最多只能添加5个标签')
        return
      }
      
      const exists = this.videoInfo.tags.some(t =>
        (typeof t === 'object' && t.id === tag.id) ||
        (typeof t === 'string' && t === tag.name)
      )
      if (!exists) {
        this.videoInfo.tags.push(tag)
      } else {
        this.$message.warning('该标签已添加')
      }
    },
    saveChange() {
      this.$refs.form.validate(valid => {
        if (valid) {
          this.loading = true
          
          // 处理标签格式
          const processedTags = this.videoInfo.tags.map(tag => {
            return typeof tag === 'object' ? tag : {name: tag}
          })
          
          // 创建FormData对象
          const formData = new FormData()
          formData.append('id', this.videoId)
          formData.append('title', this.videoInfo.title)
          formData.append('description', this.videoInfo.description)
          formData.append('area', this.videoInfo.area)
          formData.append('tags', JSON.stringify(processedTags))
          
          // 如果有封面变更，添加封面文件
          if (this.hasCoverChanged && this.coverFile) {
            formData.append('coverFile', this.coverFile)
          }
          
          // 修改API调用方式
          videoApi.updateVideoFormData(formData).then(res => {
            this.$message.success('修改成功！')
            this.$router.go(-1)
          }).catch(err => {
            this.$message.error('修改失败：' + (err.message || '未知错误'))
          }).finally(() => {
            this.loading = false
          })
        }
      })
    },
    goBack() {
      this.$router.go(-1)
    }
  }
}
</script>

<style scoped>
.upload {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.upload-form {
  margin-top: 20px;
}

.form-card {
  border-radius: 8px;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-title {
  font-size: 18px;
  font-weight: bold;
}

.tag-input-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.tag-item {
  margin-right: 8px;
}

.input-new-tag {
  width: 90px;
}

.button-new-tag {
  height: 24px;
  line-height: 24px;
  border-radius: 12px;
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px dashed #67c23a;
  padding: 0 12px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.button-new-tag:hover {
    background-color: #67c23a;
    color: #fff;
    border: 1px solid #67c23a;
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
  margin-right: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.suggest-tag:hover {
  opacity: 0.8;
  transform: translateY(-2px);
}

.tag-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.el-textarea {
  max-width: 100%;
}

/* 分P排序样式 */
.series-sort-container {
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
}

.series-sort-hint {
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
}

.series-list {
  min-height: 40px;
}

.series-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  cursor: move;
  transition: all 0.3s;
}

.series-item:hover {
  background-color: #e6f7ff;
}

.drag-handle {
  margin-right: 10px;
  color: #909399;
  cursor: move;
}

.series-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.series-order {
  margin-left: 10px;
  color: #67c23a;
  font-weight: bold;
}
</style>