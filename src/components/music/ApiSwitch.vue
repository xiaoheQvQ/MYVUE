<template>
  <div class="api-switch">
    <el-radio-group v-model="useLocal" size="small" @change="handleSwitch">
      <el-radio-button :label="true">本地接口</el-radio-button>
      <el-radio-button :label="false">开放平台</el-radio-button>
    </el-radio-group>
  </div>
</template>

<script>
import { getUseLocal, setUseLocal } from '@/api/music/music'

export default {
  name: 'ApiSwitch',
  data() {
    return {
      useLocal: getUseLocal()
    }
  },
  methods: {
    handleSwitch(val) {
      setUseLocal(val)
      this.$message.success(`已切换至${val ? '本地' : '开放平台'}接口`)
      // 触发刷新
      window.location.reload()
    }
  }
}
</script>

<style scoped>
.api-switch {
  display: inline-block;
}
</style>
