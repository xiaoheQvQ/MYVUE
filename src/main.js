import Vue from 'vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'

Vue.use(Antd)
import App from './App'
import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import axios from 'axios'
import Global from './components/Global'
import VueDPlayer from 'vue-dplayer'
import 'vue-dplayer/dist/vue-dplayer.css'
import './assets/iconfont/iconfont.css'

Vue.use(VueDPlayer)
Vue.config.productionTip = false

Vue.prototype.$http = axios
Vue.use(ElementUI)
Vue.prototype.$axios = axios;
Vue.prototype.Global = Global
/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
