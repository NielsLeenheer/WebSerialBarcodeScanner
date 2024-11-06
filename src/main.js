import EventEmitter from './event-emitter.js';
import { Aim, GS1, Detector } from '@point-of-sale/barcode-parser';

class WebSerialBarcodeScanner {

	constructor(options) {
		this._internal = {
			emitter:    new EventEmitter(),
			port:     	null,
			reader:     null,
			options:	Object.assign({
				baudRate:		9600,
				bufferSize:		255,
				dataBits:		8,
				flowControl:	'none',
				parity:			'none',
				stopBits:		1,
				guessSymbology: false,
			}, options)
		};

		navigator.serial.addEventListener('disconnect', event => {
			if (this._internal.port == event.target) {
				this._internal.emitter.emit('disconnected');
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
		if (!this._internal.port) {
			return;
		}

        this._internal.reader.releaseLock();
        await this._internal.port.close();

        this._internal.port = null;
        this._internal.reader = null;

		this._internal.emitter.emit('disconnected');
	}

	async open(port) {
		this._internal.port = port;

		await this._internal.port.open(this._internal.options);

		let info = this._internal.port.getInfo();

		this._internal.emitter.emit('connected', {
			type:				'serial',
			vendorId: 			info.usbVendorId || null,
			productId: 			info.usbProductId || null
		});

		let buffer = '';

		while (port.readable) {
            this._internal.reader = port.readable.getReader();

			try {
				while (true) {
                    const { value, done } = await this._internal.reader.read();

					if (done) {
                        this._internal.reader.releaseLock();
						break;
					}
					if (value) {
						for (let i = 0; i < value.length; i++) {
							let character = value[i];

							if (character !== 13) {
								buffer += String.fromCharCode(character);
							}
							else {
								let data = {
									value: buffer
								};

								/* Try to guess the symbology */

								if (this.options.guessSymbology) {
									let symbology = SymbologyDetector.detect(buffer);
					
									if (symbology) {
										data.symbology = symbology;
										data.guess = true;
									}
								}

								this._internal.emitter.emit('barcode', data);

								buffer = '';
							}
						}
					}
				}
			} catch (error) {
				buffer = '';
			}
		}	
	}

	addEventListener(n, f) {
		this._internal.emitter.on(n, f);
	}
}

export default WebSerialBarcodeScanner;