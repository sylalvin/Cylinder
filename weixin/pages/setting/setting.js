var app = getApp();
var util = require('../../utils/util');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    qcmappversion: app.globalData.qcmappversion,
    name: "",
    mobile: ""
  },

  // onload
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
  },

  onShow: function () {
    var that = this;
    wx.getStorage({
      key: 'pj_employee_name',
      success: function (res) {
        that.setData({
          'name': res.data
        })
      },
    });
    wx.getStorage({
      key: 'pj_employee_mobile',
      success: function (res) {
        that.setData({
          'mobile': res.data
        })
      },
    });
  },

  // logout
  logout: function() {
    wx.clearStorageSync();
    wx.switchTab({
      url: '/pages/index/index',
    })
  },

  // conScan
  conScan: function() {
    wx.redirectTo({
      url: '/pages/conScan/conScan'
    })
  }
})