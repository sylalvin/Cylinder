const formatTime = (template, date) => {
  var specs = 'YYYY:MM:DD:HH:mm:ss'.split(':');
  
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().split(/[-:.TZ]/).reduce(function (template, item, i)   {
    return template.split(specs[i]).join(item);
  }, template);
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}
//参数data转formData
function json2Form(json) {
  var str = [];
  for (var p in json) {
    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(json[p]));
  }
  return str.join("&");
} 
function getObjectKeys(object) {
  var keys = [];
  for (var property in object)
    keys.push(property);
  return keys;
}
//将指定的元素放到第一位
function putElementToFirst(arr, key) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] === key) {
      arr.splice(i, 1);
      break;
    }
  }
  arr.unshift(key);
  return arr;
}
//计算两个时间差,返回相差的毫秒数
function diff(begin, end = new Date()) {
  var bTime = new Date(begin.replace(/-/g, "/")).getTime();
  var eTime = new Date(end).getTime();
  var times = eTime - bTime;
  return times;
}

function checkLogin() {
  var id = wx.getStorageSync("pj_employee_id");
  if((id == "") || (id == null) || (id == undefined)) {
    return false;
  } else {
    return true;
  }
}

// 判断为空
function checkEmpty(s) {
  if((s === null) || (s === 0) || (s === "") || (s === false) || (s === undefined)) {
    return false;
  }
  return true;
}

// 计算月份天数 date:2020-04
function getDaysOfMonth(date) {
  let bigMonth = ["01", "03", "05", "07", "08", "10", "12"];
  let middleMonth = ["04", "06", "09", "11"];
  let smallMonth = ["02"];
  let year = date.split('-')[0];
  let month = date.split('-')[1];
  let days = 0;
  if (bigMonth.indexOf(month) > -1) {
    days = 31;
  } else if (middleMonth.indexOf(month) > -1) {
    days = 30;
  } else if (smallMonth.indexOf(month) > -1) {
    if (((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0)) {
      days = 29;
    } else {
      days = 28;
    }
  }
  return days;
}

// 返回日期2020-04
function compareDate(date) {
  let fyear = date.split('-')[0];
  let fmonth = date.split('-')[1];
  let fdate = parseInt(fyear + fmonth);
  let stime = new Date();
  let syear = stime.getFullYear();
  let smonth = stime.getMonth() + 1;
  smonth = formatNumber(smonth);
  let sdate = parseInt(String(syear) + String(smonth));
  if(sdate > fdate) {
    return false;
  } else {
    return true;
  }
}

module.exports = {
  formatTime: formatTime,
  json2Form: json2Form,
  getObjectKeys: getObjectKeys,
  putElementToFirst: putElementToFirst,
  diff: diff,
  checkLogin: checkLogin,
  getDaysOfMonth: getDaysOfMonth,
  checkEmpty: checkEmpty,
  compareDate: compareDate
}
