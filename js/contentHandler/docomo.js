/* ***** BEGIN LICENSE BLOCK Version: GPL 3.0 ***** 
 * FireMobileFimulator is a Chrome Extension that simulate web browsers of 
 * japanese mobile phones.
 * Copyright (C) 2012  Takahiro Horikawa <horikawa.takahiro@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * ***** END LICENSE BLOCK ***** */

var firemobilesimulator;
if (!firemobilesimulator)
  firemobilesimulator = {};
if (!firemobilesimulator.contentHandler)
  firemobilesimulator.contentHandler = {};

firemobilesimulator.contentHandler.docomo = {

  filter : function (ndDocument, deviceInfo) {
    var deviceId = deviceInfo.id;
    //
    var mpc = firemobilesimulator.mpc.factory("DC");
    var imagePath = chrome.extension.getURL("/emoji");
    mpc.setImagePath(imagePath);
    var parser = new fms.contentHandler.parser(ndDocument, mpc);
    parser.parse(ndDocument);
    //

    firemobilesimulator.contentHandler.common.filter(ndDocument, deviceInfo);    
    var setUtnFunction = function(e) {
      console.log("[msim]click utn");
      if (true == confirm(chrome.i18n.getMessage("utn_confirmation"))) {
        chrome.extension.sendRequest({name: "setUtnFlag", value: true}, function () {
          // FIXME: don't wait for response
        });
      }
      return true;
    };
  
    var setLcsFunction = function(e) {
      console.log("[msim]click lcs");
      if (true == confirm(chrome.i18n.getMessage("lcs_confirmation"))) {
        chrome.extension.sendRequest({name: "setLcsFlag", value: true}, function () {
          // FIXME: don't wait for response
        });
        return true;
      } else {
        return false;
      }
    };
  
    chrome.extension.sendRequest({name: "setUtnFlag", value: false}, function () {
      // FIXME: don't wait for response
    });
    chrome.extension.sendRequest({name: "setLcsFlag", value: false}, function () {
      // FIXME: don't wait for response
    });
  
    var anchorTags = ndDocument.getElementsByTagName("a");
    for (var i = 0; i < anchorTags.length; i++) {
      var anchorTag = anchorTags[i];
      var utn = anchorTag.getAttribute("utn");
      if (null != utn) {
        anchorTag.addEventListener("click", setUtnFunction, false);
      }
  
      var lcs = anchorTag.getAttribute("lcs");
      if (null != lcs) {
        console.log("setlcs for a tag");
        anchorTag.addEventListener("click", setLcsFunction, false);
      }
    }
  
    // accesskey対応
    ndDocument.addEventListener("keypress", firemobilesimulator.contentHandler.common.createAccessKeyFunction(["accesskey"]), false);
  
    // formのUTN送信
    // uid=NULLGWDOCOMOのPOST送信
    // オープンiエリアの場合のメソッドを強制的にGETに書き換え
    // ##本当はhttp-on-modify-requestで書き換えたい##
    var formTags = ndDocument.getElementsByTagName("form");
    for (var i = 0; i < formTags.length; i++) {
      var formTag = formTags[i];
  
      // UTNセット
      var utn = formTag.getAttribute("utn");
      if (null != utn) {
        formTag.addEventListener("submit", setUtnFunction, false);
      }
  
      var lcs = formTag.getAttribute("lcs");
      if (null != lcs) {
        console.log("setlcs for form tag");
        formTag.addEventListener("submit", setLcsFunction, false);
      }
  
      // オープンiエリアの場合のメソッドを強制的にGETに書き換え
      var action = formTag.getAttribute("action");
      if (action && action == "http://w1m.docomo.ne.jp/cp/iarea") {
        formTag.setAttribute("method", "GET");
      }
  
      // uid=NULLGWDOCOMOのPOST送信
      var method = formTag.getAttribute("method");
      if (method && method.toUpperCase() == "POST") {
        var inputTags = formTag.getElementsByTagName("input");
        for (var j = 0; j < inputTags.length; j++) {
          var inputTag = inputTags[j];
          var key = inputTag.getAttribute("name");
          var value = inputTag.value;
          if (key && value && key.toUpperCase() == "UID"
              && value.toUpperCase() == "NULLGWDOCOMO") {
            console.log("replace uid");
            inputTag.value = deviceInfo.uid;
          }
        }
      }
    }
  }
};
