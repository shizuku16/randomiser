function dataGet(){
    const setList=window.sessionStorage.getItem("setList");
    if(setList){
        const list=document.getElementById("target");
        list.insertAdjacentHTML("beforeend",`<option>${JSON.parse(setList).join("</option><option>")}</option>`)
    }
    else{
        document.getElementById("randomButton").disabled=true;
        document.getElementById("output").disabled=true;
        fetch(`https://script.google.com/macros/s/AKfycbyqw2uIQjLlPkoBe0TmEQPdQdQWsLKsvFMbbsUlizxmhueQjalE0me3m2LGC5gSvykI2Q/exec`)
        .then(res=>res.json())
        .then(data=>{
            const list=document.getElementById("target")
            list.insertAdjacentHTML("beforeend",`<option>${data.join("</option><option>")}</option>`)
            window.sessionStorage.setItem("setList",JSON.stringify(data))
            document.getElementById("randomButton").disabled=false;
            document.getElementById("output").disabled=false;
        })
    }
}

async function cardGet(e){
    if(e.value=="") return
    e.disabled=true;
    
    //テーブル削除
    const field=document.getElementById("cardTable");
    while(field.firstChild ){
        field.removeChild( field.firstChild );
    }
    let data
    document.getElementById("randomButton").disabled=true;
    document.getElementById("output").disabled=true;
    if(window.sessionStorage.getItem(e.value)) data=JSON.parse(window.sessionStorage.getItem(e.value));
    else await fetch(`https://script.google.com/macros/s/AKfycbyqw2uIQjLlPkoBe0TmEQPdQdQWsLKsvFMbbsUlizxmhueQjalE0me3m2LGC5gSvykI2Q/exec`,{
        "method":"post",
        "Content-Type": "application/json",
        "body":JSON.stringify({"sheet":e.value}),
    })
    .then(res=>res.json())
    .then(json=>{
        data=json;
        window.sessionStorage.setItem(e.value,JSON.stringify(json));
    })
    const key=Object.keys(data);
    let string=``;
    let i=0;
    let maxNum=0;
    const table=document.getElementById("cardTable");
    //各拡張のループ
    key.forEach(element => {
        string+=`<details><summary class="title"><input type="checkbox" id="${element}" onclick="check(this)" checked><label for="${element}">${element}</label>　<span class="inputNum"><input class="num" type="number" id="${element}Num" min="0" max="${data[element].length}">枚選択</span    ></summary><div class="list"><table>`;
        //カードごとのループ
        data[element].forEach((item,index)=>{
            string+=`<tr><td id="${element+index}cell"><input type="checkbox" id="${element+index}" checked><label for="${element+index}" class="card">${item}`;
            const  fileexist = load(`./img/${element}/${item}.png`);
            if(fileexist == 200) string+=`<br><img src="./img/${element}/${item}.png">`;
            string+=`</label></td></tr>`;
        })
        string+=`</table></div></details>`;
        maxNum+=data[element].length;
    });
    table.insertAdjacentHTML("beforeend",string);
    document.getElementById("num").max=maxNum;
    WholeChoice(document.getElementById("isWholeChoice"));
    e.disabled=false;
    document.getElementById("randomButton").disabled=false;
    document.getElementById("output").disabled=false;
}

//画像の有無確認する関数
function load(url){
    var xhr;
    xhr = new XMLHttpRequest();
    xhr.open("HEAD", url, false);  //同期モード
    xhr.send(null);
    return xhr.status;
}

function check(box){
    const id=box.id;
    let i=0
    while(document.getElementById(id+i)!=null){
        document.getElementById(id+i).checked=box.checked;
        i++
    }
}

function imgDisplay(e){
    if(e.checked) Array.from(document.querySelectorAll(`img`)).map(item=>item.style.display="none");
    else Array.from(document.querySelectorAll(`img`)).map(item=>item.style.display="inline");
}

function WholeChoice(e){
    if(e.checked) Array.from(document.querySelectorAll(`.inputNum`)).map(item=>item.style.display="none")
    else Array.from(document.querySelectorAll(`.inputNum`)).map(item=>item.style.display="inline")
}

