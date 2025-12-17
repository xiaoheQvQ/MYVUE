<template>
  <div class="chat-page-container">
    <!-- 顶部导航栏 -->
    <div class="chat-header">
      <div class="header-left">
        <el-avatar :size="40" :src="toUserInfo.avatar" class="user-avatar"></el-avatar>
        <div class="user-info">
          <h3 class="user-name">{{ toUserInfo.nick || toUserName }}</h3>
          <div class="connection-status" :class="isOnline ?  'connected' : 'disconnected' ">
            {{ connectionText }}
          </div>
        </div>
      </div>
      <div class="header-right">
        <el-button 
          type="text" 
          icon="el-icon-video-camera" 
          class="video-btn"
          @click="toggleVideoChat"
        >{{ showVideoChat ? '隐藏视频' : '视频通话' }}</el-button>
        <el-button 
          type="text" 
          icon="el-icon-close" 
          class="close-btn" 
          @click="closeChat"
        ></el-button>
      </div>
    </div>

    <el-dialog
      title="选择音视频设备"
      :visible.sync="showDeviceSelector"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="device-selector">
        <div class="device-group">
          <h4>选择摄像头:</h4>
          <el-select 
            v-model="selectedCamera" 
            placeholder="请选择摄像头"
            style="width: 100%"
          >
            <el-option
              v-for="cam in availableCameras"
              :key="cam.deviceId"
              :label="cam.label || `摄像头 ${cam.deviceId.slice(0, 5)}...`"
              :value="cam.deviceId"
            ></el-option>
          </el-select>
        </div>
        
        <div class="device-group">
          <h4>选择麦克风:</h4>
          <el-select 
            v-model="selectedMic" 
            placeholder="请选择麦克风"
            style="width: 100%"
          >
            <el-option
              v-for="mic in availableMics"
              :key="mic.deviceId"
              :label="mic.label || `麦克风 ${mic.deviceId.slice(0, 5)}...`"
              :value="mic.deviceId"
            ></el-option>
          </el-select>
        </div>
        
        <div class="preview">
          <h4>预览:</h4>
          <video 
            ref="previewVideo" 
            autoplay 
            muted 
            style="width: 100%; background: #000;"
          ></video>
        </div>
      </div>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="showDeviceSelector = false; callStatus = 'idle'">取消</el-button>
        <el-button type="primary" @click="confirmDeviceSelection">确认</el-button>
      </span>
    </el-dialog>

    <!-- 视频聊天区域 -->
    <div class="video-chat-container" v-if="showVideoChat">
      <!-- 视频通话状态提示 -->
      <div v-if="callStatus !== 'connected'" class="video-status">
        <p>{{ callStatusText }}</p>
      </div>
      
      <!-- 视频通话控制按钮 -->
      <div class="call-controls" v-if="callStatus === 'incoming'">
        <el-button type="success" @click="acceptCall">接受</el-button>
        <el-button type="danger" @click="rejectCall">拒绝</el-button>
      </div>
      
      <div class="video-box">
        <div class="video-wrapper">
          <div class="video-label">我：<span class="userId">{{ currentUserId }}</span></div>
          <video ref="localVideo" autoplay muted class="video-element"></video>
          <div v-if="useOBSVirtualCamera" class="obs-indicator">
            <i class="el-icon-video-camera"></i>
            <span>OBS虚拟摄像头</span>
          </div>
        </div>
        <div class="video-wrapper" v-if="!isRoomEmpty">
          <div class="video-label">对方：<span class="userId">{{ toUserId }}</span></div>
          <video ref="remoteVideo" autoplay class="video-element"></video>
        </div>
      </div>
      
      <div class="video-controls">
        <el-button
          v-if="callStatus === 'idle'"
          type="primary"
          icon="el-icon-video-camera"
          @click="startVideoCall"
        >视频通话</el-button>
        
        <el-select 
          v-if="availableCameras.length > 1 && callStatus !== 'idle' && !useOBSVirtualCamera"
          v-model="selectedCamera"
          @change="switchCamera"
          size="mini"
          style="width: 120px; margin: 0 10px;"
        >
          <el-option
            v-for="cam in availableCameras"
            :key="cam.deviceId"
            :label="cam.label || `摄像头 ${cam.deviceId.slice(0, 5)}`"
            :value="cam.deviceId"
          ></el-option>
        </el-select>
        
        <el-button
          v-if="callStatus === 'connected'"
          type="danger"
          icon="el-icon-switch-button"
          @click="endCall"
        >结束通话</el-button>
        
        <el-button
          v-if="callStatus === 'calling'"
          type="danger"
          icon="el-icon-close"
          @click="cancelCall"
        >取消呼叫</el-button>
      </div>

      <!-- 日志打印 -->
      <div class="log-box" v-if="showLogs">
        <pre>
          <div v-for="(item, index) of logData" :key="index">{{ item }}</div>
        </pre>
      </div>
    </div>

    <!-- 聊天区域 -->
    <div class="chat-messages" ref="messageContainer">
      <div 
        v-for="(message, index) in sortedMessages" 
        :key="index" 
        class="message-item"
        :class="message.from === currentUserId ? 'sent' : 'received'"
      >
        <!-- 接收方消息：头像在左 -->
        <el-avatar 
          v-if="message.from !== currentUserId"
          :size="36" 
          :src="toUserInfo.avatar" 
          class="message-avatar"
        ></el-avatar>
        
        <!-- 发送方消息：头像在右 -->
        <el-avatar 
          v-if="message.from === currentUserId"
          :size="36" 
          :src="userAvatar" 
          class="message-avatar"
        ></el-avatar>
        
        <!-- 消息内容 -->
        <div class="message-content">
          <div class="message-text">{{ message.content }}</div>
          <div class="message-time">{{ formatTime(message.time) }}</div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input-area">
      <div class="input-container">
        <el-input
          type="textarea"
          :rows="3"
          placeholder="输入消息..."
          v-model="inputMessage"
          @keyup.enter.native="sendMessage"
          resize="none"
          class="message-input"
        ></el-input>
        <el-button
          class="send-btn"
          type="primary"
          @click="sendMessage"
          :loading="isSending"
        >
          <i class="el-icon-s-promotion"></i>
          <span>发送</span>
        </el-button>
      </div>
    </div>

    <!-- 视频通话请求弹窗 -->
    <el-dialog
      :visible.sync="showCallDialog"
      title="视频通话请求"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :modal-append-to-body="false" 
      :show-close="false"
    >
      <div class="call-dialog-content">
        <p>{{ callerNick }} 邀请您进行视频通话</p>
        <div class="call-dialog-buttons">
          <el-button type="success" @click="acceptCall" size="medium">接受</el-button>
          <el-button type="danger" @click="rejectCall" size="medium">拒绝</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import Global from '@/components/Global.vue'
