var app = getApp();
var util = require('../../utils/util');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    qcmappversion: '1.0.0',
    disabled: false,
    opacity: 0.9,
    scanFlag: true,
    scan_number: 0,
    scan_bulk: 0,
    scan_set: 0,
    scan_sum: 0,
    cylinderList: [],
    setList: [],
    setCylinderList: [],
    allCylinderList: [],
    orderData: {
      employeeId: "",
      shipNumber: "",
      unitId: 1,
      remark: "",
      cylinderIdList: ""
    },
    forTransNumberList: [],
    animationData: {},
    duration: 2000,
    display: 'none', // 自定义toast的mask
    purenessArray: ["普", "2N", "3N", "4N", "5N", "6N", "4.5N"]
  },

  onShow: function () {
    var that = this;
    // 执行删除后的初始化气瓶数据
    var setList = app.globalData.stockSetList;
    var cylinderList = app.globalData.stockCylinderList;
    var setCylinderList = app.globalData.stockSetCylinderList;
    var allCylinderList = app.globalData.stockAllCylinderList;
    that.setData({
      setList: setList,
      cylinderList: cylinderList,
      setCylinderList: setCylinderList,
      allCylinderList: allCylinderList
    })
    that.countData();
  },

  onHide: function () {
    var that = this;
    // 设置回厂验空全局变量
    that.setGlobal();
  },

  /**
   * 生命周期函数--监听页面加载
   * 获取版本号、流转区域
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
          that.errorModalNoStart("版本号不存在");
        }
      },
      fail: (e) => {
        that.errorModalNoStart("获取版本号接口访问失败");
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   * 初始化数据
   */
  onReady: function () {
    var that = this;
    that.mtoast = that.selectComponent("#mtoast");
    wx.getStorage({
      key: 'pj_employee_id',
      success: (res) => {
        that.setData({
          'orderData.employeeId': res.data
        })
      },
    })
  },

  remarkInputChange: function (e) {
    var that = this;
    that.setData({
      'orderData.remark': e.detail.value
    })
  },

  // 模糊查询运单号item
  bindInputChange: function (e) {
    var that = this;
    var inputValue = e.detail.value;
    that.setData({
      'orderData.shipNumber': inputValue
    })
    if (inputValue.length > 4) {
      wx.request({
        url: "https://wx.feifanqishi.net/index.php",
        method: 'GET',
        data: {
          'action': 'searchTransOrderNumber',
          'number': inputValue
        },
        header: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        success: (res) => {
          if (that.judge(res.data.data)) {
            let forTransNumberList = [];
            for (let k = 0; k < res.data.data.length; k++) {
              forTransNumberList.push(res.data.data[k]);
            }
            that.setData({
              forTransNumberList: forTransNumberList
            })
            that.showAnimation();
          } else {
            that.setData({
              forTransNumberList: []
            })
          }
        },
        fail: (e) => {
          that.errorModalNoStart("查询运单号列表接口访问失败");
        }
      })
    } else {
      that.setData({
        forTransNumberList: []
      })
    }
  },

  onSelectItem: function (e) {
    var that = this;
    let forTransNumberList = that.data.forTransNumberList;
    let index = e.currentTarget.dataset.setIndex;
    that.setData({
      'orderData.shipNumber': forTransNumberList[index],
      forTransNumberList: []
    })
  },

  // 动画
  showAnimation: function () {
    var that = this;
    var animation = wx.createAnimation({
      duration: 1000,
      timingFunction: 'ease'
    });
    animation.opacity(1).step();
    that.setData({
      animationData: animation.export()
    })
  },

  // 页面主要逻辑部分--开始
  // 扫码添加
  start: function() {
    var that = this;
    if (that.data.scanFlag) {
      that.addCylinder();
    }
  },

  addCylinder: function () {
    var that = this;
    that.setData({
      scanFlag: true
    })
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
          var cylinderList = that.data.cylinderList;
          var cylinderNumber = cylinderCode.substring(cylinderCode.length - 11);
          if (cylinderNumber.length != 11) {
            that.errorModal("该气瓶码长度不正确");
          } else {
            if (cylinderList.includes(cylinderNumber)) {
              that.errorModal("该气瓶(" + cylinderNumber + ")已扫描");
            } else {
              // 查询气瓶信息
              that.queryCylinderInfoByNumber(setId, cylinderNumber);
            }
          }
        } else {
          that.errorModal("该码不符合规范");
        }
      },
      fail: (e) => {
        // 退出扫码动作或调取扫码动作失败
        that.setData({
          scanFlag: false,
          display: 'none'
        })
      }
    })
  },

  // 根据集格编号查询集格下绑定的气瓶
  queryCylinderBySetId: function (setId) {
    var that = this;
    var qcmappversion = that.data.qcmappversion;
    var setList = that.data.setList;
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
          if (setList.includes(setId)) {
            that.errorModal("该集格(" + data.setNumber + ")已扫描");
          } else {
            if(util.checkEmpty(data.regularInspectionDate)) {
              let regularInspectionDate = data.regularInspectionDate.substring(0, 7); // 集格下检日期
              regularInspectionDate = regularInspectionDate.substring(0, 5) + that.addZero(parseInt(regularInspectionDate.substring(5, 7)) - 1);
              let effect = util.compareDate(regularInspectionDate);
              if(!effect) {
                that.errorModal("集格：" + data.setNumber + "的过期日期为" + regularInspectionDate + "。该集格已过期，请先检验再使用！");
              } else {
                let errorString = "";
                for (let i = 0; i < data.cylinderList.length; i++) {
                  let regularInspectionDate = "";
                  if(util.checkEmpty(data.cylinderList[i].regularInspectionDate)) {
                    regularInspectionDate = data.cylinderList[i].regularInspectionDate.substring(0, 7);
                    regularInspectionDate = regularInspectionDate.substring(0, 5) + that.addZero(parseInt(regularInspectionDate.substring(5, 7)) - 1);
                    if(!util.compareDate(regularInspectionDate)) {
                      errorString += data.cylinderList[i].cylinderNumber + "-" + regularInspectionDate + "\r\n";
                    }
                  } else {
                    regularInspectionDate = "无";
                    errorString += data.cylinderList[i].cylinderNumber + "-" + regularInspectionDate + "\r\n";
                  }
                }
                if (errorString != "") {
                  that.errorModal(data.setNumber + "中的过期气瓶：" + "\r\n" + errorString);
                } else {
                  that.successShowMyToast("集格：" + data.setNumber + " \r\n绑定气瓶数量：" + data.cylinderList.length + " \r\n集格过期日期：" + regularInspectionDate);
                  setList.push(setId);
                  that.setData({
                    setList: setList
                  })
                  that.countData();
                  for (let i = 0; i < data.cylinderList.length; i++) {
                    let cylinderNumber = data.cylinderList[i].cylinderNumber;
                    that.queryCylinderInfoByNumber(setId, cylinderNumber);
                  }
                }
              }
            } else {
              let errorString = "";
              for (let i = 0; i < data.cylinderList.length; i++) {
                let regularInspectionDate = "";
                if(util.checkEmpty(data.cylinderList[i].regularInspectionDate)) {
                  regularInspectionDate = data.cylinderList[i].regularInspectionDate.substring(0, 7);
                  regularInspectionDate = regularInspectionDate.substring(0, 5) + that.addZero(parseInt(regularInspectionDate.substring(5, 7)) - 1);
                  if(!util.compareDate(regularInspectionDate)) {
                    errorString += data.cylinderList[i].cylinderNumber + "-" + regularInspectionDate + "\r\n";
                  }
                } else {
                  regularInspectionDate = "无";
                  errorString += data.cylinderList[i].cylinderNumber + "-" + regularInspectionDate + "\r\n";
                }
              }
              if (errorString != "") {
                that.errorModal(data.setNumber + "中的过期气瓶：" + "\r\n" + errorString);
              } else {
                that.successShowMyToast("集格：" + data.setNumber + " \r\n绑定气瓶数量：" + data.cylinderList.length + " \r\n集格过期日期：尚无记录");
                setList.push(setId);
                that.setData({
                  setList: setList
                })
                that.countData();
                for (let i = 0; i < data.cylinderList.length; i++) {
                  let cylinderNumber = data.cylinderList[i].cylinderNumber;
                  that.queryCylinderInfoByNumber(setId, cylinderNumber);
                }
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
    if (setId == null) {
      let cylinderList = that.data.cylinderList;
      let allCylinderList = that.data.allCylinderList;
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
              let setList = that.data.setList;
              if (setList.includes(res.data.data.setId)) {
                that.errorModal("该集格(" + res.data.data.setNumber + ")已扫描");
              } else {
                that.queryCylinderBySetId(res.data.data.setId);
              }
            } else {
              let cylinderId = res.data.data.id;
              let unitId = res.data.data.unitId;
              let cylinderCode = res.data.data.cylinderCode; // 气瓶码
              let cylinderTypeName = res.data.data.cylinderTypeName; // 气瓶类型名称
              let gasMediumName = res.data.data.gasMediumName; // 气瓶介质名称
              let regularInspectionDate = ""; // 气瓶下检日期
              if(!util.checkEmpty(res.data.data.regularInspectionDate)) {
                regularInspectionDate = "2020-01";
              } else {
                regularInspectionDate = res.data.data.regularInspectionDate.substring(0, 7);
                regularInspectionDate = regularInspectionDate.substring(0, 5) + that.addZero(parseInt(regularInspectionDate.substring(5, 7)) - 1);
              }
              let cylinderScrapDate = res.data.data.cylinderScrapDate.substring(0, 7); // 气瓶过期日期
              let cylinderManufacturingDate = res.data.data.cylinderManufacturingDate.substring(0, 7); // 气瓶生产日期
              let volume = res.data.data.volume; // 气瓶容积
              let nominalTestPressure = res.data.data.nominalTestPressure; // 气瓶压力
              let weight = res.data.data.weight; // 气瓶重量
              let lastFillTime = res.data.data.lastFillTime; // 气瓶最后充装时间
              let lastFillPureness = that.data.purenessArray[res.data.data.lastFillPureness - 1]; // 气瓶最后充装纯度
              let wallThickness = res.data.data.wallThickness; // 气瓶壁厚
              let effect = util.compareDate(regularInspectionDate);
              if(!effect) {
                that.errorModal("气瓶：" + cylinderNumber + "的过期日期为" + regularInspectionDate + "。该气瓶已过期，请先检验再使用！");
              } else {
                cylinderList.push(cylinderNumber);
                allCylinderList.push({ setId, cylinderNumber, cylinderId, unitId, cylinderCode, cylinderTypeName, gasMediumName, regularInspectionDate, cylinderScrapDate, cylinderManufacturingDate, volume, nominalTestPressure, weight, lastFillTime, lastFillPureness, wallThickness });
                that.setData({
                  cylinderList: cylinderList,
                  allCylinderList: allCylinderList
                })
                that.countData();
                that.successShowMyToast("二维码：" + cylinderNumber + " \r\n介质：" + gasMediumName + " \r\n过期日期：" + regularInspectionDate + " \r\n最后充装时间：" + lastFillTime + " \r\n最后充装纯度：" + lastFillPureness)
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
      let setCylinderList = that.data.setCylinderList;
      let allCylinderList = that.data.allCylinderList;
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
            let unitId = res.data.data.unitId;
            let cylinderCode = res.data.data.cylinderCode; // 气瓶码
            let cylinderTypeName = res.data.data.cylinderTypeName; // 气瓶类型名称
            let gasMediumName = res.data.data.gasMediumName; // 气瓶介质名称
            let regularInspectionDate = ""; // 气瓶下检日期
            if(!util.checkEmpty(res.data.data.regularInspectionDate)) {
              regularInspectionDate = "2020-01";
            } else {
              regularInspectionDate = res.data.data.regularInspectionDate.substring(0, 7);
              regularInspectionDate = regularInspectionDate.substring(0, 5) + that.addZero(parseInt(regularInspectionDate.substring(5, 7)) - 1);
            }
            let cylinderScrapDate = res.data.data.cylinderScrapDate.substring(0, 7); // 气瓶过期日期

            let cylinderManufacturingDate = res.data.data.cylinderManufacturingDate.substring(0, 7); // 气瓶生产日期
            let volume = res.data.data.volume; // 气瓶容积
            let nominalTestPressure = res.data.data.nominalTestPressure; // 气瓶压力
            let weight = res.data.data.weight; // 气瓶重量
            let lastFillTime = res.data.data.lastFillTime; // 气瓶最后充装时间
            let lastFillPureness = that.data.purenessArray[res.data.data.lastFillPureness - 1]; // 气瓶最后充装纯度
            let wallThickness = res.data.data.wallThickness; // 气瓶壁厚
            setCylinderList.push({ setId, cylinderNumber, cylinderId, unitId, cylinderCode, cylinderTypeName, gasMediumName, regularInspectionDate, cylinderScrapDate, cylinderManufacturingDate, volume, nominalTestPressure, weight, lastFillTime, wallThickness });
            allCylinderList.push({ setId, cylinderNumber, cylinderId, unitId, cylinderCode, cylinderTypeName, gasMediumName, regularInspectionDate, cylinderScrapDate, cylinderManufacturingDate, volume, nominalTestPressure, weight, lastFillTime, lastFillPureness, wallThickness });
            that.setData({
              setCylinderList: setCylinderList,
              allCylinderList: allCylinderList
            })
            that.countData();
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

  // 计算扫码次数、气瓶、集格、总数数量
  countData: function () {
    var that = this;
    that.setData({
      scan_number: that.data.setList.length + that.data.cylinderList.length,
      scan_bulk: that.data.cylinderList.length,
      scan_set: that.data.setList.length,
      scan_sum: that.data.allCylinderList.length
    })
  },

  // 设置全局变量
  setGlobal: function () {
    var that = this;
    app.globalData.stockCylinderList = that.data.cylinderList;
    app.globalData.stockSetCylinderList = that.data.setCylinderList;
    app.globalData.stockSetList = that.data.setList;
    app.globalData.stockAllCylinderList = that.data.allCylinderList;
  },

  // 清空收发全局变量
  clearData: function () {
    var that = this;
    app.globalData.stockCylinderList = [];
    app.globalData.stockSetCylinderList = [];
    app.globalData.stockSetList = [];
    app.globalData.stockAllCylinderList = [];
    that.setData({
      cylinderList: app.globalData.stockCylinderList,
      setCylinderList: app.globalData.stockSetCylinderList,
      setList: app.globalData.stockSetList,
      allCylinderList: app.globalData.stockAllCylinderList
    })
    that.countData();
  },

  // 提交
  submitForm: function () {
    var that = this;
    var qcmappversion = that.data.qcmappversion;
    wx.showModal({
      title: '确认信息',
      content: "提交前请保证信息无误，确认提交？",
      success(res) {
        if (res.confirm) {
          let allCylinderList = that.data.allCylinderList;
          if (allCylinderList.length > 0) {
            let cylinderIdList = [];
            for (let i = allCylinderList.length - 1; i >= 0; i--) {
              let temp = allCylinderList[i];
              // 拼接气瓶信息
              cylinderIdList.push(temp.cylinderId);
            }
            cylinderIdList = cylinderIdList.join(',');
            that.setData({
              'orderData.cylinderIdList': cylinderIdList
            })
            if ((that.judge(that.data.orderData.employeeId)) && (that.judge(that.data.orderData.shipNumber))) {
              var data = that.data.orderData;
              console.log('data:======' + JSON.stringify(data));
              wx.request({
                url: app.globalData.apiUrl + '/addOutStock',
                method: 'POST',
                data: data,
                header: {
                  'qcmappversion': qcmappversion,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                success: (res) => {
                  if (res.data.msg == "成功") {
                    that.clearData();
                    that.setData({
                      disabled: true,
                      opacity: 0.3
                    })
                    that.successShowToastNoStart("添加成功");
                  } else {
                    that.errorModalNoStart("添加失败,请再次提交");
                  }
                },
                fail: (e) => {
                  that.errorModalNoStart("添加收发接口访问失败,5秒后再次请求");
                  setTimeout(function () {
                    that.submitForm();
                  }, 5000)
                }
              })
            } else {
              that.errorModalNoStart("创建人或运单号不能为空");
              return;
            }
          } else {
            that.errorModalNoStart("您还未录入数据");
          }
        } else if (res.cancel) {
          console.log('删除取消');
        }
      }
    })
  },

  // 判断是否为空或null
  judge: function (x) {
    if ((x == "") || (x == null)) {
      return false;
    } else {
      return true;
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

  // 扫描发货单号
  scanInvoice: function () {
    var that = this;
    wx.scanCode({
      success: (res) => {
        // 此处判断是否为散瓶、集格
        if (res.result.indexOf("/set/code/") == -1) {
          if ((res.result.indexOf("0001") == -1) && (res.result.length != 11)) {
            that.setData({
              'orderData.shipNumber': res.result
            })
          } else {
            that.errorModalNoStart("二维码格式不正确");
          }
        } else {
          that.errorModalNoStart("二维码格式不正确");
        }
      },
      fail: (e) => {
        that.errorModalNoStart("扫描失败");
      }
    })
  },

  // 正常弹窗提示
  successShowToastNoStart: function(successMsg) {
    var that = this;
    wx.showToast({
      title: successMsg,
      icon: 'none',
      duration: that.data.duration,
      mask: true
    })
  },
  
  successShowToast: function(successMsg) {
    var that = this;
    wx.showToast({
      title: successMsg,
      icon: 'none',
      duration: that.data.duration,
      mask: true
    })
    setTimeout(that.start, that.data.duration);
  },

  // 自定义toast
  successShowMyToast: function(successMsg) {
    var that = this;
    that.setData({
      display: 'block'
    })
    that.mtoast.showToast(successMsg, that.data.duration);
    setTimeout(that.start, that.data.duration);
  },

  // 异常弹窗提示
  errorModalNoStart: function(errorMsg, title = "错误提醒", confirmText = "关闭", confirmColor = "#576B95") {
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
          that.start();
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