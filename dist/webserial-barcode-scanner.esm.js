class t{constructor(t){this._events={}}on(t,e){this._events[t]=this._events[t]||[],this._events[t].push(e)}emit(t,...e){let n=this._events[t];n&&n.forEach((t=>{setTimeout((()=>t(...e)),0)}))}}class e{static detect(t){return t.startsWith("http")?"qrcode":t.match(/^[0-9]+$/)&&8==t.length?"ean8":t.match(/^[0-9]+$/)&&12==t.length?"upca":t.match(/^[0-9]+$/)&&13==t.length?"ean13":t.match(/^M[0-9]/)?"aztec-code":t.length>32?"qrcode":void 0}}class n{constructor(e){this._internal={emitter:new t,port:null,reader:null,options:Object.assign({baudRate:9600,bufferSize:255,dataBits:8,flowControl:"none",parity:"none",stopBits:1,guessSymbology:!1},e)},navigator.serial.addEventListener("disconnect",(t=>{this._internal.port==t.target&&this._internal.emitter.emit("disconnected")}))}async connect(){try{let t=await navigator.serial.requestPort();t&&await this.open(t)}catch(t){console.log("Could not connect! "+t)}}async reconnect(t){if(!t.vendorId||!t.productId)return;let e=(await navigator.serial.getPorts()).filter((e=>{let n=e.getInfo();return n.usbVendorId==t.vendorId&&n.usbProductId==t.productId}));1==e.length&&await this.open(e[0])}async disconnect(){this._internal.port&&(this._internal.reader.releaseLock(),await this._internal.port.close(),this._internal.port=null,this._internal.reader=null,this._internal.emitter.emit("disconnected"))}async open(t){this._internal.port=t,await this._internal.port.open(this._internal.options);let n=this._internal.port.getInfo();this._internal.emitter.emit("connected",{type:"serial",vendorId:n.usbVendorId||null,productId:n.usbProductId||null});let r="";for(;t.readable;){this._internal.reader=t.readable.getReader();try{for(;;){const{value:t,done:n}=await this._internal.reader.read();if(n){this._internal.reader.releaseLock();break}if(t)for(let n=0;n<t.length;n++){let i=t[n];if(13!==i)r+=String.fromCharCode(i);else{let t={value:r};if(this.options.guessSymbology){let n=e.detect(r);n&&(t.symbology=n,t.guess=!0)}this._internal.emitter.emit("barcode",t),r=""}}}}catch(t){r=""}}}addEventListener(t,e){this._internal.emitter.on(t,e)}}export{n as default};
//# sourceMappingURL=webserial-barcode-scanner.esm.js.map
