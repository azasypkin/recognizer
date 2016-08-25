function addSample(e){var t=sampleIds[currentSampleIndex++],r=document.createElement("div");r.classList="sample__container",r.id=t;var o=document.createElement("img");o.classList="sample__preview",o.src=window.URL.createObjectURL(e);var n=document.createElement("button");n.type="button",n.textContent="Recognize",n.classList="sample__recognize-button",n.dataset.sampleId=t,n.dataset.isRecognize=!0;var i=document.createElement("button");i.type="button",i.textContent="Repeat text",i.classList="sample__repeat-button",i.dataset.sampleId=t,r.appendChild(o),r.appendChild(n),r.appendChild(i),samplesListComponent.appendChild(r),samples.set(t,{id:t,image:e,text:null}),setTimeout(function(){r.scrollIntoView()},1e3)}function addSampleFromURL(e){return fetch(e).catch(function(t){console.warn("Can not load image directly, trying through the proxy: ",t);var r=`https://recognizer-ocr-proxy.herokuapp.com/?${e}`,o=new Headers;return o.append("Target-URL",e),fetch(r,{headers:o})}).then(function(e){return e.blob()}).then(function(e){addSample(e)}).catch(function(e){console.error("Failed to add sample from URL: ",e),alert("Failed to add sample! See log for more details...")})}var classCallCheck=function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")},createClass=function(){function e(e,t){for(var r=0;r<t.length;r++){var o=t[r];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}return function(t,r,o){return r&&e(t.prototype,r),o&&e(t,o),t}}(),p=Object.freeze({promise:Symbol("promise"),resolve:Symbol("resolve"),reject:Symbol("reject")}),Defer=function(){function e(){var t=this;classCallCheck(this,e),this[p.promise]=new Promise(function(e,r){t[p.resolve]=e,t[p.reject]=r}),Object.freeze(this)}return e.prototype.resolve=function(e){this[p.resolve](e)},e.prototype.reject=function(e){this[p.reject](e)},createClass(e,[{key:"promise",get:function(){return this[p.promise]}}]),e}(),p$1=Object.freeze({getUserMediaOld:Symbol("getUserMediaOld")}),VideoManager=function(){function e(){classCallCheck(this,e)}return e.prototype.getMediaStream=function(){var e=arguments.length<=0||void 0===arguments[0]||arguments[0],t=!(arguments.length<=1||void 0===arguments[1])&&arguments[1];return void 0===navigator.mediaDevices&&(navigator.mediaDevices={}),void 0===navigator.mediaDevices.getUserMedia&&(navigator.mediaDevices.getUserMedia=this[p$1.getUserMediaOld]),navigator.mediaDevices.getUserMedia({audio:t,video:e}).then(function(e){return console.log("[VideoManager]: Media stream is available."),e}).catch(function(e){throw console.error("[VideoManager]: Media stream is not available.",e),e})},e.prototype[p$1.getUserMediaOld]=function(e){var t=navigator.getUserMedia||navigator.webkitGetUserMedia||navigator.mozGetUserMedia;return t?new Promise(function(r,o){t.call(navigator,e,r,o)}):Promise.reject(new Error("getUserMedia is not implemented in this browser"))},e}(),p$2=Object.freeze({apiURL:Symbol("apiURL"),apiKey:Symbol("apiKey")}),TextRecognizer=function(){function e(){var t=arguments.length<=0||void 0===arguments[0]?"":arguments[0],r=arguments.length<=1||void 0===arguments[1]?"unk":arguments[1],o=arguments.length<=2||void 0===arguments[2]||arguments[2];classCallCheck(this,e),this[p$2.apiURL]="https://api.projectoxford.ai/vision/v1.0/ocr?"+`language=${r}&detectOrientation=${o}`,this[p$2.apiKey]=t}return e.prototype.recognize=function(e){var t=new Headers;t.append("Ocp-Apim-Subscription-Key",this[p$2.apiKey]);var r=new FormData;return r.append("image",e,"image.png"),fetch(this[p$2.apiURL],{method:"POST",headers:t,body:r}).then(function(e){return e.json()})},e.prototype.setAPIKey=function(e){this[p$2.apiKey]=e},e}(),p$4=Object.freeze({pitch:Symbol("pitch"),rate:Symbol("rate"),synthesis:Symbol("synthesis"),getPreferredVoice:Symbol("getPreferredVoice")}),SpeechSynthesizer=function(){function e(t,r){classCallCheck(this,e),this[p$4.pitch]=t,this[p$4.rate]=r,this[p$4.synthesis]=window.speechSynthesis||null,Object.seal(this)}return e.prototype.speak=function(){var e=arguments.length<=0||void 0===arguments[0]?"":arguments[0],t=arguments.length<=1||void 0===arguments[1]?"en":arguments[1],r=this[p$4.synthesis];if(e&&r){var o=new SpeechSynthesisUtterance(e),n=this[p$4.getPreferredVoice](t);n&&(o.voice=n),o.lang=t,o.pitch=this[p$4.pitch],o.rate=this[p$4.rate],r.speak(o)}},e.prototype[p$4.getPreferredVoice]=function(e){var t=this[p$4.synthesis].getVoices();if(!t.length)return null;var r=t.filter(function(t){return t.lang.startsWith(e)}),o=r.filter(function(e){return e.name.indexOf("Female")!==-1});return o.length?o[0]:r.length?r[0]:e.startsWith("en")?null:this[p$4.getPreferredVoice]("en")},e}(),LANGUAGES=new Map([["unk","Unknown"],["ar","Arabic"],["zh-Hans","Simplified Chinese"],["zh-Hant","Traditional Chinese"],["cs","Czech"],["da","Danish"],["nl","Dutch"],["en","English"],["fi","Finnish"],["fr","French"],["de","German"],["el","Greek"],["hu","Hungarian"],["it","Italian"],["ja","Japanese"],["ko","Korean"],["nb","Norwegian"],["pl","Polish"],["pt","Portuguese"],["ru","Russian"],["es","Spanish"],["sv","Swedish"],["tr","Turkish"]]),p$3=Object.freeze({synthesizer:Symbol("synthesizer")}),DEFAULT_VOICE_PITCH=.8,DEFAULT_VOICE_RATE=.9,TextReader=function(){function e(){var t=arguments.length<=0||void 0===arguments[0]?DEFAULT_VOICE_PITCH:arguments[0],r=arguments.length<=1||void 0===arguments[1]?DEFAULT_VOICE_RATE:arguments[1];classCallCheck(this,e),this[p$3.synthesizer]=new SpeechSynthesizer(t,r)}return e.prototype.read=function(e){var t=e.regions.length,r=this[p$3.synthesizer];if(0===t)return void r.speak("Sorry! I did not recognize any text.");1===t?r.speak("I see just one region of text."):r.speak(`I see ${t} regions of text.`);var o=e.language;o&&"unk"!==o?r.speak(`I think this is ${LANGUAGES.get(o)} language.`):r.speak("I can not recognize the language."),e.textAngle<5?r.speak("Text is almost perfectly aligned!"):r.speak("Text is skewed a bit");for(var n=0;n<t;n++){var i=e.regions[n];r.speak(`Region number ${n+1} consists of `+`${i.lines.length} lines of text.`);for(var a=0;a<i.lines.length;a++){var s=i.lines[a];r.speak(`Let me read words from the line number ${a+1}:`);var l=s.words.reduce(function(e,t){return`${e} ${t.text}`},"");r.speak(l,o)}}},e}(),LocalStorage=function(){function e(){classCallCheck(this,e)}return e.isSupported=function(){try{return!!self.localStorage&&Number.isInteger(self.localStorage.length)}catch(e){return!1}},e.prototype.getAll=function(e){var t=localStorage.getItem(e);return Promise.resolve(t?Array.from(new Map(JSON.parse(t)).values()):[])},e.prototype.getByKey=function(e,t){var r=localStorage.getItem(e),o=new Map(r?JSON.parse(r):[]);return o.has(t)?Promise.resolve(o.get(t)):Promise.reject(new Error(`There is no item (${t}) in the store (${e}).`))},e.prototype.set=function(e,t,r){var o=localStorage.getItem(e),n=new Map(o?JSON.parse(o):[]);return n.set(t,r),localStorage.setItem(e,JSON.stringify(Array.from(n.entries()))),Promise.resolve()},e.prototype.remove=function(e,t){var r=localStorage.getItem(e);if(r){var o=new Map(JSON.parse(r));o.delete(t),localStorage.setItem(e,JSON.stringify(Array.from(o.entries())))}return Promise.resolve()},e.prototype.clear=function(e){return localStorage.removeItem(e),Promise.resolve()},e.prototype.clearAll=function(){return localStorage.clear(),Promise.resolve()},e}(),p$5=Object.freeze({db:Symbol("db")}),InMemoryStorage=function(){function e(){classCallCheck(this,e),this[p$5.db]=new Map}return e.prototype.getAll=function(e){var t=this[p$5.db].get(e);return Promise.resolve(t?Array.from(t.values()):[])},e.prototype.getByKey=function(e,t){var r=this[p$5.db].get(e);return!r||r.has(t)?Promise.reject(new Error(`There is no item (${t}) in the store (${e}).`)):Promise.resolve(r.get(t))},e.prototype.set=function(e,t,r){var o=this[p$5.db].get(e);return o||this[p$5.db].set(e,o=new Map),o.set(t,r),Promise.resolve()},e.prototype.remove=function(e,t){var r=this[p$5.db].get(e);return r&&r.delete(t),Promise.resolve()},e.prototype.clear=function(e){var t=this[p$5.db].get(e);return t&&t.clear(),Promise.resolve()},e.prototype.clearAll=function(){return this[p$5.db].clear(),Promise.resolve()},e}(),p$6=Object.freeze({canvas:Symbol("canvas"),context:Symbol("context"),width:Symbol("width"),height:Symbol("height"),currentPoint:Symbol("currentPoint"),previousPoint:Symbol("previousPoint"),flag:Symbol("flag"),styleColor:Symbol("styleColor"),styleWidth:Symbol("styleWidth"),findXY:Symbol("findXY"),draw:Symbol("draw")}),Painter=function(){function e(t){var r=this;classCallCheck(this,e),this[p$6.canvas]=t,this[p$6.context]=t.getContext("2d"),this[p$6.width]=t.width,this[p$6.height]=t.height,this[p$6.styleColor]="#000",this[p$6.styleWidth]=2,this[p$6.currentPoint]={x:0,y:0},this[p$6.previousPoint]={x:0,y:0},this[p$6.flag]=!1,t.addEventListener("mousemove",function(e){return r[p$6.findXY]("move",e)}),t.addEventListener("mousedown",function(e){return r[p$6.findXY]("down",e)}),t.addEventListener("mouseup",function(e){return r[p$6.findXY]("up",e)}),t.addEventListener("mouseout",function(e){return r[p$6.findXY]("out",e)}),Object.seal(this)}return e.prototype.setStyle=function(e,t){if(!e)throw new Error("Color should a valid non-empty HEX color string!");if(!Number.isInteger(t)||t<0)throw Error("Width should a valid positive integer!");this[p$6.styleColor]=e,this[p$6.styleWidth]=t},e.prototype.clear=function(){this[p$6.context].clearRect(0,0,this[p$6.width],this[p$6.height])},e.prototype[p$6.findXY]=function(e,t){var r=t.offsetX,o=t.offsetY;if("down"===e){console.log(`e.offsetX: ${t.offsetX}, e.offsetY: ${t.offsetY}`),this[p$6.previousPoint]=this[p$6.currentPoint],this[p$6.currentPoint]={x:r,y:o},this[p$6.flag]=!0;var n=this[p$6.context];n.beginPath(),n.fillStyle=this[p$6.styleColor],n.fillRect(this[p$6.currentPoint].x,this[p$6.currentPoint].y,this[p$6.styleWidth],this[p$6.styleWidth]),n.closePath()}else"up"===e||"out"===e?this[p$6.flag]=!1:"move"===e&&this[p$6.flag]&&(this[p$6.previousPoint]=this[p$6.currentPoint],this[p$6.currentPoint]={x:r,y:o},this[p$6.draw]())},e.prototype[p$6.draw]=function(){var e=this[p$6.context];e.beginPath(),e.moveTo(this[p$6.previousPoint].x,this[p$6.previousPoint].y),e.lineTo(this[p$6.currentPoint].x,this[p$6.currentPoint].y),e.strokeStyle=this[p$6.styleColor],e.lineWidth=this[p$6.styleWidth],e.stroke(),e.closePath()},e}(),canPlayDefer=new Defer,videoManager=new VideoManager,textReader=new TextReader,textRecognizer=new TextRecognizer,storage=LocalStorage.isSupported()?new LocalStorage:new InMemoryStorage,samples=new Map,sampleIds=new Uint32Array(100);window.crypto.getRandomValues(sampleIds);var currentSampleIndex=0,apiKeyComponent=document.querySelector(".access__api-key");apiKeyComponent.addEventListener("change",function(){storage.set("access","api-key",apiKeyComponent.value),textRecognizer.setAPIKey(apiKeyComponent.value)}),storage.getByKey("access","api-key").catch(function(e){return console.warn("Could not retrieve API key from the storage",e),""}).then(function(e){apiKeyComponent.value=e,textRecognizer.setAPIKey(e)});var samplesListComponent=document.querySelector(".samples-list");samplesListComponent.addEventListener("click",function(e){if(!apiKeyComponent.value)return void alert("Please provide Microsoft Vision API key.");var t=e.target.dataset.sampleId;if("BUTTON"===e.target.nodeName.toUpperCase()&&t){var r=samples.get(Number.parseInt(t));e.target.dataset.isRecognize?textRecognizer.recognize(r.image).then(function(e){console.log("Success: %o",e),r.text=e,samples.set(r.id,r),textReader.read(e);var t=document.getElementById(r.id);t.classList.add("sample__container--recognized")}).catch(function(e){console.error("Failure %o",e)}):textReader.read(r.text)}});var videoPreviewComponent=document.querySelector(".video__preview"),videoShotPreviewRendererComponent=document.querySelector(".video__shot-preview-renderer"),context=videoShotPreviewRendererComponent.getContext("2d");context.fillStyle="#aaa",context.fillRect(0,0,videoShotPreviewRendererComponent.width,videoShotPreviewRendererComponent.height),videoManager.getMediaStream().then(function(e){videoPreviewComponent.src=window.URL.createObjectURL(e),videoPreviewComponent.addEventListener("loadedmetadata",function(){videoPreviewComponent.play();var e=320,t=videoPreviewComponent.videoHeight/(videoPreviewComponent.videoWidth/e);isNaN(t)&&(t=e/(4/3)),videoPreviewComponent.setAttribute("width",e),videoPreviewComponent.setAttribute("height",t),videoShotPreviewRendererComponent.setAttribute("width",e),videoShotPreviewRendererComponent.setAttribute("height",t),canPlayDefer.resolve({width:e,height:t})},!1)}).catch(function(e){canPlayDefer.reject(e)});var shotButton=document.querySelector(".video__shot-button");shotButton.setAttribute("disabled","disabled"),shotButton.addEventListener("click",function(){videoShotPreviewRendererComponent.getContext("2d").drawImage(videoPreviewComponent,0,0,Number(videoPreviewComponent.getAttribute("width")),Number(videoPreviewComponent.getAttribute("height"))),videoShotPreviewRendererComponent.toBlob(function(e){addSample(e)})}),canPlayDefer.promise.then(function(){shotButton.removeAttribute("disabled")});var urlProviderURL=document.querySelector(".sample-url-provider__url"),urlProviderSubmit=document.querySelector(".sample-url-provider__submit"),examplesList=document.querySelector(".sample-url-provider__examples");urlProviderSubmit.addEventListener("click",function(){var e=urlProviderURL.value;return e?void addSampleFromURL(e):void alert("Please provide a valid image URL!")}),examplesList.addEventListener("click",function(e){"LI"===e.target.nodeName.toUpperCase()&&addSampleFromURL(e.target.textContent.trim())});var localFileProviderPath=document.querySelector(".local-file-provider__path"),localFileProviderUpload=document.querySelector(".local-file-provider__upload");localFileProviderPath.addEventListener("change",function(e){for(var t of e.target.files)addSample(t)}),localFileProviderUpload.addEventListener("click",function(){localFileProviderPath.click()});var manualSampleCanvas=document.querySelector(".manual-sample-provider__canvas"),manualSampleColorPicker=document.querySelector(".manual-sample-provider__color-picker"),manualSampleWidth=document.querySelector(".manual-sample-provider__width"),manualSampleClearButton=document.querySelector(".manual-sample-provider__clear-button"),manualSampleSubmit=document.querySelector(".manual-sample-provider__submit"),painter=new Painter(manualSampleCanvas);manualSampleColorPicker.addEventListener("change",function(){painter.setStyle(manualSampleColorPicker.value,Number(manualSampleWidth.value))}),manualSampleWidth.addEventListener("change",function(){painter.setStyle(manualSampleColorPicker.value,Number(manualSampleWidth.value))}),manualSampleClearButton.addEventListener("click",function(){painter.clear()}),manualSampleSubmit.addEventListener("click",function(){manualSampleCanvas.toBlob(function(e){return addSample(e)})});

//# sourceMappingURL=app.js.map
