import EventEmitter from './event-emitter.js';

class WebSerialBarcodeScanner {

	constructor(options) {
		this._internal = {
			emitter:    new EventEmitter(),
			port:     	null,
			options:	Object.assign({
				baudRate:		9600,
				bufferSize:		255,
				dataBits:		8,
				flowControl:	'none',
				parity:			'none',
				stopBits:		1
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

		await this._internal.port.close();

		this._internal.port = null;

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
			const reader = port.readable.getReader();

			try {
				while (true) {
					const { value, done } = await reader.read();

					if (done) {
						reader.releaseLock();
						break;
					}
					if (value) {

						for (let i = 0; i < value.length; i++) {
							let character = value[i];

							if (character !== 13) {
								buffer += String.fromCharCode(character);
							}
							else {
								this._internal.emitter.emit('barcode', {
									value:  buffer
								});

								buffer = '';
							}
						}
					}
				}
			} catch (error) {
				buffer = '';

				console.log(error);
			}
		}	
	}

	addEventListener(n, f) {
		this._internal.emitter.on(n, f);
	}
}

export default WebSerialBarcodeScanner;