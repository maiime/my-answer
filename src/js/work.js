const crypto = require('crypto')
const request = require('request')
class Answer{
    constructor(params,callback){
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.callback = callback;
        this.host = 'http://www.maii.me/my/php/action.php';
        this.canvas.width = params.width;
        this.canvas.height = params.height;
        this.line_height = params.line_height;
        this.font_size = 14;
        this.top = 0;       //获取图片文字有效区域上线
        this.bottom = 0;    //获取图片文字有效区域下线
        this.zi = [];
        this.img_data = [];
        this.json = null;
        this.type = 0;
        this.x = 0;         //截取图片区域的x坐标
        this.y = 0;         //截取图片区域的y坐标
        this.width = 0;     //截取图片区域的宽度
        this.height = 0;    //截取图片区域的高度
        this.init();
    }
    // 初始化
    init(){
        var _this = this;
        this.get_json_data();
    }
    // 从服务器拉取字模数据
    get_json_data(){
        request.post("http://www.maii.me/my/data.json",(err,res)=>{
            this.json = JSON.parse(res.body);
        })
    }
    //将有效区域分成若干小块，组成问题
    circle_img_data(){
        var _this = this;
        _this.zi = [];
        function * for_column(){
            for(let i = _this.top;i<_this.bottom;i+=_this.line_height){
                var x = 0;
                while(x<=_this.width-13){
                    yield _this.cube_to_data(x,i).then(res=>{
                        return _this.find_word(res);
                        }).then(res=>{
                            _this.zi.push(res.content);
                            // console.log(res.type);
                            // console.log(res.content);
                            if(res.type == 1){
                                x+=7;
                            }else{
                                x+=14;
                            }
                        })
                }
            }
        }
        var g = for_column();
        run2();
        function run2(){
            var res = g.next();
            if(!res.done){
               res.value.then(res=>{
                   run2();
               })
            }else{
                // _this.callback(_this.zi.join(''));
                var reg = /你的答案不正确，答题时间额外增加了\d+秒，请答另一题:|附加考题，当前第\d+题，还可以答\d+题。|御前科举大赛第\d+关:这一关考的是\S+。题目:|（可登录aq.gm.163.com寻找正确答案）|礼部考题，已答\d+题，答对\d+题。/;
                var str = _this.zi.join('').replace(reg,'');
                _this.get_answer(str).then(res=>{
                    _this.callback(res);
                })
            }
        }

    }
    // 是否是小块如果是则返回小块的数值，如果不是在
    cube_to_data(x,y){
        var _this = this;
        return new Promise((resolve,reject)=>{
            var arr = [];
            for(let i=y;i<y+14;i++){
                for(let j=x;j<x+13;j++){
                    if(_this.type==2){
                        if(_this.img_data[4*j+4*_this.width*i]>200){
                            arr.push(1);
                        }else{
                            arr.push(0);
                        }
                        if(i==y+13&&j==x+12){
                            resolve(arr.join(""));
                        }
                    }else{
                        if(_this.img_data[4*j+4*_this.width*i]<100){
                            arr.push(1);
                        }else{
                            arr.push(0);
                        }
                        if(i==y+13&&j==x+12){
                            resolve(arr.join(""));
                        }
                    }
                        
                }
            }
        })

    }
    // 查找单个汉字
    /**
     * 
     * type 0 宽度为13的正常汉字或符号
     * type 1 宽度为7的符号数字字母
     * type 2 未找到返回宽度为13的 _
     * type 3 该区域为空，返回空字符串
     */
    find_word(str){
        var _this = this;
        return new Promise((resolve,reject)=>{
            if(str*1==0){
                resolve({content:"",type:3});
            }else{
                const md5 = crypto.createHash('md5');
                var encode = md5.update(str).digest("hex");
                var $str = "m_"+encode;
                if(_this.json[$str]){
                    resolve({content:_this.json[$str],type:0});
                }else{
                    var str2 = "";
                    for(let i=0;i<182;i+=13){
                        str2 += str.substr(i,7);
                    }
                    const md5 = crypto.createHash('md5');
                    encode = md5.update(str2).digest("hex");
                    var $str2 = "m_"+encode;
                    if(_this.json[$str2]){
                        resolve({content:_this.json[$str2],type:1});
                    }else{
                        var data = {
                            action: "add_zi",
                            data: str,
                            md5: $str,
                            md5_temp:$str2
                        }
                        request.post({url: _this.host,formData: data},(err,res)=>{
                            resolve({content: "_",type:2});
                        })
                    }
                        
                }
            }
                
        })
    }

