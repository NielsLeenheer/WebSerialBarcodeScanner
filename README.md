# WebSerialBarcodeScanner

This is an library that allows you to use barcode scanners in serial com port mode using WebSerial. 

<br>

[![npm](https://img.shields.io/npm/v/@point-of-sale/webserial-barcode-scanner)](https://www.npmjs.com/@point-of-sale/webserial-barcode-scanner)
![GitHub License](https://img.shields.io/github/license/NielsLeenheer/WebSerialBarcodeScanner)


> This library is part of [@point-of-sale](https://point-of-sale.dev), a collection of libraries for interfacing browsers and Node with Point of Sale devices such as receipt printers, barcode scanners and customer facing displays.

<br>

### What does this library do?

By default most barcode scanners emulate a keyboard meaning all numbers and letters of a barcode will be individually 'typed' by the barscanner. This means you either have to focus an input field before scanning, or you have to use global keyboard events and build some algorithm that can seperate out digits from barcodes from other digits that are being typed on the keyboard. This is error-prone and slow, but most barcode scanners can also be used in serial mode.

Depending on the model and manufacturer you might first need to scan a special configuration barcode to enable this mode. See the documentation of your barcode scanner for more information.

This library uses WebSerial to connect to the scanner and receive the barcodes in one event.

<br>

### How to use it?

Load the `webserial-barcode-scanner.umd.js` file from the `dist` directory in the browser and instantiate a `WebSerialBarcodeScanner` object. 

```html
    <script src='webserial-barcode-scanner.umd.js'></script>

    <script>

        const barcodeScanner = new WebSerialBarcodeScanner();

    </script>
```

Or import the `webserial-barcode-scanner.esm.js` module:

```js
import WebSerialBarcodeScanner from 'webserial-barcode-scanner.esm.js';

const barcodeScanner = new WebSerialBarcodeScanner();
```

<br>

## Configuration

When you create the `WebSerialBarcodeScanner` object you can specify a number of options to help with the library with connecting to the device. 

### Serial port settings

Many devices that use serial ports can be configured to use different speeds and settings like databits, stopbits and parity and flow control. Sometimes these settings are hardcoded, sometimes they can be configured by DIP switches or other means. See the manual of your device for more information about how your device is configured and match the settings of your device with the properties below:

- `baudRate`<br>
   Number that indicates the speed, defaults to `9600`.
- `bufferSize`<br>
   Size of the read and write buffers, defaults to `255`.
- `dataBits`<br>
   Number of data bits per frame, either `7` or `8`, defaults to `8`.
- `flowControl`: <br>
   The flow control type, either `none`, or `hardware`, defaults to `none`.
- `parity`<br>
   The parity mode, either `none`, `even` or `odd`. The default value is `none`.
- `stopBits`<br>
   The number of stop bits at the end of the frame. Can be either `1` or `2` and defaults to `1`.

For example, to set a baud rate of `9600`:

```js
const barcodeScanner = new WebSerialBarcodeScanner({ 
    baudRate: 9600
});
```

### Symbology 

Usually the barcode scanner does not transmit any information about the symbology of the barcode, just the value of the barcode itself. However the library can make an educated guess based on the content. For example, if it starts with `http` it usually is a QR code. If it is 13 digits, it is usually an EAN13 code and 12 is usually a UPCA. 

By default this behaviour is turned off. If you want this library to guess the symbology you can turn it on:

```js
const barcodeScanner = new WebSerialBarcodeScanner({
    guessSymbology: true
});
```

<br>

## Connect to a scanner

The first time you have to manually connect to the barcode scanner by calling the `connect()` function. This function must be called as the result of an user action, for example clicking a button. You cannot call this function on page load.

```js
function handleConnectButtonClick() {
    barcodeScanner.connect();
}
```

Subsequent times you can simply call the `reconnect()` function. You have to provide an object with vendor id and product id of the previously connected barcode scanner in order to find the correct barcode scanner and connect to it again. If there is more than one device with the same vendor id and product id it won't be able to determine which of the two devices was previously used. So it will not reconnect. You can get the vendor id and product id by listening to the `connected` event and store it for later use. Unfortunately this is only available for USB connected devices. It is recommended to call this button on page load to prevent having to manually connect to a previously connected device.

```js
barcodeScanner.reconnect(lastUsedDevice);
```

If there are no barcode scanners connected that have been previously connected, this function will do nothing.

However, this library will actively look for new devices being connected. So if you connect a previously connected barcode scanner, it will immediately become available.

To find out when a barcode scanner is connected you can listen for the `connected` event using the `addEventListener()` function.

```js
barcodeScanner.addEventListener('connected', device => {
    console.log(`Connected to a device with vendorId: ${device.vendorId} and productId: ${device.productId}`);

    /* Store device for reconnecting */
    lastUsedDevice = device;
});
```

The callback of the `connected` event is passed an object with the following properties:

-   `type`<br>
    Type of the connection that is used, in this case it is always `serial`.
-   `vendorId`<br>
    In case of a USB barcode scanner, the USB vendor ID.
-   `productId`<br>
    In case of a USB barcode scanner, the USB product ID.

To find out when a barcode scanner is disconnected you can listen for the `disconnected` event using the `addEventListener()` function.

```js
barcodeScanner.addEventListener('disconnected', () => {
    console.log(`Disconnected`);
});
```

You can force the scanner to disconnect by calling the `disconnect()` function:

```js
barcodeScanner.disconnect();
```

<br>

## Events

Once connected you can use listen for the following events to receive data from the barcode scanner.

### Scanning barcodes

Whenever the libary detects a barcode, it will send out a `barcode` event that you can listen for.

```js
barcodeScanner.addEventListener('barcode', e => {
    console.log(`Found barcode ${e.value}`);
});
```

The callback is passed an object with the following properties:

-   `value`<br>
    The value of the barcode as a string

<br>

-----

<br>

This library has been created by Niels Leenheer under the [MIT license](LICENSE). Feel free to use it in your products. The  development of this library is sponsored by Salonhub.

<a href="https://salohub.nl"><img src="https://salonhub.nl/assets/images/salonhub.svg" width=140></a>
