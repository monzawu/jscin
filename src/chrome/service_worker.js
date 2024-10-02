/*
chrome.runtime.onConnect.addListener((port) => {
  console.log("SW: onConnect ", port);
  port.onMessage.addListener(msg => {
    console.log("SW: onMessage ", msg);
    
  });
  
});
*/
console.log("SW: enter");

//importScripts('jscin/jscin.js', 'jscin.ext/external.js', 'croscin.js', 'jscin/cin_parser.js', 'jscin/gen_inp.js', 'jscin/gen_inp2.js');
importScripts('jscin/lz-string.js','jscin/jscin.js' ,'jscin/base_inp.js' ,'jscin/gen_inp.js' ,'jscin/gen_inp2.js' ,'jscin/crext_inp.js' ,'jscin/cin_parser.js' ,'jscin/base_addon.js' ,'jscin/addon_related.js' ,'jscin/addon_punctuations.js' ,'jscin.ext/external.js' ,'input_api/ipc.js' ,'input_api/ime_event.js' ,'input_api/impl_chromeext.js' ,'input_api/chrome_input_ime.js' ,'croscin.js');
//importScripts('jscin/lz-string.js','jscin/jscin.js' ,'jscin/base_inp.js' ,'jscin/gen_inp.js' ,'jscin/gen_inp2.js' ,'jscin/crext_inp.js' ,'jscin/cin_parser.js' ,'jscin/base_addon.js' ,'jscin/addon_related.js' ,'jscin/addon_punctuations.js' ,'jscin.ext/external.js' ,'input_api/ipc.js' ,'input_api/ime_event.js' ,'input_api/impl_chromeext.js' ,'input_api/chrome_input_ime.js' ,'croscin.js' ,'oauth/chrome_ex_oauthsimple.js' ,'oauth/chrome_ex_oauth.js' ,'oauth/oauth.js');
//import 'jscin/lz-string.js';
//import './jscin/jscin.js';
//import 'croscin.js';
croscin.instance = new croscin.IME;


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    switch (request.action) {
        case "getServiceWorkerData":
            sendResponse({pref: croscin.instance.pref, metadatas: jscin.getTableMetadatas()});
            break;
        case "setEnabledList":
            let new_list = request.data;
            croscin.instance.prefSetEnabledList(new_list);
            break;
        case "notifyConfigChanged":
            croscin.instance.notifyConfigChanged();
            croscin.instance.ActivateInputMethod(croscin.instance.pref.im_default);
    }
    return true;
  }
);
