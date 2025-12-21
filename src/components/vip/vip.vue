<template>
    <div class="member-center">
      <!-- 会员信息卡片 -->
      <el-card class="member-info-card">
        <div slot="header" class="clearfix">
          <span>我的会员</span>
          <el-button v-if="!memberInfo.hasMember"
                     type="primary"
                     size="small"
                     style="float: right;"
                     @click="showPlanDialog">
            开通会员
          </el-button>
        </div>

        <div v-if="memberInfo.hasMember" class="member-detail">
          <div class="member-level">
            <img :src="getLevelIcon(memberInfo.memberLevel)" class="level-icon">
            <span class="level-text">{{ getLevelName(memberInfo.memberLevel) }}</span>
          </div>

          <div class="member-time">
            <div class="time-item">
              <span class="time-label">开通时间:</span>
              <span class="time-value">{{ formatTime(memberInfo.startTime) }}</span>
            </div>
            <div class="time-item">
              <span class="time-label">到期时间:</span>
              <span class="time-value" :class="{'expire-soon': isExpireSoon}">
                {{ formatTime(memberInfo.endTime) }}
                <el-tag v-if="isExpireSoon" size="mini" type="danger">即将到期</el-tag>
              </span>
            </div>
          </div>

          <div class="member-actions">
            <el-button type="primary" @click="showRenewDialog">续费会员</el-button>
            <el-button @click="showBenefits">会员特权</el-button>
          </div>
        </div>

        <div v-else class="no-member">
          <img src="@/assets/member.png" class="no-member-img">
          <p class="no-member-text">您还不是会员，开通会员享受专属特权</p>
          <el-button type="primary" @click="showPlanDialog">立即开通</el-button>
        </div>
      </el-card>

      <!-- 会员特权卡片 -->
      <el-card class="member-benefits-card">
        <div slot="header" class="clearfix">
          <span>会员特权</span>
        </div>

        <div class="benefits-list">
          <div v-for="(benefit, index) in benefits" :key="index" class="benefit-item">
            <div class="benefit-icon">
              <i :class="benefit.icon"></i>
            </div>
            <div class="benefit-content">
              <h4 class="benefit-title">{{ benefit.title }}</h4>
              <p class="benefit-desc">{{ benefit.desc }}</p>
            </div>
            <div class="benefit-level">
              <el-tag v-for="level in benefit.levels" :key="level"
                      :type="getLevelTagType(level)"
                      size="mini">
                {{ getLevelName(level) }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 会员套餐弹窗 -->
      <el-dialog title="选择会员套餐" :visible.sync="planDialogVisible" width="70%" center>
        <div class="plan-container">
          <div v-for="plan in availablePlans" :key="plan.id" class="plan-item"
               :class="{'recommend-plan': plan.level === 2}">
            <div class="plan-header">
              <h3 class="plan-name">{{ plan.name }}</h3>
              <p class="plan-desc">{{ plan.description }}</p>
            </div>

            <div class="plan-price">
              <div class="price-coin" v-if="!useCoins">
                <span class="price-symbol">¥</span>
                <span class="price-value">{{ plan.price }}</span>
              </div>
              <div class="price-coin" v-else>
                <span class="price-value">{{ plan.coinPrice }}</span>
                <span class="price-symbol">金币</span>
              </div>

              <div class="price-original" v-if="plan.discount < 1">
                <span class="original-price">¥{{ (plan.price / plan.discount).toFixed(2) }}</span>
                <span class="discount-tag">{{ (plan.discount * 10).toFixed(1) }}折</span>
              </div>
            </div>

            <div class="plan-duration">
              <i class="el-icon-time"></i>
              <span>有效期 {{ plan.duration }} 天</span>
            </div>

            <div class="plan-features">
              <p v-for="(feature, index) in getPlanFeatures(plan.level)" :key="index">
                <i class="el-icon-check"></i> {{ feature }}
              </p>
            </div>

            <div class="plan-action">
              <el-button type="primary" @click="handlePurchase(plan.id)">
                立即开通
              </el-button>
            </div>
          </div>
        </div>

        <div slot="footer" class="dialog-footer">
          <el-checkbox v-model="useCoins">使用金币支付</el-checkbox>
          <span class="coin-balance">当前金币: {{ coinBalance }}</span>
        </div>
      </el-dialog>

      <!-- 续费弹窗 -->
      <el-dialog title="续费会员" :visible.sync="renewDialogVisible" width="50%" center>
        <div v-if="memberInfo.hasMember" class="renew-container">
          <div class="current-member">
            <span>当前会员: </span>
            <el-tag :type="getLevelTagType(memberInfo.memberLevel)">
              {{ getLevelName(memberInfo.memberLevel) }}
            </el-tag>
            <span>到期时间: {{ formatTime(memberInfo.endTime) }}</span>
          </div>

          <el-divider></el-divider>

          <div class="plan-select">
            <el-radio-group v-model="selectedRenewPlanId" size="medium">
              <el-radio-button v-for="plan in renewPlans"
                              :key="plan.id"
                              :label="plan.id">
                <div class="plan-option">
                  <div class="plan-name">{{ plan.name }}</div>
                  <div class="plan-price" v-if="!useCoins">
                    ¥{{ plan.price }}
                  </div>
                  <div class="plan-price" v-else>
                    {{ plan.coinPrice }}金币
                  </div>
                </div>
              </el-radio-button>
            </el-radio-group>
          </div>

          <div slot="footer" class="dialog-footer">
            <el-checkbox v-model="useCoins">使用金币支付</el-checkbox>
            <span class="coin-balance">当前金币: {{ coinBalance }}</span>
            <el-button @click="renewDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleRenew">确认续费</el-button>
          </div>
        </div>
      </el-dialog>

      <!-- 支付结果弹窗 -->
      <el-dialog
        title="支付结果"
        :visible.sync="payResultDialogVisible"
        width="30%"
        center>
        <div style="text-align: center">
          <i :class="paySuccess ? 'el-icon-success success-icon' : 'el-icon-error error-icon'"></i>
          <p style="font-size: 18px; margin-top: 15px">{{ payResultMessage }}</p>
        </div>
        <span slot="footer" class="dialog-footer">
          <el-button type="primary" @click="payResultDialogVisible = false">确 定</el-button>
        </span>
      </el-dialog>

      <!-- 充值弹窗 -->
      <el-dialog
        title="金币充值"
        :visible.sync="rechargeDialogVisible"
        width="30%"
        center>
        <div style="text-align: center">
          <el-input-number
            v-model="rechargeAmount"
            :min="10"
            :max="1000"
            :step="10"
            label="充值金额"
            style="width: 200px; margin-bottom: 20px;"
          ></el-input-number>
          <p style="color: #999; margin-bottom: 20px;">充值比例: 1元 = 10金币</p>
          <el-button
            type="primary"
            :loading="rechargeLoading"
            @click="handleRecharge"
          >立即充值</el-button>
        </div>
      </el-dialog>
    </div>
  </template>

<script>
import memberApi from '@/api/vip/vip'
import liveApi from '@/api/live/live'

const baseUrl = 'http://localhost:8088'

export default {
  name: 'vip',
  data () {
    return {
      memberInfo: {
        hasMember: false,
        memberLevel: 0,
        startTime: null,
        endTime: null,
        memberStatus: false
      },
      benefits: [
        {
          title: '专属标识',
          desc: '会员专属标识，彰显尊贵身份',
          icon: 'el-icon-medal',
          levels: [1, 2, 3]
        },
        {
          title: '免费礼物',
          desc: '每日赠送免费礼物，可用于直播间互动',
          icon: 'el-icon-present',
          levels: [2, 3]
        },
        {
          title: '专属客服',
          desc: '优先接入专属客服，快速解决问题',
          icon: 'el-icon-service',
          levels: [3]
        },
        {
          title: '进场特效',
          desc: '直播间进场专属特效，吸引全场目光',
          icon: 'el-icon-magic-stick',
          levels: [2, 3]
        },
        {
          title: '无广告',
          desc: '享受无广告打扰的纯净体验',
          icon: 'el-icon-circle-close',
          levels: [1, 2, 3]
        },
        {
          title: '高清画质',
          desc: '解锁高清和蓝光画质选项',
          icon: 'el-icon-video-camera',
          levels: [1, 2, 3]
        }
      ],
      availablePlans: [],
      renewPlans: [],
      planDialogVisible: false,
      renewDialogVisible: false,
      useCoins: false,
      coinBalance: 0,
      selectedPlanId: null,
      selectedRenewPlanId: null,
      payResultDialogVisible: false,
      paySuccess: false,
      payResultMessage: '',
      pollingInterval: null,
      rechargeDialogVisible: false,
      rechargeAmount: 10,
      rechargeLoading: false
    }
  },
  computed: {
    isExpireSoon () {
      if (!this.memberInfo.hasMember || !this.memberInfo.endTime) return false
      const endTime = new Date(this.memberInfo.endTime).getTime()
      const now = Date.now()
      return endTime - now < 7 * 24 * 60 * 60 * 1000 // 7天内到期
    }
  },
  created () {
    this.loadMemberInfo()
    this.loadCoinBalance()
  },
  beforeDestroy () {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
    }
  },
  methods: {
    async loadMemberInfo () {
      try {
        const res = await memberApi.getMemberInfo()
        this.memberInfo = res.data
      } catch (error) {
        console.error('获取会员信息失败:', error)
        this.$message.error('获取会员信息失败')
      }
    },

    async loadCoinBalance () {
      try {
        const res = await liveApi.getBalance()
        this.coinBalance = res.data.coinBalance || 0
      } catch (error) {
        console.error('获取金币余额失败:', error)
      }
    },

    async showPlanDialog () {
      try {
        const res = await memberApi.getAvailablePlans()
        this.availablePlans = res.data
        this.planDialogVisible = true
      } catch (error) {
        console.error('获取会员套餐失败:', error)
        this.$message.error('获取会员套餐失败')
      }
    },

    async showRenewDialog () {
      try {
        const res = await memberApi.getAvailablePlans()
        // 只显示同等级或更高级的套餐
        this.renewPlans = res.data.filter(plan =>
          plan.level >= this.memberInfo.memberLevel
        )
        this.selectedRenewPlanId = (this.renewPlans && this.renewPlans[0]) ? this.renewPlans[0].id : null
        this.renewDialogVisible = true
      } catch (error) {
        console.error('获取续费套餐失败:', error)
        this.$message.error('获取续费套餐失败')
      }
    },

    showBenefits () {
      this.$alert('会员特权详情', '会员特权', {
        confirmButtonText: '确定',
        customClass: 'benefits-modal'
      })
    },

    async handlePurchase (planId) {
      try {
        const selectedPlan = this.availablePlans.find(p => p.id === planId)
        if (!selectedPlan) {
          throw new Error('选择的套餐不存在')
        }

        // 检查金币是否足够
        if (this.useCoins && this.coinBalance < selectedPlan.coinPrice) {
          this.$confirm('金币不足，是否立即充值？', '金币不足', {
            confirmButtonText: '去充值',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            this.planDialogVisible = false
            this.rechargeDialogVisible = true
          })
          return
        }

        const res = await memberApi.purchaseMember(planId, this.useCoins)
        if (res.data) {
          this.paySuccess = true
          this.payResultMessage = '会员开通成功！'
          this.payResultDialogVisible = true
          this.planDialogVisible = false
          await this.loadMemberInfo()
          await this.loadCoinBalance()
        }
      } catch (error) {
        console.error('购买会员失败:', error)
        this.paySuccess = false
        this.payResultMessage = error.message || '购买会员失败'
        this.payResultDialogVisible = true
      }
    },

    async handleRenew () {
      try {
        const selectedPlan = this.renewPlans.find(p => p.id === this.selectedRenewPlanId)
        if (!selectedPlan) {
          throw new Error('选择的套餐不存在')
        }

        // 检查金币是否足够
        if (this.useCoins && this.coinBalance < selectedPlan.coinPrice) {
          this.$confirm('金币不足，是否立即充值？', '金币不足', {
            confirmButtonText: '去充值',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            this.renewDialogVisible = false
            this.rechargeDialogVisible = true
          })
          return
        }

        const res = await memberApi.renewMember(
          this.selectedRenewPlanId,
          this.useCoins
        )

        if (res.data) {
          this.paySuccess = true
          this.payResultMessage = '会员续费成功！'
          this.payResultDialogVisible = true
          this.renewDialogVisible = false
          await this.loadMemberInfo()
          await this.loadCoinBalance()
        }
      } catch (error) {
        console.error('续费会员失败:', error)
        this.paySuccess = false
        this.payResultMessage = error.message || '续费会员失败'
        this.payResultDialogVisible = true
      }
    },

    async handleRecharge () {
      this.rechargeLoading = true
      try {
        // 创建充值订单
        const orderRes = await liveApi.createRechargeOrder(
          this.rechargeAmount,
          `金币充值-${this.rechargeAmount}元`
        )

        const orderId = orderRes.data.orderId
        const amount = this.rechargeAmount

        // 打开支付宝支付页面
        const payUrl = `${baseUrl}/alipay/pay?traceNo=${orderId}&totalAmount=${amount}&subject=金币充值`
        const newWindow = window.open(payUrl, '_blank')

        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          this.$message.warning('请允许弹出窗口以完成支付')
          this.rechargeLoading = false
          return
        }

        // 开始轮询检查支付状态
        this.startPollingPaymentStatus(orderId, amount)

        this.rechargeDialogVisible = false
        this.$message.info('请在支付宝页面完成支付')
      } catch (error) {
        console.error('充值失败:', error)
        this.$message.error('充值失败: ' + (error.message || ''))
        this.rechargeLoading = false
      }
    },

    startPollingPaymentStatus (orderId, amount) {
      // 先清除之前的轮询
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval)
      }

      // 开始新的轮询
      this.pollingInterval = setInterval(async () => {
        try {
          const res = await liveApi.checkPaymentStatus(orderId)
          if (res.data.paid) {
            clearInterval(this.pollingInterval)
            this.$message.success('充值成功！')
            await this.loadCoinBalance()
          }
        } catch (error) {
          console.error('检查支付状态失败:', error)
          clearInterval(this.pollingInterval)
        }
      }, 3000) // 每3秒检查一次
    },

    getLevelName (level) {
      switch (level) {
        case 1: return '普通会员'
        case 2: return '高级会员'
        case 3: return '尊享会员'
        default: return '非会员'
      }
    },

    getLevelTagType (level) {
      switch (level) {
        case 1: return 'primary'
        case 2: return 'warning'
        case 3: return 'danger'
        default: return 'info'
      }
    },

    getLevelIcon (level) {
      switch (level) {
        case 1: return require('@/assets/lv1.png')
        case 2: return require('@/assets/lv2.png')
        case 3: return require('@/assets/lv3.png')
        default: return require('@/assets/lv0.png')
      }
    },

    getPlanFeatures (level) {
      const baseFeatures = [
        '无广告观看体验',
        '高清画质解锁',
        '会员专属标识'
      ]

      const advancedFeatures = [
        ...baseFeatures,
        '每日免费礼物',
        '进场特效'
      ]

      const vipFeatures = [
        ...advancedFeatures,
        '专属客服',
        '优先排队'
      ]

      switch (level) {
        case 1: return baseFeatures
        case 2: return advancedFeatures
        case 3: return vipFeatures
        default: return []
      }
    },

    formatTime (time) {
      if (!time) return ''
      return new Date(time).toLocaleString()
    }
  }
}
</script>

  <style scoped>
  .member-center {
    max-width: 1200px;
    margin: 20px auto;
    padding: 0 20px;
  }

  .member-info-card {
    margin-bottom: 20px;
  }

  .member-detail {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .member-level {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .level-icon {
    width: 40px;
    height: 40px;
  }

  .level-text {
    font-size: 20px;
    font-weight: bold;
    color: var(--el-color-primary);
  }

  .member-time {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .time-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .time-label {
    font-weight: bold;
    min-width: 80px;
  }

  .time-value {
    color: #666;
  }

  .expire-soon {
    color: var(--el-color-danger);
  }

  .member-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }

  .no-member {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px 0;
  }

  .no-member-img {
    width: 150px;
    height: 150px;
    margin-bottom: 20px;
    opacity: 0.7;
  }

  .no-member-text {
    color: #999;
    margin-bottom: 20px;
  }

  .member-benefits-card {
    margin-bottom: 20px;
  }

  .benefits-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .benefit-item {
    display: flex;
    gap: 15px;
    padding: 15px;
    border-radius: 8px;
    background-color: #f9f9f9;
    transition: all 0.3s;
  }

  .benefit-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .benefit-icon {
    font-size: 24px;
    color: var(--el-color-primary);
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(64, 158, 255, 0.1);
    border-radius: 50%;
  }

  .benefit-content {
    flex: 1;
  }

  .benefit-title {
    margin: 0 0 5px 0;
    font-size: 16px;
  }

  .benefit-desc {
    margin: 0;
    color: #666;
    font-size: 14px;
  }

  .benefit-level {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .plan-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  .plan-item {
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
  }

  .plan-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }

  .recommend-plan {
    border: 2px solid var(--el-color-warning);
  }

  .recommend-plan::before {
    content: '推荐';
    position: absolute;
    top: 10px;
    right: -25px;
    background-color: var(--el-color-warning);
    color: white;
    padding: 2px 30px;
    transform: rotate(45deg);
    font-size: 12px;
  }

  .plan-header {
    margin-bottom: 15px;
    text-align: center;
  }

  .plan-name {
    margin: 0;
    font-size: 18px;
    color: #333;
  }

  .plan-desc {
    margin: 5px 0 0 0;
    color: #999;
    font-size: 12px;
  }

  .plan-price {
    text-align: center;
    margin-bottom: 15px;
  }

  .price-coin {
    display: flex;
    justify-content: center;
    align-items: baseline;
    gap: 5px;
  }

  .price-symbol {
    font-size: 16px;
    color: #666;
  }

  .price-value {
    font-size: 28px;
    font-weight: bold;
    color: var(--el-color-primary);
  }

  .price-original {
    margin-top: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
  }

  .original-price {
    text-decoration: line-through;
    color: #999;
    font-size: 14px;
  }

  .discount-tag {
    background-color: var(--el-color-danger);
    color: white;
    padding: 2px 5px;
    border-radius: 4px;
    font-size: 12px;
  }

  .plan-duration {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
    color: #666;
    margin-bottom: 15px;
  }

  .plan-features {
    flex: 1;
    margin-bottom: 20px;
  }

  .plan-features p {
    margin: 8px 0;
    color: #666;
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 14px;
  }

  .plan-features i {
    color: var(--el-color-success);
  }

  .plan-action {
    text-align: center;
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .coin-balance {
    color: var(--el-color-warning);
    font-weight: bold;
  }

  .renew-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .current-member {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .plan-select {
    margin: 20px 0;
  }

  .plan-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 20px;
  }

  .plan-option .plan-name {
    font-size: 14px;
    margin-bottom: 5px;
  }

  .plan-option .plan-price {
    font-weight: bold;
    color: var(--el-color-primary);
    margin: 0;
  }

  .success-icon {
    font-size: 50px;
    color: #67C23A;
  }

  .error-icon {
    font-size: 50px;
    color: #F56C6C;
  }

  @media (max-width: 768px) {
    .benefits-list {
      grid-template-columns: 1fr;
    }

    .plan-container {
      grid-template-columns: 1fr;
    }
  }
  </style>
