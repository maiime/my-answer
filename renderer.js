const electron = require('electron');
const {dialog} = electron.remote;
const ipcRenderer = electron.ipcRenderer;

var Answer = require(__dirname + '/src/js/work.js');
// 实例化题库并设置callback
var answer = new Answer({width:640,height:500,line_height:17},(res)=>{
    // $(".answer").html(res);
    
    if(res.answer){
        $(".answer").html(res.answer);
    }else{
        $(".answer").html('答案未录入！');
    }
});
ipcRenderer.on('got_latest_img',(e,msg)=>{
    // $("#img").attr('src',msg);
    setTimeout(()=>{
        answer.answer(msg);
    },500);
    
})
ipcRenderer.on('close_setting',(e,msg)=>{
    $('.setting').hide();
})
$(".btn").click(()=>{
    ipcRenderer.send('set_path');
})
$('.main_close').click(()=>{
    ipcRenderer.send('quit');
})
