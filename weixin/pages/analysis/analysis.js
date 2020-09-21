var app = getApp();
var util = require('../../utils/util');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    qcmappversion: '1.0.0',
    isSubmitShow: false,
    cylinderList: [],
    cylinderIdList: [],
    callbackData: {},
    purenessArray: ["普", "2N", "3N", "4N", "5N", "6N", "4.5N"],
    purenessIndex: 0,
    pureness: 0,
    duration: 2000
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
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

  },

  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面加载
   * 获取版本号、流转区域
   */
  onLoad: function (options) {
    var that = this;

    // 获取版本号
    wx.request({
      url: app.globalData.apiUrl + '/version',
      method: 'POST',
      success: (res) => {
        if ((res.data.data != "") && (res.data.data != null)) {
          that.setData({
            qcmappversion: res.data.data
          })
        } else {
          wx.showToast({
            title: '版本号不存在',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: (e) => {
        wx.showToast({
          title: '获取版本号接口访问失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   * 初始化数据
   */
  onReady: function () {
    var that = this;

    wx.getStorage({
      key: 'pj_employee_name',
      success: (res) => {
        that.setData({
          'cylinderInfo.creator': res.data
        })
      },
    })
  },

  // 选择纯度
  onChangePureness: function (e) {
    var value = Number(e.detail.value);
    this.setData({
      "purenessIndex": value,
      "pureness": value + 1
    })
  },

  // 页面主要逻辑部分--开始
  // 扫码添加
  addCylinder: function () {
    var that = this;
    that.initData();
    wx.scanCode({
      success: (res) => {
        // 此处判断散瓶、集格
        if (res.result.indexOf("/set/code/") != -1) {
          // 集格
          var setCode = res.result.indexOf("/set/code/");
          setCode = res.result.substring(setCode + 10);
          that.queryCylinderBySetId(Number(setCode));
        } else if (res.result.indexOf("0001") != -1) {
          // 散瓶
          var setId = null;
          var cylinderCode = res.result;
          var cylinderNumber = cylinderCode.substring(cylinderCode.length - 11);
          if (cylinderNumber.length != 11) {
            that.errorModal("该气瓶码长度不正确");
          } else {
            // 查询气瓶信息
            that.queryCylinderInfoByNumber(setId, cylinderNumber);
          }
        } else {
          that.errorModal("该码不符合规范");
        }
      },
      fail: (e) => {
        // 退出扫码动作或调取扫码动作失败
      }
    })
  },

  // 根据集格编号查询集格下绑定的气瓶
  queryCylinderBySetId: function (setId) {
    var that = this;
    var qcmappversion = that.data.qcmappversion;
    wx.request({
      url: app.globalData.apiUrl + '/getSetCylinderBySetId',
      method: 'GET',
      data: {
        'setId': setId
      },
      header: {
        'qcmappversion': qcmappversion
      },
      success: (res) => {
        if(res.data.code != 200) {
          that.errorModal("ID为 " + setId + " 的集格信息缺失");
          return;
        }
        if ((res.data.data != null) && (res.data.data.cylinderList.length > 0)) { // 集格下有绑定气瓶
          let data = res.data.data;
            if(util.checkEmpty(data.regularInspectionDate)) {
              let regularInspectionDate = data.regularInspectionDate.substring(0, 7); // 集格下检日期
              regularInspectionDate = regularInspectionDate.substring(0, 5) + that.addZero(parseInt(regularInspectionDate.substring(5, 7)) - 1);
              let effect = util.compareDate(regularInspectionDate);
              if(!effect) {
                that.errorModal("集格：" + data.setNumber + "的过期日期为" + regularInspectionDate + "。该集格已过期，请先检验再使用！");
              } else {
                let errorString = "";
                for (let i = 0; i < data.cylinderList.length; i++) {
                  let cylinderScrapDate = "";
                  if(util.checkEmpty(data.cylinderList[i].cylinderScrapDate)) {
                    cylinderScrapDate = data.cylinderList[i].cylinderScrapDate.substring(0, 7);
                    cylinderScrapDate = cylinderScrapDate.substring(0, 5) + that.addZero(parseInt(cylinderScrapDate.substring(5, 7)) - 1);
                    if(!util.compareDate(cylinderScrapDate)) {
                      let regularInspectionDate = "";
                      if(util.checkEmpty(data.cylinderList[i].regularInspectionDate)) {
                        regularInspectionDate = data.cylinderList[i].regularInspectionDate.substring(0, 7);
                        regularInspectionDate = regularInspectionDate.substring(0, 5) + that.addZero(parseInt(regularInspectionDate.substring(5, 7)) - 1);
                        if(!util.compareDate(regularInspectionDate)) {
                          errorString += data.cylinderList[i].cylinderNumber + "-" + cylinderScrapDate + '-' + regularInspectionDate + "\r\n";
                        }
                      } else {
                        regularInspectionDate = "无";
                        errorString += data.cylinderList[i].cylinderNumber + "-" + cylinderScrapDate + '-' + regularInspectionDate + "\r\n";
                      }
                    }
                  } else {
                    cylinderScrapDate = "无";
                    errorString += data.cylinderList[i].cylinderNumber + "-" + cylinderScrapDate + '-' + regularInspectionDate + "\r\n";
                  }
                }
                if (errorString != "") {
                  that.errorModal(data.setNumber + "中的错误气瓶：" + "\r\n" + errorString);
                } else {
                  for (let i = 0; i < data.cylinderList.length; i++) {
                    let cylinderNumber = data.cylinderList[i].cylinderNumber;
                    that.queryCylinderInfoByNumber(setId, cylinderNumber, data.setNumber);
                  }
                }
              }
            } else {
              let errorString = "";
              for (let i = 0; i < data.cylinderList.length; i++) {
                let cylinderScrapDate = "";
                if(util.checkEmpty(data.cylinderList[i].cylinderScrapDate)) {
                  cylinderScrapDate = data.cylinderList[i].cylinderScrapDate.substring(0, 7);
                  cylinderScrapDate = cylinderScrapDate.substring(0, 5) + that.addZero(parseInt(cylinderScrapDate.substring(5, 7)) - 1);
                  if(!util.compareDate(cylinderScrapDate)) {
                    let regularInspectionDate = "";
                    if(util.checkEmpty(data.cylinderList[i].regularInspectionDate)) {
                      regularInspectionDate = data.cylinderList[i].regularInspectionDate.substring(0, 7);
                      regularInspectionDate = regularInspectionDate.substring(0, 5) + that.addZero(parseInt(regularInspectionDate.substring(5, 7)) - 1);
                      if(!util.compareDate(regularInspectionDate)) {
                        errorString += data.cylinderList[i].cylinderNumber + "-" + cylinderScrapDate + '-' + regularInspectionDate + "\r\n";
                      }
                    } else {
                      regularInspectionDate = "无";
                      errorString += data.cylinderList[i].cylinderNumber + "-" + cylinderScrapDate + '-' + regularInspectionDate + "\r\n";
                    }
                  } else {
                    let regularInspectionDate = "";
                    if(util.checkEmpty(data.cylinderList[i].regularInspectionDate)) {
                      regularInspectionDate = data.cylinderList[i].regularInspectionDate.substring(0, 7);
                      regularInspectionDate = regularInspectionDate.substring(0, 5) + that.addZero(parseInt(regularInspectionDate.substring(5, 7)) - 1);
                      if(!util.compareDate(regularInspectionDate)) {
                        errorString += data.cylinderList[i].cylinderNumber + "-" + cylinderScrapDate + '-' + regularInspectionDate + "\r\n";
                      }
                    } else {
                      regularInspectionDate = "无";
                      errorString += data.cylinderList[i].cylinderNumber + "-" + cylinderScrapDate + '-' + regularInspectionDate + "\r\n";
                    }
                  }
                } else {
                  cylinderScrapDate = "无";
                  errorString += data.cylinderList[i].cylinderNumber + "-" + cylinderScrapDate + '-' + regularInspectionDate + "\r\n";
                }
              }
              if (errorString != "") {
                that.errorModal(data.setNumber + "中的错误气瓶：" + "\r\n" + errorString);
              } else {
                for (let i = 0; i < data.cylinderList.length; i++) {
                  let cylinderNumber = data.cylinderList[i].cylinderNumber;
                  that.queryCylinderInfoByNumber(setId, cylinderNumber, data.setNumber);
                }
              }
            }
        } else {
          that.errorModal("集格：" + data.setNumber + "未绑定气瓶");
        }
      },
      fail: (e) => {
        that.errorModal("查询集格接口访问失败");
      }
    })
  },
 
  // 根据气瓶二维码编号查询气瓶信息
  queryCylinderInfoByNumber: function (setId, cylinderNumber, setNumber = null) {
    var that = this;
    var qcmappversion = that.data.qcmappversion;
    var cylinderList = that.data.cylinderList;
    var cylinderIdList = that.data.cylinderIdList;
    if (setId == null) {
      wx.request({
        url: app.globalData.apiUrl + '/getCylinderByNumber',
        method: 'GET',
        data: {
          'cylinderNumber': cylinderNumber
        },
        header: {
          'qcmappversion': qcmappversion
        },
        success: (res) => {
          if ((res.data.data != "") && (res.data.data != null)) {
            if (util.checkEmpty(res.data.data.setId)) {
              that.queryCylinderBySetId(res.data.data.setId);
            } else {
              let cylinderId = res.data.data.id;
              let cylinderTypeName = res.data.data.cylinderTypeName; // 气瓶类型名称
              let gasMediumName = res.data.data.gasMediumName; // 气瓶介质名称
              let cylinderScrapDate = ""; // 气瓶报废日期
              if(!util.checkEmpty(res.data.data.cylinderScrapDate)) {
                cylinderScrapDate = "2020-01";
              } else {
                cylinderScrapDate = res.data.data.cylinderScrapDate.substring(0, 7);
                cylinderScrapDate = cylinderScrapDate.substring(0, 5) + that.addZero(parseInt(cylinderScrapDate.substring(5, 7)) - 1);
              }
              let regularInspectionDate = ""; // 气瓶下检日期
              if(!util.checkEmpty(res.data.data.regularInspectionDate)) {
                regularInspectionDate = "2020-01";
              } else {
                regularInspectionDate = res.data.data.regularInspectionDate.substring(0, 7);
                regularInspectionDate = regularInspectionDate.substring(0, 5) + that.addZero(parseInt(regularInspectionDate.substring(5, 7)) - 1);
              }
              let lastFillTime = res.data.data.lastFillTime; // 气瓶最后充装时间
              let lastFillPureness = that.data.purenessArray[res.data.data.lastFillPureness] ? that.data.purenessArray[res.data.data.lastFillPureness - 1] : "暂无记录"; // 气瓶最后充装纯度
              let effect0 = util.compareDate(cylinderScrapDate);
              if(!effect0) {
                that.errorModal("气瓶：" + cylinderNumber + "的报废日期为" + cylinderScrapDate + "。该气瓶已报废，请先检验再使用！");
                return;
              }
              let effect = util.compareDate(regularInspectionDate);
              if(!effect) {
                that.errorModal("气瓶：" + cylinderNumber + "的过期日期为" + regularInspectionDate + "。该气瓶已过期，请先检验再使用！");
              } else {
                // 存储气瓶数据
                wx.request({
                  url: app.globalData.apiUrl + '/getDetectionCylinderId',
                  data: {
                    cylinderId: cylinderId
                  },
                  header: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    'qcmappversion': qcmappversion
                  },
                  method: 'POST',
                  success: (res) => {
                    if(res.data.code == 200 && res.data.msg == "成功") {
                      cylinderIdList.push(res.data.data.id);
                      that.setData({
                        cylinderIdList: cylinderIdList
                      })
                    } else {
                      that.errorModal(res.data.msg);
                    }                    
                  },
                  fail: (e) => {
                    that.errorModal(res.data.msg);
                  }
                })
                cylinderList.push({ cylinderNumber, cylinderTypeName, gasMediumName, lastFillTime, lastFillPureness });
                that.setData({
                  cylinderList: cylinderList
                })
              }
            }
          } else {
            // 未查询到气瓶信息
            that.errorModal('ID为 ' + cylinderNumber + ' 的气瓶信息缺失');
          }
        },
        fail: (e) => {
          that.errorModal('查询气瓶接口访问失败');
        }
      })
    } else {
      wx.request({
        url: app.globalData.apiUrl + '/getCylinderByNumber',
        method: 'GET',
        data: {
          'cylinderNumber': cylinderNumber
        },
        header: {
          'qcmappversion': qcmappversion
        },
        success: (res) => {
          if ((res.data.data != "") && (res.data.data != null)) {
            let cylinderId = res.data.data.id;
            let cylinderTypeName = res.data.data.cylinderTypeName; // 气瓶类型名称
            let gasMediumName = res.data.data.gasMediumName; // 气瓶介质名称
            let lastFillTime = res.data.data.lastFillTime; // 气瓶最后充装时间
            let lastFillPureness = that.data.purenessArray[res.data.data.lastFillPureness] ? that.data.purenessArray[res.data.data.lastFillPureness - 1] : "暂无记录"; // 气瓶最后充装纯度
            wx.request({
              url: app.globalData.apiUrl + '/getDetectionCylinderId',
              data: {
                cylinderId: cylinderId
              },
              header: {
                "Content-Type": "application/x-www-form-urlencoded",
                'qcmappversion': qcmappversion
              },
              method: 'POST',
              success: (res) => {
                if(res.data.code == 200 && res.data.msg == "成功") {
                  cylinderIdList.push(res.data.data.id);
                  that.setData({
                    cylinderIdList: cylinderIdList
                  })
                } else {
                  that.errorModal(res.data.msg);
                } 
              },
              fail: (e) => {
                that.errorModal(res.data.msg);
              }
            })
            cylinderList.push({ cylinderNumber, cylinderTypeName, gasMediumName, lastFillTime, lastFillPureness });
            that.setData({
              cylinderList: cylinderList
            })
          } else {
            // 未查询到气瓶信息
            that.errorModal('ID为 ' + cylinderNumber + ' 的气瓶信息缺失');
          }
        },
        fail: (e) => {
          that.errorModal('查询气瓶接口访问失败');
        }
      })
    }
  },

  // 初始化数据
  initData: function () {
    var that = this;
    that.setData({
      cylinderList: [],
      cylinderIdList: []
    })
  },

  // 提交
  submitForm: function () {
    var that = this;
    var qcmappversion = that.data.qcmappversion;
    var cylinderIdList = that.data.cylinderIdList;
    if (cylinderIdList.length > 0) {
      var ids = "";
      for(let i = 0; i < cylinderIdList.length; i++) {
        if(i != cylinderIdList.length - 1) {
          ids += cylinderIdList[i] + ',';
        } else {
          ids += cylinderIdList[i];
        }
      }
      var data = {
        ids: ids,
        purity: that.data.pureness
      }
      wx.request({
        url: app.globalData.apiUrl + '/updateCyFillingLastPureness',
        data: data,
        header: {
          "Content-Type": "application/x-www-form-urlencoded",
          'qcmappversion': qcmappversion
        },
        method: 'POST',
        success: (res) => {
          if(res.data.code == 200 && res.data.msg == "成功") {
            that.successShowToast("成功修改纯度");
            that.initData();
          } else {
            that.errorModal(res.data.msg);
          }
        },
        fail: (e) => {
          that.errorModal(res.data.msg);
        }
      })
    } else {
      that.errorModal("您还未扫码，请先扫码！");
    }
  },

  // 日期补零
  addZero: function(x) {
    if(x < 10) {
      return '0' + x;
    } else {
      return '' + x;
    }
  },

  // 正常弹窗提示
  successShowToast: function(successMsg) {
    var that = this;
    wx.showToast({
      title: successMsg,
      icon: 'none',
      duration: that.data.duration,
      mask: true
    })
  },

  // 异常弹窗提示
  errorModal: function(errorMsg, title = "错误提醒", confirmText = "关闭", confirmColor = "#576B95") {
    var that = this;
    wx.showModal({
      title: title,
      content: errorMsg,
      showCancel: false,
      confirmText: confirmText,
      confirmColor: confirmColor,
      success (res) {
        if (res.confirm) {
          console.log("");
        }
      }
    })
  },

  // 页面主要逻辑部分--结束

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }

})