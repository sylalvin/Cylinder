var app = getApp();
var util = require('../../utils/util');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    qcmappversion: app.globalData.qcmappversion,
    name: "",
    mobile: "",
    wxUserInfo: null
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
    wx.getStorage({
      key: 'wxUserInfo',
      success: function (res) {
        that.setData({
          'wxUserInfo': JSON.parse(res.data)
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
  },

  // requestMessage
  requestMessage: function() {
    var that = this;
    wx.requestSubscribeMessage({
      tmplIds: ['9_ykAZS-31M9Qy8eNyIFTfEKbKwz09Pjf2NuWc0hYpY'],
      success(res) {
        if (res['9_ykAZS-31M9Qy8eNyIFTfEKbKwz09Pjf2NuWc0hYpY'] == "accept") {
          var grant_type = "client_credential";
          var appid = "wx9a95c716c2525c25";
          var secret = "6cc69e50ca02b6ca0a16cf000d4961d8";
          var template_id = "9_ykAZS-31M9Qy8eNyIFTfEKbKwz09Pjf2NuWc0hYpY";
          var openid = wx.getStorageSync("pj_cylinder_openid");
          var name = "史以林";
          var time = that.returnTodayDate();
          wx.request({
            url: 'https://api.weixin.qq.com/cgi-bin/token',
            method: 'GET',
            data: {
              grant_type: grant_type,
              appid: appid,
              secret: secret
            },
            success: (res) => {
              console.log(res.data.access_token);
              wx.request({
                url: 'https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=' + res.data.access_token,
                method: 'POST',
                data: {
                  "touser": openid,
                  "template_id": template_id,
                  "page": "index",
                  "lang": "zh_CN",
                  "data": {
                    "phrase1": {
                      "value": "气瓶绑码"
                    },
                    "thing4": {
                      "value": "今日完成气瓶绑码100个"
                    },
                    "name3": {
                      "value": name
                    },
                    "time5": {
                      "value": time
                    }
                  }
                },
                success: (result) => {
                  console.log(JSON.stringify(result));
                },
                fail: (e) => {
                  wx.showToast({
                    title: JSON.stringify(e),
                    icon: 'none',
                    mask: true,
                    duration: 2500
                  })
                }
              })
            },
            fail: (e) => {
              wx.showToast({
                title: '接口访问失败',
                icon: 'none',
                mask: true,
                duration: 2500
              })
            }
          })
        }
      },
      fail(err) {
        console.log("err===" + JSON.stringify(err));
      }
    })
  },

  // 今天日期
  returnTodayDate: function () {
    var that = this;
    var todayDate = new Date();
    // 今天日期
    todayDate = todayDate.getFullYear() + "-" + (that.checkRule(todayDate.getMonth() + 1)) + "-" + that.checkRule(todayDate.getDate()) + ' ' + that.checkRule(todayDate.getHours()) + ':' + that.checkRule(todayDate.getMinutes()) + ':' + that.checkRule(todayDate.getSeconds());
    return todayDate;
  },

  checkRule: function (x) {
    if (x < 10) {
      return '0' + x;
    } else {
      return x;
    }
  },
})