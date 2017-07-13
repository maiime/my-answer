const fs = require("fs")
const electron = require('electron')
const crypto = require('crypto')
const dialog = electron.dialog
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
const easy_key = electron.globalShortcut
const ipcMain = electron.ipcMain
const path = require('path')
const url = require('url')

var chokidar = require('chokidar');       //文件夹监听

let mainWindow,childWindow
var img_file_path,watcher
function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 400,
    height: 165,
    frame:false,
    resizable:false,
    transparent:true
  } )
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
  // 设置路径
  init();
  // set_easy_key("Alt+1");
  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', createWindow)

function init(){
  read_config_and_set_path(__dirname + '/config/config.json').then(res=>{
    return backup_dir(res);
  }).then(res=>{
    return create_dir(res);
  }).then(res=>{
    true_path(res,res=>{
      watch_created_file(res);
    })   
  });
}

// 读取路径并设置路径
function read_config_and_set_path(config_path) {
  return new Promise((resolve,reject)=>{
    fs.readFile(config_path,'utf-8',(err,data)=>{
      resolve(JSON.parse(data).path);
    })
  })
}
// 备份文件夹及其下面的文件
function backup_dir(path){
  return new Promise((resolve,reject)=>{
    var time = new Date();
    var year = b0(time.getFullYear());
    var month = b0(time.getMonth()+1);
    var day = b0(time.getDate());
    var hour = b0(time.getHours());
    var min = b0(time.getMinutes());
    var sec = b0(time.getSeconds());
    var new_path = path + "_" +year+month+day+hour+min+sec;
    fs.rename(path,new_path,(err)=>{
      if(err){reject(err)};
      resolve(path);
    })
  })
}
function create_dir(path){
  return new Promise((resolve,reject)=>{
    fs.mkdir(path,(err)=>{
      if(err){reject(err)};
      resolve(path);
    })
  })
}
function is_dir(path){
    return new Promise((resolve,reject)=>{
        fs.readdir(path,err=>{
            if(err == null){
                resolve(path);
            }else{
                reject(err);
            };
        })
    })
}
function true_path(str,callback,index){
    var x = index||1;
    var path = str.replace("Program Files (x86)",'Progra~'+x);
    is_dir(path).then(res=>{
        if(callback){callback(res);}
    }).catch(res=>{
        x ++ ;
        true_path(str,callback,x);
    })
}
function b0(num){
  return num>9?num:'0'+num;
}
// 监听新添加的图片，并想renderer发送路径
function watch_created_file(path){
  chokidar.watch(path, {
      ignored: /(^|[\/\\])\../,
      persistent: true
    }).on('add',path=>{
      mainWindow.webContents.send('got_latest_img',path);
      console.log(path);
    });
}
// 设置并写入路径
ipcMain.on("set_path",(event,msg)=>{
  var select_path = dialog.showOpenDialog({properties: ['openDirectory']});
  console.log(select_path)
  if(select_path == undefined){return;};
  var path = {path:select_path[0]};
  var json = JSON.stringify(path);
  fs.writeFile(__dirname + '/config/config.json',json,(err)=>{
    if(!err){
      init();
      mainWindow.webContents.send('close_setting');
    }else{
      console.log(err);
    }
  })
})
// 退出
ipcMain.on("quit",(error,msg)=>{
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