import chatApi from '@/api/chat/chat'
import userApi from '@/api/user/user'
import { EventBus } from '@/api/event-bus'
import axios from 'axios'

export default {
  name: 'ChatPage',
  data() {
    return {
      currentUserId: Global.user ? Global.user.id : null,
      toUserId: null,
      toUserName: '',
      toUserInfo: {
        nick: '',
        avatar: ''
      },
      inputMessage: '',
      messages: [],
      isSending: false,
      userAvatar: Global.user ? Global.user.avatar : 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
      messageHandlers: new Map(),
      
      // 视频聊天相关数据
      showVideoChat: false,
      isRoomEmpty: true,
      isJoined: false,
      roomStatusText: "点击'开始视频通话'开始音视频聊天",
      localStream: null,
      peerConnection: null,
      signalingSocket: null,
      logData: ["视频通话日志初始化..."],
      showLogs: false,
      useOBSVirtualCamera: false, // 是否使用OBS虚拟摄像头
      
      // ICE 服务器配置
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
      ],
      
      // 请求根路径
      baseUrl: "http://localhost:8088",
      // 视频通话状态
      callStatus: 'idle',
      callerId: null,
      callerNick: '',
      showCallDialog: false,
      callTimeout: null,
      isProcessingCall: false,
      availableCameras: [],
      selectedCamera: null,
      availableMics: [],
      selectedMic: null,
      showDeviceSelector: false,
      isOnline: false,
      connectionText: '离线'
    }
  },
  watch: {
  toUserId(newVal) {
    if (newVal) {
      this.updateConnectionStatus();
    }
  }
},
mounted() {
  if (this.toUserId) {
    this.updateConnectionStatus();
  }
},
  computed: {
    async updateConnectionStatus() {
    if (!this.toUserId) {
      this.connectionText = '离线';
      return;
    }
    
    try {
      const response = await chatApi.checkUserOnline(this.toUserId);
      this.isOnline = response.data;
      this.connectionText = this.isOnline ? '在线' : '离线';
    } catch (error) {
      console.error("检查在线状态出错:", error);
      this.isOnline = false;
      this.connectionText = '离线';
    }
  },
  
    sortedMessages() {
      return [...this.messages].sort((a, b) => {
        const timeA = Number(a.time) || new Date(a.time).getTime() || 0
        const timeB = Number(b.time) || new Date(b.time).getTime() || 0
        return timeA - timeB
      })
    },
    callStatusText() {
      const statusMap = {
        'idle': '点击"视频通话"按钮开始视频聊天',
        'calling': `正在呼叫 ${this.toUserInfo.nick}...`,
        'ringing': `等待对方接听...`,
        'connected': '视频通话已连接',
        'ended': '视频通话已结束',
        'incoming': `${this.callerNick} 邀请您视频通话`
      }
      return statusMap[this.callStatus] || ''
    }
  },
  async created() {
    this.toUserId = this.$route.query.toUserId
    this.toUserName = this.$route.query.toUserName
    
    if (!Global.user) {
      this.$message.warning('请先登录')
      this.$router.push('/login')
      return
    }
    
    await this.loadUserInfo()
    this.loadChatHistory()
    this.initWebSocket()
    await this.enumerateDevices();
    EventBus.$on('websocket-message', this.handleIncomingMessage)
    EventBus.$on('websocket-video-message', this.handleVideoCallRequest)
    EventBus.$on('websocket-video-response-message', this.handleVideoCallResponse)
    EventBus.$on('websocket-video-ended-message', this.handleVideoCallEnded)
  },
  beforeDestroy() {
    this.unsubscribeFromChannels()
    EventBus.$off('websocket-message', this.handleIncomingMessage)
    EventBus.$off('websocket-video-message', this.handleVideoCallRequest)
    EventBus.$off('websocket-video-response-message', this.handleVideoCallResponse)
    EventBus.$off('websocket-video-ended-message', this.handleVideoCallEnded)
    this.cleanupVideoResources()
  },
  methods: {
    async enumerateDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.availableCameras = devices.filter(d => d.kind === 'videoinput');
        this.availableMics = devices.filter(d => d.kind === 'audioinput');
        
        // 检查是否有OBS虚拟摄像头
        const obsCamera = this.availableCameras.find(cam => 
          cam.label.toLowerCase().includes('obs') || 
          cam.label.toLowerCase().includes('virtual')
        );
        
        if (obsCamera) {
          this.selectedCamera = obsCamera.deviceId;
          this.useOBSVirtualCamera = true;
        } else if (this.availableCameras.length > 0) {
          this.selectedCamera = this.availableCameras[0].deviceId;
        }
        
        if (this.availableMics.length > 0) {
          this.selectedMic = this.availableMics[0].deviceId;
        }
      } catch (error) {
        console.error('枚举设备失败:', error);
        this.$message.error('获取设备列表失败');
      }
    },

    async switchCamera(deviceId) {
      try {
        this.selectedCamera = deviceId;
        await this.restartStream();
      } catch (error) {
        console.error('切换摄像头失败:', error);
        this.$message.error('切换摄像头失败');
      }
    },

    async restartStream() {
      if (!this.localStream) return;
      
      try {
        const constraints = {
          video: this.selectedCamera ? { 
            deviceId: { exact: this.selectedCamera } 
          } : true,
          audio: this.selectedMic ? { 
            deviceId: { exact: this.selectedMic } 
          } : true
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = stream;
        this.$refs.localVideo.srcObject = this.localStream;
        
        if (this.peerConnection) {
          const videoSender = this.peerConnection.getSenders().find(s => 
            s.track.kind === 'video'
          );
          if (videoSender) {
            await videoSender.replaceTrack(this.localStream.getVideoTracks()[0]);
          }
          
          const audioSender = this.peerConnection.getSenders().find(s => 
            s.track.kind === 'audio'
          );
          if (audioSender) {
            await audioSender.replaceTrack(this.localStream.getAudioTracks()[0]);
          }
        }
      } catch (error) {
        console.error('重新获取媒体流失败:', error);
        throw error;
      }
    },

    async getVideoStream() {
      try {
        if (this.localStream) {
          this.localStream.getTracks().forEach(track => track.stop());
        }
        
        // 如果是接收方，尝试使用OBS虚拟摄像头
        if (this.isReceiver) {
          try {
            // 尝试获取OBS虚拟摄像头
            const obsConstraints = {
              video: {
                deviceId: this.selectedCamera ? { exact: this.selectedCamera } : undefined,
                width: { ideal: 1280 },
                height: { ideal: 720 }
              },
              audio: this.selectedMic ? { 
                deviceId: { exact: this.selectedMic } 
              } : true
            };
            
            this.localStream = await navigator.mediaDevices.getUserMedia(obsConstraints);
            this.wlog("成功获取OBS虚拟摄像头");
          } catch (error) {
            console.error('获取OBS虚拟摄像头失败，使用默认摄像头:', error);
            // 如果获取OBS虚拟摄像头失败，使用普通摄像头
            const constraints = {
              video: true,
              audio: true
            };
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.wlog("使用默认摄像头");
          }
        } else {
          // 发送方使用真实摄像头
          const constraints = {
            video: this.selectedCamera ? { 
              deviceId: { exact: this.selectedCamera } 
            } : true,
            audio: this.selectedMic ? { 
              deviceId: { exact: this.selectedMic } 
            } : true
          };
          this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
          this.wlog("使用真实摄像头");
        }
        
        this.$refs.localVideo.srcObject = this.localStream;
        return this.localStream;
      } catch (error) {
        console.error('获取媒体流失败:', error);
        throw error;
      }
    },

    startVideoCall() {
      if (!this.toUserId) {
        this.$message.warning('请选择通话对象')
        return
      }
      
      if (this.callStatus !== 'idle') {
        this.$message.warning('当前已有通话在进行中')
        return
      }
      
      this.isReceiver = false; // 设置为发送方
      this.callStatus = 'calling'
      this.wlog(`发起视频通话请求给 ${this.toUserId}`)
      
      chatApi.sendPrivateVideoChatMessage(
        JSON.stringify({
          type: 'VIDEO_CALL_REQUEST',
          from: this.currentUserId,
          to: this.toUserId,
          fromUserNick: Global.user.nick
        })
      )
      
      this.callTimeout = setTimeout(() => {
        if (this.callStatus === 'calling') {
          this.$message.warning('对方无应答，呼叫已取消')
          this.callStatus = 'idle'
          this.sendCallResponse(this.toUserId, false)
        }
      }, 30000)
    },
    
    handleVideoCallRequest(message) {
      if (this.isProcessingCall) return
      
      if (this.callStatus !== 'idle') {
        console.log("已有通话在进行中，自动拒绝新请求")
        this.sendCallResponse(message.from, false)
        return
      }

      this.isReceiver = true; // 设置为接收方
      this.isProcessingCall = true
      this.callerId = message.from
      this.callerNick = message.fromUserNick
      this.callStatus = 'incoming'
      this.showCallDialog = true
      
      this.callTimeout = setTimeout(() => {
        if (this.callStatus === 'incoming') {
          this.rejectCall()
        }
      }, 30000)
    },
    
    async acceptCall() {
      try {
        this.showCallDialog = false;
        this.callStatus = 'connected';
        this.$message.success('已接受视频通话');
        
        this.sendCallResponse(this.callerId, true);
        
        // 接收方直接使用OBS虚拟摄像头
        if (this.isReceiver) {
          this.joinRoomHandle();
        } else {
          // 发送方显示设备选择器
          this.showDeviceSelector = true;
          await this.enumerateDevices();
        }
        
        if (this.callTimeout) {
          clearTimeout(this.callTimeout);
        }
        this.isProcessingCall = false;
      } catch (error) {
        console.error('接受通话失败:', error);
        this.$message.error('接受视频通话失败: ' + error.message);
        this.callStatus = 'idle';
        this.sendCallResponse(this.callerId, false);
      }
    },
    
    rejectCall() {
      this.showCallDialog = false
      this.callStatus = 'idle'
      this.$message.info('已拒绝视频通话')
      this.sendCallResponse(this.callerId, false)
      
      if (this.callTimeout) {
        clearTimeout(this.callTimeout)
      }
      this.isProcessingCall = false
    },
    
    sendCallResponse(toUserId, accepted) {
      chatApi.sendPrivateVideoChatResponseMessage(
        JSON.stringify({
          type: 'VIDEO_CALL_RESPONSE',
          from: String(this.currentUserId),
          to: String(toUserId),
          accepted: accepted
        })
      )
    },
    
    handleVideoCallResponse(message) {
      if (this.callStatus !== 'calling') return
      
      if (this.callTimeout) {
        clearTimeout(this.callTimeout)
      }
      
      if (message.accepted) {
        this.callStatus = 'connected'
        this.$message.success('对方已接受视频通话')
        this.joinRoomHandle()
      } else {
        this.callStatus = 'idle'
        this.$message.warning('对方已拒绝视频通话')
      }
    },
    
    handleVideoCallEnded(message) {
      if (this.callStatus === 'connected') {
        this.callStatus = 'idle'
        this.$message.info('对方已结束视频通话')
        this.leaveRoomHandle()
      }
    },
    
    cancelCall() {
      if (this.callStatus === 'calling') {
        this.callStatus = 'idle'
        this.$message.info('已取消视频通话')
        this.sendCallResponse(this.toUserId, false)
        
        if (this.callTimeout) {
          clearTimeout(this.callTimeout)
        }
      }
    },
    
    endCall() {
      this.callStatus = 'idle'
      this.$message.info('视频通话已结束')
      this.leaveRoomHandle()
      
      chatApi.sendPrivateVideoChatEndMessage(
        JSON.stringify({
          type: 'VIDEO_CALL_ENDED',
          from: this.currentUserId,
          to: this.toUserId
        })
      )
    },
    
    toggleVideoChat() {
      this.showVideoChat = !this.showVideoChat
      if (this.showVideoChat) {
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
    },
    
    joinRoomHandle() {
      if (this.callStatus !== 'connected') return
      
      this.isJoined = true
      this.wlog("开始视频通话...")
      try {
        this.getVideoStream()
          .then(() => {
            this.wlog("成功获取本地视频流")
            this.createPeerConnection()
          })
          .catch(error => {
            this.wlog("获取视频流失败: " + error.message)
            this.isJoined = false
            this.callStatus = 'idle'
            this.$message.error('获取摄像头权限失败，请检查设备设置')
          })
      } catch (error) {
        this.wlog("加入房间失败: " + error.message)
        this.isJoined = false
        this.callStatus = 'idle'
      }
    },
    
    leaveRoomHandle() {
      this.isJoined = false
      this.isRoomEmpty = true
      
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop())
        this.$refs.localVideo.srcObject = null
      }
      
      if (this.$refs.remoteVideo && this.$refs.remoteVideo.srcObject) {
        this.$refs.remoteVideo.srcObject.getTracks().forEach(track => track.stop())
        this.$refs.remoteVideo.srcObject = null
      }
      
      if (this.peerConnection) {
        this.peerConnection.close()
        this.peerConnection = null
      }
      
      this.oppositeUserId = null
      this.wlog("已离开房间并清理资源")
    },
    
    initSignalingWebSocket() {
      this.wlog("开始连接信令服务器WebSocket")
      this.signalingSocket = new WebSocket(`ws://localhost:8088/rtc?userId=${this.currentUserId}`)
  
      this.signalingSocket.onopen = () => {
        this.wlog('信令WebSocket 已连接')
      }
  
      this.signalingSocket.onerror = (error) => {
        this.wlog('信令WebSocket 错误: ' + error.message)
      }
  
      this.signalingSocket.onclose = () => {
        this.wlog('信令WebSocket 连接关闭')
      }
  
      this.signalingSocket.onmessage = (event) => {
        this.handleSignalingMessage(event.data)
      }
    },
    
    handleSignalingMessage(message) {
      this.wlog("收到信令消息: " + message)
      try {
        const parseMsg = JSON.parse(message)
        this.wlog(`解析结果：类型=${parseMsg.type}`)
  
        switch (parseMsg.type) {
          case "join":
            this.joinHandle(parseMsg.data)
            break
          case "offer":
            this.wlog("收到发起端offer")
            this.offerHandle(parseMsg.data)
            break
          case "answer":
            this.wlog("收到接收端的answer")
            this.answerHandle(parseMsg.data)
            break
          case "candidate":
            this.wlog("收到远端candidate")
            this.candidateHandle(parseMsg.data)
            break
          case "leave":
            this.wlog("对方已离开房间")
            this.handleRemoteLeave()
            break
          default:
            this.wlog("未知消息类型: " + parseMsg.type)
        }
      } catch (error) {
        this.wlog("消息解析错误: " + error.message)
      }
    },
    
    handleRemoteLeave() {
      this.isRoomEmpty = true
      this.roomStatusText = "对方已离开房间"
      this.oppositeUserId = null
      
      if (this.$refs.remoteVideo && this.$refs.remoteVideo.srcObject) {
        this.$refs.remoteVideo.srcObject.getTracks().forEach(track => track.stop())
        this.$refs.remoteVideo.srcObject = null
      }
      this.$message.warning('对方已离开视频通话')
    },
    
    async candidateHandle(candidate) {
      try {
        if (this.peerConnection && this.peerConnection.remoteDescription) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)))
          this.wlog("成功添加远端ICE Candidate")
        } else {
          this.wlog("尚未收到远程描述，暂存Candidate")
        }
      } catch (error) {
        this.wlog("添加ICE Candidate失败: " + error.message)
      }
    },
    
    async answerHandle(answer) {
      try {
        const answerDesc = new RTCSessionDescription(JSON.parse(answer))
        await this.peerConnection.setRemoteDescription(answerDesc)
        this.wlog("成功设置远端Answer描述")
      } catch (error) {
        this.wlog("设置Answer描述失败: " + error.message)
      }
    },
    
    async offerHandle(offer) {
      try {
        const offerDesc = new RTCSessionDescription(JSON.parse(offer))
        await this.peerConnection.setRemoteDescription(offerDesc)
        this.wlog("成功设置远端Offer描述")
  
        const answer = await this.peerConnection.createAnswer()
        await this.peerConnection.setLocalDescription(answer)
        this.wlog("创建并设置本地Answer")
  
        const paramObj = {
          userId: this.oppositeUserId,
          type: "answer",
          data: JSON.stringify(answer)
        }
        
        await axios.post(`${this.baseUrl}/rtcs/sendMessage`, paramObj)
        this.wlog("已发送Answer给对端")
      } catch (error) {
        this.wlog("处理Offer失败: " + error.message)
      }
    },
    
    joinHandle(userIds) {
      if (userIds.length === 1 && userIds[0] === this.currentUserId) {
        this.wlog("我是第一个加入的用户，等待对方加入...")
        this.isRoomEmpty = true
      } else if (userIds.length > 1) {
        this.wlog("检测到对方已连接")
        this.isRoomEmpty = false
  
        for (let id of userIds) {
          if (id !== this.currentUserId) {
            this.oppositeUserId = id
            break
          }
        }
  
        this.wlog(`对端ID: ${this.oppositeUserId}`)
        this.swapVideoInfo()
      }
    },
    
    async swapVideoInfo() {
      this.wlog("开始交换SDP和Candidate...")
      
      if (!this.peerConnection) {
        this.wlog("PeerConnection未初始化")
        return
      }
  
      try {
        if (!this.oppositeUserId) return
  
        const offer = await this.peerConnection.createOffer()
        await this.peerConnection.setLocalDescription(offer)
        this.wlog("创建并设置本地Offer")
  
        const paramObj = {
          userId: this.oppositeUserId,
          type: "offer",
          data: JSON.stringify(offer)
        }
  
        this.wlog(`发送Offer给远端: ${JSON.stringify(paramObj)}`)
        await axios.post(`${this.baseUrl}/rtcs/sendMessage`, paramObj)
      } catch (error) {
        this.wlog("交换SDP失败: " + error.message)
      }
    },
    
    async sendCandidate(candidate) {
      try {
        if (!this.oppositeUserId) {
          this.wlog("尚未知道对方ID，暂不发送Candidate")
          return
        }
  
        const paramObj = {
          userId: this.oppositeUserId,
          type: "candidate",
          data: JSON.stringify(candidate)
        }
  
        this.wlog(`发送Candidate给远端: ${JSON.stringify(candidate)}`)
        await axios.post(`${this.baseUrl}/rtcs/sendMessage`, paramObj)
      } catch (error) {
        this.wlog("发送Candidate失败: " + error.message)
      }
    },
    
    createPeerConnection() {
      this.wlog("开始创建PeerConnection对象...")
      
      try {
        this.peerConnection = new RTCPeerConnection({ iceServers: this.iceServers })
        this.wlog("PeerConnection对象创建成功")
        
        this.initSignalingWebSocket()
  
        this.peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            this.wlog("生成新的ICE Candidate")
            this.sendCandidate(event.candidate)
          } else {
            this.wlog("ICE Candidate收集完成")
          }
        }
  
        this.peerConnection.ontrack = (event) => {
          this.$nextTick(() => {
            this.wlog("收到远端数据流")
            if (event.streams && event.streams[0]) {
              this.$refs.remoteVideo.srcObject = event.streams[0]
              this.$message.success('已建立视频连接')
            }
          })
        }
  
        this.peerConnection.oniceconnectionstatechange = () => {
          const state = this.peerConnection.iceConnectionState
          this.wlog(`ICE连接状态改变: ${state}`)
          
          if (state === "disconnected" || state === "failed") {
            this.wlog("连接断开或失败")
            this.$message.warning('视频连接已断开')
          }
        }
  
        if (this.localStream) {
          this.localStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.localStream)
          })
          this.wlog("已添加本地流到PeerConnection")
        }
      } catch (error) {
        this.wlog("创建PeerConnection失败: " + error.message)
        this.$message.error('创建视频连接失败')
      }
    },
    
    wlog(text) {
      const timestamp = new Date().toLocaleTimeString()
      this.logData.unshift(`[${timestamp}] ${text}`)
      if (this.logData.length > 100) {
        this.logData.pop()
      }
    },
    
    cleanupVideoResources() {
      if (this.isJoined) {
        this.leaveRoomHandle()
      }
    },
    
    async loadUserInfo() {
      try {
        const res = await userApi.getUserInfo(this.toUserId)
        this.toUserInfo = {
          nick: res.data.nick || this.toUserName,
          avatar: res.data.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        this.toUserInfo = {
          nick: this.toUserName,
          avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
        }
      }
    },
    
    initWebSocket() {
      if (!Global.socket) {
        console.error('WebSocket连接未初始化')
        return
      }
      const channel = `private_chat_${this.currentUserId}_${this.toUserId}`
      const handler = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message.channel === channel) {
            switch(message.type) {
              case 'PRIVATE_MESSAGE':
                this.handleIncomingMessage(message)
                break
              case 'PRIVATE_MESSAGE_ACK':
                this.handleMessageAck(message)
                break
            }
          }
        } catch (error) {
          console.error('处理WebSocket消息出错:', error)
        }
      }
      
      this.messageHandlers.set(channel, handler)
      Global.socket.addEventListener('message', handler)
      this.subscribeToChannel(channel)
    },
    
    subscribeToChannel(channel) {
      if (Global.socket && Global.socket.readyState === WebSocket.OPEN) {
        Global.socket.send(JSON.stringify({
          type: 'SUBSCRIBE',
          channel: channel
        }))
      } else {
        console.error('WebSocket未连接，无法订阅频道')
      }
    },
    
    unsubscribeFromChannels() {
      if (!Global.socket) return
      
      for (const [channel, handler] of this.messageHandlers) {
        Global.socket.removeEventListener('message', handler)
        Global.socket.send(JSON.stringify({
          type: 'UNSUBSCRIBE',
          channel: channel
        }))
      }
      this.messageHandlers.clear()
    },
    
    async loadChatHistory() {
      try {
        const res = await chatApi.getChatHistory({
          fromUserId: this.currentUserId,
          toUserId: this.toUserId
        })
        
        this.messages = res.data.map(item => ({
          _id: item.id,
          from: item.fromUserId,
          content: item.content,
          time: item.createTime,
          status: item.fromUserId === this.currentUserId ? 'sent' : 'received'
        }))
        
        this.scrollToBottom()
      } catch (error) {
        console.error('加载聊天记录失败:', error)
        this.$message.error('加载聊天记录失败')
      }
    },
    
    sendMessage() {
      if (!this.inputMessage.trim() || this.isSending) return
      
      this.isSending = true
      const tempId = Date.now()
      
      this.messages.push({
        _id: tempId,
        from: this.currentUserId,
        content: this.inputMessage,
        time: new Date().getTime(),
        status: 'sending',
        to: this.toUserId
      })
      
      const messageContent = this.inputMessage
      this.inputMessage = ''
      this.scrollToBottom()
      
      try {
        if (Global.socket && Global.socket.readyState === WebSocket.OPEN) {
          chatApi.sendPrivateMessage(
            JSON.stringify({
              type: 'PRIVATE_MESSAGE',
              data: {
                from: this.currentUserId,
                to: this.toUserId,
                content: messageContent,
                tempId: tempId,
                fromUserNick: Global.user.nick
              }
            })
          )
        } else {
          throw new Error('WebSocket连接不可用')
        }
      } catch (error) {
        console.error('发送失败:', error)
        this.$message.error('消息发送失败')
        this.messages = this.messages.filter(m => m._id !== tempId)
      } finally {
        this.isSending = false
      }
    },
    
    handleIncomingMessage(message) {
      if (message.data.toUserId === this.currentUserId || message.data.fromUserId === this.currentUserId) {
        message.data.handledInChat = true;
        EventBus.$emit('message-handled', message.data.id);

        this.$set(this.messages, this.messages.length, {
          _id: message.data.id || Date.now(),
          from: message.data.from,
          content: message.data.content,
          time: message.data.time || new Date().getTime(),
          status: 'received'
        })
        this.scrollToBottom()
      }
    },
    
    handleMessageAck(message) {
      const index = this.messages.findIndex(m => m._id === message.data.tempId)
      if (index !== -1) {
        this.$set(this.messages[index], 'status', 'sent')
        this.$set(this.messages[index], '_id', message.data.id)
      }
    },
    
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messageContainer
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    },
    
    formatTime(timestamp) {
      const date = new Date(timestamp)
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    },
    
    closeChat() {
      this.cleanupVideoResources()
      this.$router.go(-1)
    },
  }
}
</script>

