class SymbologyDetector {
    
    static detect(barcode) {
        if (barcode.startsWith('http')) {
            return 'qrcode';
        }

        else if (barcode.match(/^[0-9]+$/) && barcode.length == 8) {
            return 'ean8';
        }

        else if (barcode.match(/^[0-9]+$/) && barcode.length == 12) {
            return 'upca';
        }

        else if (barcode.match(/^[0-9]+$/) && barcode.length == 13) {
            return 'ean13';
        }

        else if (barcode.match(/^M[0-9]/)) {
            return 'aztec-code';
        }

        else if (barcode.length > 32) {
            return 'qrcode';
        }
    }
}

export default SymbologyDetector;