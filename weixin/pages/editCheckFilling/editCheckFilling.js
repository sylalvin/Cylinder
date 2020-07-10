var app = getApp();
var util = require('../../utils/util');
Page({

  /**
   * 充装任务列表删除 js 逻辑；
   * 数据对象
   * { 
   *    scan_sum, --气瓶总数
   *    detectionMissionId, --充装任务ID
   *    status, --充装任务状态
   *    cylinderFillList, --充装气瓶信息集格列表
   * }
   */
  data: {
    scan_sum: 0,
    detectionMissionId: 0,
    status: 1,
    fillList: [],
    cylinderFillList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    if (!util.checkLogin()) {
      wx.showToast({
        title: '您还未登录,请先登录',
        icon: 'none',
        mask: true,
        duration: 1000
      })
      setTimeout(function () {
        wx.switchTab({
          url: '/pages/index/index',
        })
      }, 1000)
      return;
    }
    var detectionMissionId = options.detectionMissionId;
    var status = options.status;
    that.setData({
      detectionMissionId: detectionMissionId,
      status: status
    })

    that.getGlobal();

    that.setData({
      scan_sum: that.data.cylinderFillList.length
    })
  },

  onShow: function() {
    var that = this;
    that.getGlobal();
  },

  onHide: function() {
    var that = this;
    that.setGlobal();
  },

  // 获取全局变量
  getGlobal: function () {
    var that = this;
    var fillList = app.globalData.fillList;
    var cylinderFillList = app.globalData.cylinderFillList;
    that.setData({
      fillList: fillList,
      cylinderFillList: cylinderFillList
    })
  },

  // 设置全局变量
  setGlobal: function () {
    var that = this;
    app.globalData.fillList = that.data.fillList;
    app.globalData.cylinderFillList = that.data.cylinderFillList;
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }

})