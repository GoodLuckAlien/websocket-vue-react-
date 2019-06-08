
/*
* @Author: zhaolin
* @Date:   2019-6-3
* 小程序socket长连接和公共管理方案
*/

let socketUrl = ''
let wx
/**
* @param value
* @returns {string}  强数据类型校验
*/

function isType (value) {
  return Object.prototype.toString.call(value).slice(8, -1)
}

function isSocketContent () { 
  socketUrl = 'ws://192.168.12.50:3333'
}
function wx_socket (Ws, commit, actions) {
  if (isType(commit) !== 'Function') {
    throw new Error('commit must be a function')
  }
  wx = Ws
  this.commit = commit  // commit触发器
  this.actions = actions || null
  this.timer = null
  this.errorResetNumber = 0 // 错误重连间隔
  this.closeWs = false
  this.errorFrom = 0 // socket断开来源
  this.errorResetTimer = null // 错误重连轮询
  this.errorDispatchOpen = true // 开启错误调度
  this.heartSocketOpen = false
  isSocketContent() 
  this.$wx_soctket_init()
}
/**
* websocket ->初始化
* @param callback 初始化失败回调
* @param value 数据处理
*/
wx_socket.prototype.$wx_soctket_init = function (callback) {
  const _this = this
  if (_this.closeWs) {
    throw new Error('wxsocket is closed ,$socker_init is fail ,  all methods is invalid')
  }
  const token = wx.getStorageSync('token') || null
  console.log(token)
  if (!token) {
    throw new Error('token  is underfined')
  } 
  const handerErrorMachine = () => { 
    if (_this.errorResetNumber === 4) {
      _this.errorResetNumber = 0
      _this.errorResetTimer = null
      _this.errorFrom = 0
      _this.errorDispatchOpen = false
      console.log('socket连接失败')
      return
    }
    _this.errorResetTimer = setTimeout(() => {
      _this.$wx_soctket_init()
      _this.errorResetNumber++
    }, _this.errorResetNumber * 2000)
  }

  const errorDispatch = (eventment) => { 
    let event = eventment
    return function () {
      if (_this.errorFrom === 0 && _this.errorDispatchOpen) {
        _this.errorFrom = event
      }
      event === 1 ? console.log('wx socket has not connected  from closeState ') : console.log('web socket has not connected  from errorState ')
      if (_this.errorFrom === event && !_this.closeWs) {
        _this.errorResetTimer && clearTimeout(_this.errorResetTimer)
        handerErrorMachine()
      }   
    }
  }

  if (_this.timer) clearTimeout(_this.timer)

  wx.connectSocket({
    url: socketUrl + '?token=7e6bd4775661e100da6656c3324c437a',
  })

  wx.onSocketOpen(() => {
    callback && callback()
    _this.errorResetNumber = 0
    _this.errorResetTimer = null
    _this.errorFrom = 0
    _this.errorDispatchOpen = true
    _this.$wx_soctket_subscribe()
    _this.$wx_soctket_heartSoctket()
    console.log('wx socket has connected ')
  })

  wx.onSocketClose(errorDispatch(1))
  wx.onSocketError(errorDispatch(2))
}

/**
* 订阅器->接受广播
*/
wx_socket.prototype.$wx_soctket_subscribe = function () {
  const _this = this
  wx.onSocketMessage((res) => {
    if (_this.actions) {
      if (isType(_this.actions) !== 'Function') {
        throw new Error('actions')
      } else {
        _this.commit(_this.actions(res.data))
      }
    } else {
      _this.commit(res.data)
    }
    _this.$wx_soctket_heartSoctket()
  })
}

/**
* 触发器->发布信息
* @param callback 状态处理
* @param value 数据处理
*/
wx_socket.prototype.$wx_soctket_emit = function (value, callback) {
  const _this = this
  if (callback && isType(callback) !== 'Function') {
    throw new Error('$socket_emit arugment[1] must be a function')
  }
  if (!_this.errorDispatchOpen) {
    callback && callback('fail')
  } else {
    wx.sendSocketMessage({
      data: value,
      fail () {
        this.$wx_soctket_init()
      }
    })
    callback && callback('success')
    _this.$wx_soctket_heartSoctket()  
  }
}

/**
* 心脏搏动机制->防止断开连接
*/
wx_socket.prototype.$wx_soctket_heartSoctket = function () {
  if (this.timer) clearTimeout(this.timer)
  console.log(this.timer)
  this.timer = setTimeout(() => {  
    wx.sendSocketMessage({
      data: 'heart , socket',
      fail: () => {
        this.$wx_soctket_init()
      },
    })
    this.$wx_soctket_heartSoctket()  
  }, 59000)
}
/**
* 关闭socket连接
*/
wx_socket.prototype.$wx_soctket_close = function (callback) {
  if (this.timer) clearTimeout(this.timer)
  if (this.errorResetTimer)clearTimeout(this.errorResetTimer)
  this.closeWs = true
  wx.onSocketClose(callback)
}
/**
* 重启socket连接
*/
wx_socket.prototype.$wx_soctket_open = function (callback) {
  if (!this.closeWs) {
    throw new Error('socket is connected')
  }
  this.timer = null
  this.errorResetNumber = 0
  this.closeWs = false
  this.errorFrom = 0
  this.errorResetTimer = null
  this.errorDispatchOpen = true
  this.heartSocketOpen = false
  this.closeWs = false
  this.$wx_soctket_init(callback)
}
export default wx_socket