<style scoped>
.chat-page-container {
  position: fixed;
  top: 63px;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  z-index: 1000;
  padding: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background-color: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.user-avatar {
  margin-right: 12px;
  border: 2px solid #f0f2f5;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.connection-status {
  font-size: 12px;
  margin-top: 2px;
}

.connection-status.connected {
  color: #67c23a;
}

.connection-status.disconnected {
  color: #f56c6c;
}

.header-right {
  display: flex;
  align-items: center;
}

.video-btn {
  font-size: 16px;
  color: #409eff;
  margin-right: 10px;
}

.close-btn {
  font-size: 20px;
  color: #909399;
}

.video-chat-container {
  padding: 15px;
  background-color: #f0f2f5;
  border-bottom: 1px solid #e4e7ed;
  max-height: 400px;
  overflow-y: auto;
}

.video-status {
  text-align: center;
  padding: 15px;
  font-size: 16px;
  color: #409EFF;
  font-weight: 500;
}

.video-box {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.video-wrapper {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  flex: 1;
  min-width: 300px;
  max-width: 400px;
  position: relative;
}

.video-element {
  width: 100%;
  height: 225px;
  background-color: #000;
  object-fit: cover;
}

.video-label {
  padding: 8px 12px;
  background-color: #f5f5f5;
  font-size: 14px;
  color: #333;
  text-align: center;
}

.userId {
  color: #3669ad;
  font-weight: bold;
}

.video-controls {
  text-align: center;
  margin-bottom: 10px;
}

.call-controls {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 15px 0;
}

.obs-indicator {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
}

.obs-indicator i {
  margin-right: 5px;
}

.log-box {
  margin-top: 15px;
  padding: 10px;
  background-color: #2c3e50;
  border-radius: 5px;
  max-height: 150px;
  overflow-y: auto;
}

.log-box pre {
  color: #ecf0f1;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.log-box div {
  padding: 2px 0;
  border-bottom: 1px solid #34495e;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
  background-attachment: fixed;
}

.message-item {
  display: flex;
  margin-bottom: 20px;
  max-width: 75%;
  align-items: flex-start;
}

.message-item.received {
  margin-right: auto;
  flex-direction: row;
}

.message-item.sent {
  margin-left: auto;
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.message-content {
  display: flex;
  flex-direction: column;
  max-width: calc(100% - 48px);
}

.message-item.received .message-content {
  align-items: flex-start;
  margin-left: 12px;
}

.message-item.sent .message-content {
  align-items: flex-end;
  margin-right: 12px;
}

.message-text {
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
}

.message-item.sent .message-text {
  background: linear-gradient(45deg, #409eff, #79bbff);
  color: white;
  border-top-right-radius: 4px;
  border-bottom-left-radius: 16px;
}

.message-item.received .message-text {
  background-color: white;
  color: #303133;
  border-top-left-radius: 4px;
  border-bottom-right-radius: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}

.message-item.sent .message-time {
  text-align: right;
}

.chat-input-area {
  padding: 16px;
  background-color: white;
  border-top: 1px solid #e4e7ed;
}

.input-container {
  position: relative;
}

.message-input .el-textarea__inner {
  border-radius: 12px;
  resize: none;
  border: 1px solid #e4e7ed;
  padding-right: 80px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: border-color 0.3s;
}

.message-input .el-textarea__inner:focus {
  border-color: #409eff;
}

.send-btn {
  position: absolute;
  right: 8px;
  bottom: 8px;
  height: 36px;
  padding: 0 16px;
  border-radius: 18px;
  font-weight: 500;
}

.send-btn i {
  margin-right: 6px;
}

.call-dialog-content {
  text-align: center;
  padding: 20px;
}

.call-dialog-content p {
  margin-bottom: 30px;
  font-size: 16px;
}

.call-dialog-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.device-selector {
  padding: 0 20px;
}

.device-group {
  margin-bottom: 20px;
}

.device-group h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #606266;
}

.preview {
  margin-top: 20px;
}

.preview h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #606266;
}

.chat-messages::-webkit-scrollbar,
.video-chat-container::-webkit-scrollbar,
.log-box::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track,
.video-chat-container::-webkit-scrollbar-track,
.log-box::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}

.chat-messages::-webkit-scrollbar-thumb,
.video-chat-container::-webkit-scrollbar-thumb,
.log-box::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover,
.video-chat-container::-webkit-scrollbar-thumb:hover,
.log-box::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .video-box {
    flex-direction: column;
  }
  
  .video-wrapper {
    max-width: 100%;
  }
  
  .message-item {
    max-width: 85%;
  }
}
</style>