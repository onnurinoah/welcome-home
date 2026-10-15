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
function doGet(e){
  try{
    if(e && e.parameter && e.parameter.mode === 'blueprint') return json_(blueprintState_());
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
    if((body.action||'add')==='blueprintAdd') return json_(addBlueprintName_(body));
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

/* WELCOME HOME blueprint reveal — separate feature; prayer endpoints above remain intact. */
var BLUEPRINT_SHEET='blueprint_names';
var BLUEPRINT_TARGET=10;
var BLUEPRINT_DELAY_MS=20000;
var BLUEPRINT_STATE_KEY='welcome.blueprint.state.v1';

function blueprintSheet_(){
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var sh=ss.getSheetByName(BLUEPRINT_SHEET);
  if(!sh){sh=ss.insertSheet(BLUEPRINT_SHEET);sh.appendRow(['id','ts','name']);sh.setFrozenRows(1);}
  return sh;
}
function blueprintState_(){
  var props=PropertiesService.getScriptProperties();
  var raw=props.getProperty(BLUEPRINT_STATE_KEY);
  var state=raw?JSON.parse(raw):{openAt:null,isOpen:false};
  var sh=blueprintSheet_(), last=sh.getLastRow(), names=[];
  if(last>=2){
    var rows=sh.getRange(2,1,last-1,3).getDisplayValues();
    names=rows.map(function(r){return {id:r[0],name:r[2]};}).filter(function(r){return r.name;});
  }
  if(!state.isOpen && state.openAt && Date.now()>=Number(state.openAt)){
    state.isOpen=true;
    props.setProperty(BLUEPRINT_STATE_KEY,JSON.stringify(state));
  }
  return {ok:true,names:names,target:BLUEPRINT_TARGET,openAt:state.openAt?Number(state.openAt):null,isOpen:!!state.isOpen,serverNow:Date.now()};
}
function addBlueprintName_(body){
  var name=String(body.name||'').trim().replace(/[<>]/g,'').slice(0,30);
  var id=String(body.requestId||'').trim().slice(0,80);
  if(!name) return {ok:false,error:'이름을 입력해주세요.'};
  if(!id) return {ok:false,error:'요청을 확인할 수 없습니다. 다시 시도해주세요.'};
  var props=PropertiesService.getScriptProperties();
  var stateKey=BLUEPRINT_STATE_KEY;
  var state=JSON.parse(props.getProperty(stateKey)||'{"openAt":null,"isOpen":false}');
  var sh=blueprintSheet_(), last=sh.getLastRow();
  if(last>=2){
    var ids=sh.getRange(2,1,last-1,1).getDisplayValues().map(function(r){return r[0];});
    if(ids.indexOf(id)!==-1) return blueprintState_();
  }
  if(state.isOpen || (state.openAt && Date.now()>=Number(state.openAt))){
    state.isOpen=true;props.setProperty(stateKey,JSON.stringify(state));
    return {ok:false,error:'청사진이 이미 펼쳐졌습니다.',state:blueprintState_()};
  }
  sh.appendRow([id,new Date(),name]);
  var count=sh.getLastRow()-1;
  if(count>=BLUEPRINT_TARGET && !state.openAt){
    state.openAt=Date.now()+BLUEPRINT_DELAY_MS;
    props.setProperty(stateKey,JSON.stringify(state));
  }
  return blueprintState_();
}
