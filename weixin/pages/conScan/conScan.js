// pages/conScan/conScan.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    scanFlag: true,
    time: 2,
    flash: "off",
    animationData: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var that = this;
    wx.setKeepScreenOn({
      keepScreenOn: true,
    })
    // 此动画不能适应手机
    var animation = wx.createAnimation({
      duration: 2000,
      timingFunction: 'linear'
    })
    animation.translateY(260).opacity(0).step();
    animation.translateY(0).opacity(1).step();
    that.setData({
      animationData: animation.export()
    })
    //连续动画关键步骤
    setInterval(function () {
      animation.translateY(260).opacity(0).step();
      animation.translateY(0).opacity(1).step();
      that.setData({
        animationData: animation.export()
      })
    }, 2000)
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  // error
  error: function(e) {
    console.log("Error: " + JSON.stringify(e));
  },

  // success
  success: function(e) {
    var that = this;
    if(that.data.scanFlag) {
      wx.vibrateShort({
        
      })
      console.log("Success: " + JSON.stringify(e.detail.result));
      that.setData({
        scanFlag: false
      })
      setTimeout(() => {
        that.setData({
          scanFlag: true
        })
      }, that.data.time * 1000)
    }
  },

  // 时间间隔
  changeTime: function(e) {
    this.setData({
      time: e.detail.value
    })
  },

  // 控制手电筒
  onFlash: function() {
    if (this.data.flash == "off") {
      this.setData({
        flash: "on"
      })
    } else {
      this.setData({
        flash: "off"
      })
    }
  }
})