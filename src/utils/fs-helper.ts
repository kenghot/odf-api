import * as fs from "fs";
import * as path from "path";
import * as xlsx from "xlsx";

export const readFileStream = (filePath: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const fileStream = fs.createReadStream(path.join(process.cwd(), filePath));
    fileStream.once("end", () => {
      // create the final data Buffer from data chunks;
      const fileBuffer = Buffer.concat(chunks);
      return resolve(fileBuffer);
    });
    // An error occurred with the stream
    fileStream.once("error", (err) => {
      return reject(err);
    });
    fileStream.on("data", (chunk) => {
      chunks.push(chunk);
    });
  });
};

export const deleteFile = (filePath: string) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) return reject(err);
      return resolve(true);
    });
  });
};
export const readAndParseXlsx = (filePath: string, index) => {
  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const records = xlsx.utils.sheet_to_json(
    workbook.Sheets[workbook.SheetNames[index]],
    { raw: true, header: 1, defval: "" }
  );
  return records;
};
