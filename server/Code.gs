/** Welcome HOME — prayer accumulation backend */
var SHEET_NAME='prayers';
var MAX_ROWS=20000;
var MAX_TEXT=500;
var MAX_NAME=30;
var MAX_MINUTES=180;
var TOTAL_KEY='prayer.totalMinutes.v2';
var COUNT_KEY='prayer.count.v2';

function sheet_(){
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var sh=ss.getSheetByName(SHEET_NAME);
  if(!sh){
    sh=ss.insertSheet(SHEET_NAME);
    sh.appendRow(['ts','minutes','topic','name']);
    sh.setFrozenRows(1);
  }
  return sh;
}
function json_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
function stats_(){
  var props=PropertiesService.getScriptProperties();
  var cachedM=props.getProperty(TOTAL_KEY);
  var cachedC=props.getProperty(COUNT_KEY);
  if(cachedM!==null && cachedC!==null){
    return {minutes:Number(cachedM)||0,count:Number(cachedC)||0};
  }
  var sh=sheet_(), last=sh.getLastRow(), minutes=0,count=0;
  if(last>=2){
    var vals=sh.getRange(2,1,last-1,2).getValues();
    count=vals.length;
    for(var i=0;i<vals.length;i++) minutes+=Number(vals[i][1])||0;
  }
  minutes=Math.round(minutes);
  props.setProperty(TOTAL_KEY,String(minutes));
  props.setProperty(COUNT_KEY,String(count));
  return {minutes:minutes,count:count};
}
function addStats_(minutes){
  var props=PropertiesService.getScriptProperties();
  var s=stats_();
  s.minutes=Math.round(s.minutes+Number(minutes));
  s.count=s.count+1;
  props.setProperty(TOTAL_KEY,String(s.minutes));
  props.setProperty(COUNT_KEY,String(s.count));
  return s;
}
function doGet(){
  try{
    var s=stats_();
    return json_({ok:true,minutes:s.minutes,count:s.count});
  }catch(err){return json_({ok:false,error:String(err)});}
}
function doPost(e){
  var lock=LockService.getScriptLock();
  try{
    lock.waitLock(10000);
    var body={};
    if(e&&e.postData&&e.postData.contents) body=JSON.parse(e.postData.contents);
    if((body.action||'add')!=='add') return json_({ok:false,error:'알 수 없는 요청입니다.'});

    var name=String(body.name||'').trim().slice(0,MAX_NAME);
    var topic=String(body.topic||'').trim().slice(0,MAX_TEXT);
    var minutes=Math.round(Number(body.minutes));

    if(!name) return json_({ok:false,error:'이름을 입력해주세요.'});
    if(!(minutes>0) || minutes>MAX_MINUTES) return json_({ok:false,error:'기도 시간이 올바르지 않습니다.'});

    var sh=sheet_();
    if(sh.getLastRow()>MAX_ROWS) return json_({ok:false,error:'접수가 가득 찼습니다.'});

    sh.appendRow([new Date(),minutes,topic,name]);
    var s=addStats_(minutes);
    return json_({ok:true,minutes:s.minutes,count:s.count});
  }catch(err){return json_({ok:false,error:String(err)});}
  finally{try{lock.releaseLock();}catch(ignore){}}
}