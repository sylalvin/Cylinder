var Charts = require('../../utils/wxcharts.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    latitude: '',
    longitude: '',
    markers: [{
      id: 1,
      latitude: 31.18506,
      longitude: 121.43687,
      name: '易气科技'
    }],
    polyline: [{
      points: [{
        longitude: '',
        latitude: ''
      }, {
        longitude: 113.324520,
        latitude: 23.21229
      }, {
        longitude: 113.320520,
        latitude: 23.21229
      }],
      color: "#FF0000DD",
      width: 2
    }]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var map = wx.createMapContext("map", this);
    wx.getLocation({
      success: function(res) {
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          'polyline.points[0].latitude': res.latitude,
          'polyline.points[0].longitude': res.longitude
        })
        console.log(that.data.polyline.points[0]);
      },
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})