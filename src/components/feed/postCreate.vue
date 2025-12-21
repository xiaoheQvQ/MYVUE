<template>
  <div class="post-create-container">
    <div class="create-card">
      <div class="card-header">
        <span class="title">发布新动态</span>
        <el-button type="text" @click="resetForm" :disabled="submitting">清空</el-button>
      </div>

      <div class="card-body">
        <form @submit.prevent="submitForm">
          <div class="form-group">
            <label class="label">分享你的想法</label>
            <div class="textarea-wrapper">
              <el-input type="textarea" v-model="form.content" placeholder="这一刻的想法..." rows="4" maxlength="500"
                show-word-limit resize="none"></el-input>
            </div>
          </div>

          <div class="form-group">
            <label class="label">添加位置（可选）</label>
            <div class="location-wrapper">
              <i class="el-icon-location-outline location-icon"></i>
              <el-input v-model="form.location" placeholder="例如：北京故宫" class="location-input"></el-input>
            </div>
          </div>

          <div class="form-group">
            <label class="label">添加图片（最多9张）</label>
            <div class="image-upload-grid">
              <!-- 图片预览列表 -->
              <div v-for="(file, index) in fileList" :key="index" class="image-item" @mouseenter="hoverIndex = index"
                @mouseleave="hoverIndex = -1">
                <img :src="file.url" class="preview-img">
                <div class="image-actions" :class="{ show: hoverIndex === index }">
                  <i class="el-icon-view action-icon" @click.stop="handlePreview(file)"></i>
                  <i class="el-icon-delete action-icon" @click.stop="handleRemove(index)"></i>
                </div>
              </div>

              <!-- 上传按钮 -->
              <div class="upload-trigger" v-if="fileList.length < 9" @click="$refs.fileInput.click()">
                <input type="file" ref="fileInput" multiple accept="image/*" @change="handleFileChange"
                  style="display: none;">
                <i class="el-icon-plus"></i>
              </div>
            </div>
            <div class="upload-tip">📌 支持 JPG/PNG 格式，单张不超过 5MB</div>
          </div>

          <div class="form-actions">
            <el-button type="primary" native-type="submit" :loading="submitting"
              :disabled="fileList.length === 0 && !form.content.trim()" class="submit-btn">
              {{ submitting ? '发布中...' : '发布动态' }}
            </el-button>
          </div>
        </form>
      </div>
    </div>

    <!-- 图片预览模态框 -->
    <el-dialog :visible.sync="previewVisible" append-to-body width="60%">
      <img :src="previewImage" style="width: 100%; border-radius: 4px;">
    </el-dialog>
  </div>
</template>

<script>
import feedApi from '@/api/feed/feed'

export default {
  name: 'PostCreate',
  data () {
    return {
      form: {
        content: '',
        location: ''
      },
      fileList: [],
      submitting: false,
      previewVisible: false,
      previewImage: '',
      hoverIndex: -1
    }
  },
  methods: {
    async submitForm () {
      if (this.fileList.length === 0 && !this.form.content.trim()) {
        this.$message.warning('请填写内容或添加图片')
        return
      }

      this.submitting = true

      try {
        // 上传图片
        const imageUrls = []
        for (const file of this.fileList) {
          try {
            const res = await feedApi.uploadImage(file.raw)
            imageUrls.push(res.data)
          } catch (error) {
            console.error(`图片 ${file.name} 上传失败:`, error)
            throw error
          }
        }

        // 提交动态
        await feedApi.createPost({
          content: this.form.content.trim(),
          location: this.form.location.trim(),
          imageUrls
        })

        this.$message.success('动态发布成功')
        this.resetForm()
        this.$emit('success')
      } catch (error) {
        console.error('发布失败:', error)
        this.$message.error('发布失败: ' + (
          (error.response && error.response.data && error.response.data.message) ||
          error.message ||
          '未知错误'
        ))
      } finally {
        this.submitting = false
      }
    },

    handleFileChange (e) {
      const files = Array.from(e.target.files)
      if (files.length + this.fileList.length > 9) {
        this.$message.warning('最多只能上传9张图片')
        return
      }

      files.forEach(file => {
        if (!file.type.startsWith('image/')) {
          this.$message.warning(`文件 ${file.name} 不是图片类型`)
          return
        }

        if (file.size > 5 * 1024 * 1024) {
          this.$message.warning(`图片 ${file.name} 大小不能超过5MB`)
          return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
          this.fileList.push({
            name: file.name,
            raw: file,
            url: e.target.result
          })
        }
        reader.readAsDataURL(file)
      })

      // 清空input以便重复选择相同文件
      this.$refs.fileInput.value = ''
    },

    handleRemove (index) {
      this.fileList.splice(index, 1)
    },

    handlePreview (file) {
      this.previewImage = file.url
      this.previewVisible = true
    },

    resetForm () {
      this.form = {
        content: '',
        location: ''
      }
      this.fileList = []
    }
  }
}
</script>

<style scoped>
.post-create-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.create-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-header {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.card-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 24px;
}

.label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.textarea-wrapper {
  position: relative;
}

.location-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.location-icon {
  position: absolute;
  left: 10px;
  color: #c0c4cc;
  z-index: 1;
}

.location-input>>>.el-input__inner {
  padding-left: 30px;
}

.image-upload-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-item {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 1px solid #f0f0f0;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-actions {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-actions.show {
  opacity: 1;
}

.action-icon {
  color: #fff;
  font-size: 20px;
  margin: 0 8px;
  cursor: pointer;
}

.action-icon:hover {
  transform: scale(1.1);
}

.upload-trigger {
  width: 100px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s;
}

.upload-trigger:hover {
  border-color: #409EFF;
}

.upload-trigger i {
  font-size: 24px;
  color: #8c939d;
}

.upload-tip {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.submit-btn {
  padding: 10px 32px;
  font-size: 14px;
  border-radius: 20px;
  /* 圆角按钮 */
  background-color: #ff2442;
  /* 主题红 */
  border-color: #ff2442;
}

.submit-btn:hover,
.submit-btn:focus {
  background-color: #e61e3a;
  border-color: #e61e3a;
}

.submit-btn.is-disabled {
  background-color: #fab6b6;
  border-color: #fab6b6;
}
</style>
