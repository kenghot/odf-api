import * as bwipjs from "bwip-js";

export const generateBarcode = (text: string) => {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: "code128", // Barcode type
        // text: "|0123456789 98654 23435", // Text to encode
        text,
        scale: 2, // 3x scaling factor
        height: 15, // Bar height, in millimeters
        includetext: true, // Show human-readable text
        textxalign: "center", // Always good to set this
        // scaleX: 5,
        // scaleY: 3,
      },
      (err, png: Buffer) => {
        if (err) return reject(err); // Decide how to handle the error

        const barcode = png.toString("base64");
        resolve(barcode);
        // `png` is a Buffer
        // png.length           : PNG file length
        // png.readUInt32BE(16) : PNG image width
        // png.readUInt32BE(20) : PNG image height
      }
    );
  });
};
