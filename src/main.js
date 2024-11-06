import EventEmitter from './event-emitter.js';
import { Aim, GS1, Detector } from '@point-of-sale/barcode-parser';

const END_OF_TRANSMISSION_TIMEOUT = 300;

class WebSerialBarcodeScanner {

    #options;
    #internal;
	
	constructor(options) {
		this.#options = Object.assign({
			baudRate:		9600,
			bufferSize:		255,
			dataBits:		8,
			flowControl:	'none',
			parity:			'none',
			stopBits:		1,
			guessSymbology: false,
			allowedSymbologies:	[],
		}, options);

		this.#internal = {
			emitter:    	new EventEmitter(),
			port:     		null,
			reader:     	null,
			timeout:    	null
		};

		navigator.serial.addEventListener('disconnect', event => {
			if (this.#internal.port == event.target) {
				this.#internal.emitter.emit('disconnected');
			}
		});
	}

	async connect() {
		try {
			let port = await navigator.serial.requestPort();
			
			if (port) {
				await this.open(port);
			}
		}
		catch(error) {
			console.log('Could not connect! ' + error);
		}
	}

	async reconnect(previousPort) {
		if (!previousPort.vendorId || !previousPort.productId) {
			return;
		}

		let ports = await navigator.serial.getPorts();

		let matches = ports.filter(port => {
			let info = port.getInfo();
			return info.usbVendorId == previousPort.vendorId && info.usbProductId == previousPort.productId;
		})

		if (matches.length == 1) {
			await this.open(matches[0]);
		}
	}

	async disconnect() {
		if (!this.#internal.port) {
			return;
		}

        this.#internal.reader.releaseLock();
        await this.#internal.port.close();

        this.#internal.port = null;
        this.#internal.reader = null;
		this.#internal.timeout = null;
		this.#internal.emitter.emit('disconnected');
	}

	async open(port) {
		this.#internal.port = port;

		await this.#internal.port.open(this.#options);

		let info = this.#internal.port.getInfo();

		this.#internal.emitter.emit('connected', {
			type:				'serial',
			vendorId: 			info.usbVendorId || null,
			productId: 			info.usbProductId || null
		});

		let buffer = [];

		while (port.readable) {
            this.#internal.reader = port.readable.getReader();

			try {
				while (true) {
                    const { value, done } = await this.#internal.reader.read();

					/* Cancel any pending timeouts */

					if (this.#internal.timeout) {
						clearTimeout(this.#internal.timeout);
						this.#internal.timeout = null;
					}

					if (done) {
                        this.#internal.reader.releaseLock();
						break;
					}

					if (value) {
						buffer.push(...value);
					}

					/* Set a timeout to parse the buffer if no new data is received */

					this.#internal.timeout = setTimeout(() => {
						this.#parse(buffer);
						buffer = [];
					}, END_OF_TRANSMISSION_TIMEOUT);
				}
			} catch (error) {
				console.log('error', error);
				buffer = [];
			}
		}	
	}

	#parse(buffer) {
		let result = {
			value: String.fromCharCode.apply(null, buffer),
			bytes: [
				new Uint8Array(buffer)
			]
		};

		/* If the last character of value is a new line, remove it */

		if (result.value.endsWith('\n')) {
			result.value = result.value.slice(0, -1);
		}

		if (result.value.endsWith('\r')) {
			result.value = result.value.slice(0, -1);
		}

		/* Check if we have and AIM identifier */

		if (result.value.startsWith(']')) {
			let aim = Aim.decode(result.value.substr(0, 3), result.value.substr(3));

			if (aim) {
				result.aim = result.value.substr(0, 3);
				result.symbology = aim;
			}

			result.value = result.value.substr(3);
		}

		/* Otherwise try to guess the symbology */

		else if (this.#options.guessSymbology) {
			let detected = Detector.detect(result.value);

			if (detected) {
				result = Object.assign(result, detected);
			}
		}

		/* Decode GS1 data */

		let parsed = GS1.parse(result);
		if (parsed) {
			result.data = parsed;
		}
		
		/* Emit the barcode event */

		if (this.#options.allowedSymbologies.length === 0 ||
			this.#options.allowedSymbologies.includes(result.symbology)) 
		{
			this.#internal.emitter.emit('barcode', result);
		}
	}

	addEventListener(n, f) {
		this.#internal.emitter.on(n, f);
	}
}

export default WebSerialBarcodeScanner;