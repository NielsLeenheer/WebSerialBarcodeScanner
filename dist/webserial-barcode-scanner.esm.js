class t{constructor(t){this._events={}}on(t,e){this._events[t]=this._events[t]||[],this._events[t].push(e)}emit(t,...e){let n=this._events[t];n&&n.forEach((t=>{t(...e)}))}}class e{constructor(e){this._internal={emitter:new t,port:null,reader:null,options:Object.assign({baudRate:9600,bufferSize:255,dataBits:8,flowControl:"none",parity:"none",stopBits:1},e)},navigator.serial.addEventListener("disconnect",(t=>{this._internal.port==t.target&&this._internal.emitter.emit("disconnected")}))}async connect(){try{let t=await navigator.serial.requestPort();t&&await this.open(t)}catch(t){console.log("Could not connect! "+t)}}async reconnect(t){if(!t.vendorId||!t.productId)return;let e=(await navigator.serial.getPorts()).filter((e=>{let n=e.getInfo();return n.usbVendorId==t.vendorId&&n.usbProductId==t.productId}));1==e.length&&await this.open(e[0])}async disconnect(){this._internal.port&&(this._internal.reader.releaseLock(),await this._internal.port.close(),this._internal.port=null,this._internal.reader=null,this._internal.emitter.emit("disconnected"))}async open(t){this._internal.port=t,await this._internal.port.open(this._internal.options);let e=this._internal.port.getInfo();this._internal.emitter.emit("connected",{type:"serial",vendorId:e.usbVendorId||null,productId:e.usbProductId||null});let n="";for(;t.readable;){this._internal.reader=t.readable.getReader();try{for(;;){const{value:t,done:e}=await this._internal.reader.read();if(e){this._internal.reader.releaseLock();break}if(t)for(let e=0;e<t.length;e++){let r=t[e];13!==r?n+=String.fromCharCode(r):(this._internal.emitter.emit("barcode",{value:n}),n="")}}}catch(t){n=""}}}addEventListener(t,e){this._internal.emitter.on(t,e)}}export{e as default};
