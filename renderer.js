const electron = require('electron');
const crypto = require('crypto');
const request = require('request')
const {dialog} = electron.remote;
const ipcRenderer = electron.ipcRenderer;

var Answer = require(__dirname + '/src/js/work.js');

// fetch("http://localhost/my/data2.json").then(res=>{
//     return res.json().then(json=>{
//         aabb(json);
//     })
// })
// function do_word (obj) {
//     return new Promise((resolve,reject)=>{
//         var question = obj.question;
//         var reg = /[^\u4e00-\u9fa5\d]/g;
//         var str = question.replace(reg,"");
//         const md5 = crypto.createHash('md5');
//         var encode = md5.update(str).digest("hex");
//         var data = {
//             "action":"lu_ti",
//             "md5": "q_"+encode,
//             "question":str,
//             "answer":obj.answer
//         }
//         request.post({url:"http://localhost/my/php/action.php",formData: data},(err,res)=>{
//             resolve(res.body);
//         })
//     })
    
// }
// function aabb (json){
//     function * circle_data2 (){
//         for(let i = 0;i<json.length;i++){
//             yield do_word(json[i]).then(res=>{
//                 if(res==1){
//                     console.log("第"+i+"题录入成功(S)!");
//                 }else{
//                     console.log("第"+i+"题录入失败(E)!");
//                 }
//             });
//         }
//     }
//     var g = circle_data2();
//     run();
//     function run (){
//         var res = g.next();
//         if(!res.done){
//             res.value.then(res=>{
//                 run();
//             })
//         }else{
//             console.log("over!!!");
//         }
//     }
// }


/**
 * 实例化答题器并设置一个callback
 */
var answer = new Answer({width:640,height:500,line_height:17},(res)=>{
    if(res.answer){
        $(".answer").html(res.answer);
    }else{
        $(".answer").html('答案未录入！');
    }
});

/**
 * 监听拿到的最新的图片并回答图片内的问题
 */
ipcRenderer.on('got_latest_img',(e,path)=>{
    setTimeout(()=>{
        answer.run(path);
    },500);
    
})

/**
 * 监听主进程发送的close_setting事件
 */
ipcRenderer.on('close_setting',(e,msg)=>{
    $('.setting').hide();
})

$(".btn").click(()=>{
    ipcRenderer.send('set_path');
})
$('.main_close').click(()=>{
    ipcRenderer.send('quit');
})