    answer(path){
        var _this = this;
        this.load_img(path).then(res=>{
            return _this.draw_img(res);
        }).then(res=>{
            return _this.find_sort();
        }).then(res=>{
            _this.type = res;
            if(res==2){
                // 旧答题框行高为18
                _this.line_height = 18;
            }else{
                _this.line_height = 17;
            }
            return _this.get_img_data(res);
        }).then(res=>{
            return _this.get_img_top_and_bottom();
        }).then(res=>{
            _this.circle_img_data();
        }).catch(err=>{
            console.log(err);
        })
    }
    // 载入图片
    load_img(path){
        var _this =this;
        return new Promise((resolve,reject)=>{
            var img = new Image();
            img.onload = function () {
                resolve(img);
            }
            img.src = path;
        })
    }
    // 画图
    draw_img(img){
        var _this = this;
        return new Promise((resolve,reject)=>{
            _this.ctx.clearRect(0,0,_this.canvas.width,_this.canvas.height);
            _this.ctx.drawImage(img,0,0,_this.canvas.width,_this.canvas.height,0,0,_this.canvas.width,_this.canvas.height);
            resolve();
        })
    }
    /**
     * res 0    科举正常
     * res 1    科举图片
     * res 2    旧版
     * res 3    房都尉
     * res 4    未识别
     */
    // 查找分类
    find_sort(){
        var _this = this;
        return new Promise((resolve,reject)=>{
            // 科举常规
            var data1 = _this.ctx.getImageData(618,57,1,10).data;
            var data2 = _this.ctx.getImageData(610,35,1,10).data;
            var data3 = _this.ctx.getImageData(586,236,1,10).data;
            var data4 = _this.ctx.getImageData(581,75,1,10).data;
            if(_this.two_value(data1)=='1110000111'){
                resolve(0);
            }else if(_this.two_value(data2)=='1110000111'){
                resolve(1);
            }else if(_this.two_value(data3)=='1110000111'){
                resolve(2);
            }else if(_this.two_value(data4)=='1110000111'){
                resolve(3);
            }else{
                reject("未识别");
            }
        })
    }
    // 取反 ^运算符 待优化
    two_value(arr){
        if(!arr.length){return;}
        var value = [];
        for(let i=0;i<arr.length;i+=4){
            if(arr[i+2]>100){
                value.push(1);
            }else{
                value.push(0);
            }
            if(i==arr.length-4){
                return value.join('');
            }
        }
    }
    // 获取图片信息
    get_img_data(type){
        var _this = this;
        console.log("type:"+type);
        switch(type){
            case 0:
                _this.x = 224;
                _this.y = 110;
                _this.width = 378;
                _this.height = 90;
                break;
            case 1:
                _this.x = 290;
                _this.y = 110;
                _this.width = 310;
                _this.height = 100;
                break;
            case 2:
                _this.x = 71;
                _this.y = 244;
                _this.width = 505;
                _this.height = 32;
                break;
            case 3:
                _this.x = 82;
                _this.y = 144;
                _this.width = 475;
                _this.height = 40;
                break;
        }    
        return new Promise((resolve,reject)=>{
            _this.img_data = this.ctx.getImageData(_this.x,_this.y,_this.width,_this.height).data;
            resolve(_this.img_data);
        })       
    }
    // 获取文字区域的顶部和底部
    get_img_top_and_bottom(){
        var _this = this;
        return new Promise((resolve,reject)=>{
            if(!_this.img_data.length){return;}
            var find_top = true;
            if(_this.type==2){
                for(let i=0;i<_this.img_data.length;i+=4){
                    // 取一个阈值
                    if(i == _this.img_data.length - 4){
                        console.log(_this.top);
                        console.log(_this.bottom);
                        resolve();
                    }
                    if(_this.img_data[i+1]<200){continue;}
                    if(find_top){
                        find_top = false;
                        _this.top = parseInt(i/_this.width/4);
                    }else{
                        _this.bottom = parseInt(i/_this.width/4)+1;
                    }
                }
            }else{
                for(let i=0;i<_this.img_data.length;i+=4){
                    // 取一个阈值
                    if(i == _this.img_data.length - 4){
                        console.log(_this.top);
                        console.log(_this.bottom);
                        resolve();
                    }
                    if(_this.img_data[i]>100){continue;}
                    if(find_top){
                        find_top = false;
                        _this.top = parseInt(i/_this.width/4);
                    }else{
                        _this.bottom = parseInt(i/_this.width/4)+1;
                    }
                }
            }
                
        })
    }
    // 获取答案
    get_answer(str){
        var _this = this;
        return new Promise((resolve,reject)=>{
            const md5 = crypto.createHash('md5');
            var encode = md5.update(str).digest("hex");
            var md5_q = "q_"+encode;
            var data = {
                action: "get_answer",
                md5: md5_q,
                question: str
            }
            request.post({url: _this.host,formData: data},(err,res)=>{
                resolve(JSON.parse(res.body));
            })
        })   
    }

}

module.exports = Answer;