function randomise(){
    const resultArea=document.getElementById("result");
    resultArea.hidden=false;
    let num=[];
    const result={}
    if(document.getElementById("isWholeChoice").checked){
    //全体からランダムに選ぶ場合
        const max=document.getElementById("num").max;
        const choice=document.getElementById("num").value;
        const list=Array.from(document.querySelectorAll(".card"));
        random(choice,max).map(num=>{
            let card=list[num].innerHTML.replace(/<br>.*/,"");
            let pack=list[num].htmlFor.replace(/\d+/g,"");
            if(result[pack]==undefined) result[pack]=[card];
            else result[pack].push(card)
        })
    }else{
    //各パックごとに指定枚数枚選ぶ場合
        Array.from(document.querySelectorAll(".title")).map(item=>{
            let pack=item.innerText.replace("枚選択","").trim();
            const sup=document.getElementById(`${pack}Num`).max;
            let kouho=[];
            //チェックが付いているカードのみをピック
            for(let i=0;i<sup;i++){
                if(document.getElementById(pack+i).checked) 
                    kouho.push(document.getElementById(`${pack+i}cell`).innerHTML.replace(/<.*?>/g,""));
            }
            let resultNum=random(document.getElementById(`${pack}Num`).value,kouho.length);
            result[pack]=resultNum.map(e=>kouho[e])
        })
    }
    //選ばれたカードを表示する
    let string=``;
    Object.keys(result).map(e=>{
        string+=`<div class="resultArea"><span class="bold">${e}</span><br>`;
        result[e].map(item=>string+=`<span class="resultCard" id="card${e}区切り${item}">・${item}</span><br>`);
        string+=`</div>`
    })
    const area=document.getElementById("result");
    while(area.firstChild ){
        area.removeChild( area.firstChild );
    }
    document.getElementById("output").hidden=false;
    document.getElementById("output").setAttribute("onclick",`copy(${JSON.stringify(result)})`);
    area.insertAdjacentHTML("beforeend",string);
    touchActionAdd();
}

function random(count,max){
    const set = new Set();
    while (set.size < count) set.add(Math.floor(Math.random() * max));
    return Array.from(set).sort((a,b)=>a-b);
}

//以下出力用処理
function copy(data){
    let string=""
    Object.keys(data).map(pack=>{
        string+=`${pack}\n`;
        data[pack].map(card=>string+=`・${card}\n`)
        string+=`\n`
    })
    document.getElementById("textarea").value=string;
    copyToClipboard(document.getElementById("textarea").value)
}

function copyToClipboard (tagValue) {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(tagValue).then(function () {
        alert("カード情報がコピーされました。")
      })
    } else {
      tagText.select()
      document.execCommand('copy')
      alert("カード情報がコピーされました。")
    }
}


//カード長押し時の処理を追加させる
function touchActionAdd(){
    const check_sec = 300; //ミリ秒
    const target_elements = document.querySelectorAll(".resultCard");

    long_press(target_elements, normal_func, long_func, check_sec);

    function normal_func(){
        console.log("tap");
    }
    function long_func(e){
        let card=e.innerText.replace("・","");
        let pack=e.id.replace(/card(.*?)区切り.*/,"$1");
        const  fileexist = load(`./img/${pack}/${card}.png`);
        if(fileexist == 200){
            const img=document.getElementById("preview");
            img.src=`./img/${pack}/${card}.png`;
            img.hidden=false
        }

    }

    document.getElementById("body").addEventListener(`mouseup`,()=>{
        document.getElementById("preview").hidden=true;
    })
    document.getElementById("body").addEventListener(`touchend`,()=>{
                document.getElementById("preview").hidden=true;
            })

    function long_press(els,nf,lf,sec){
        for(let i=0;i<els.length;i++){
            let el=els[i];
            let longclick = false;
            let longtap = false;
            let touch = false;
            let timer;
            el.addEventListener('touchstart',()=>{
            touch = true;
            longtap = false;
            timer = setTimeout(() => {
                longtap = true;
                lf(el);
            }, sec);
            })
            el.addEventListener('touchend',()=>{
                document.getElementById("preview").hidden=true;
            if(!longtap){
                clearTimeout(timer);
                nf();
            }else{
                touch = false;
            }
            })
            
            el.addEventListener('mousedown',()=>{
            if(touch) return;
            longclick = false;
            timer = setTimeout(() => {
                longclick = true;
                lf(el);
            }, sec);
            })
            el.addEventListener('click',()=>{
            if(touch){
                touch = false;
                return;
            }
            if(!longclick){
                clearTimeout(timer);
                nf();
            }
            });
        }    
    }
}