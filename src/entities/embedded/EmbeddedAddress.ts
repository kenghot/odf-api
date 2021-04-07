import { Column, OneToOne } from "typeorm";
import { AttachedFile } from "../AttachedFile";

export class EmbeddedAddress {
  @Column({ length: 128, default: "", comment: "เลขที่บ้าน" })
  houseNo: string;

  @Column({ length: 128, default: "", comment: "ชื่ออาคาร หมู่บ้าน" })
  buildingName: string;

  @Column({ length: 128, default: "", comment: "ห้อง" })
  roomNo: string;

  @Column({ length: 128, default: "", comment: "ชั้น" })
  floor: string;

  @Column({ length: 128, default: "", comment: "หมู่ที่" })
  hmoo: string;

  @Column({ length: 128, default: "", comment: "ซอย" })
  soi: string;

  @Column({ length: 128, default: "", comment: "ถนน" })
  street: string;

  @Column({ length: 8, default: "", comment: "รหัสตำบล" })
  subDistrictCode: string;

  @Column({ length: 128, default: "", comment: "ตำบล" })
  subDistrict: string;

  @Column({ length: 8, default: "", comment: "รหัสอำเภอ" })
  districtCode: string;

  @Column({ length: 128, default: "", comment: "อำเภอ" })
  district: string;

  @Column({ length: 8, default: "", comment: "รหัสจังหวัด" })
  provinceCode: string;

  @Column({ length: 128, default: "", comment: "จังหวัด" })
  province: string;

  @Column({ length: 8, default: "", comment: "รหัสไปรษณีย์" })
  zipcode: string;

  @Column({ length: 128, default: "", comment: "ละติจูด" })
  latitude: string;

  @Column({ length: 128, default: "", comment: "ลองจิจูด" })
  longitude: string;

  attachedFiles: AttachedFile[];

  getAddress() {
    const prefixHouseNo = "บ้านเลขที่";
    const prefixBuildingName = "หมู่บ้าน/อาคาร";
    const prefixRoomNo = "เลขที่ห้อง";
    const prefixFloor = "ชั้น";
    const prefixHmoo = "หมู่ที่";
    const prefixSoi = "ซอย";
    const prefixStreet = "ถนน";
    const prefixSubdistrict = "ตำบล/แขวง";
    const prefixDistrict = "อำเภอ/เขต";
    const prefixProvince = "จังหวัด";

    const houseNo = this.houseNo ? `${prefixHouseNo} ${this.houseNo} ` : "";
    const buildingName = this.buildingName
      ? `${prefixBuildingName} ${this.buildingName} `
      : "";
    const roomNo = this.roomNo ? `${prefixRoomNo} ${this.roomNo} ` : "";
    const floor = this.floor ? `${prefixFloor} ${this.floor} ` : "";
    const hmoo = this.hmoo ? `${prefixHmoo} ${this.hmoo} ` : "";
    const soi = this.soi ? `${prefixSoi} ${this.soi} ` : "";
    const street = this.street ? `${prefixStreet} ${this.street} ` : "";
    const subDistrict = this.subDistrict
      ? `${prefixSubdistrict} ${this.subDistrict} `
      : "";
    const district = this.district ? `${prefixDistrict} ${this.district} ` : "";
    const province = this.province ? `${prefixProvince} ${this.province}` : "";
    const zipcode = this.zipcode ? ` ${this.zipcode}` : "";

    return `${houseNo}${buildingName}${roomNo}${floor}${hmoo}${soi}${street}${subDistrict}${district}${province}${zipcode}`;
  }

  getAddress1() {
    const houseNo = this.houseNo ? `${this.houseNo} ` : "";
    const buildingName = this.buildingName ? `${this.buildingName} ` : "";
    const roomNo = this.roomNo ? `${this.roomNo} ` : "";
    const floor = this.floor ? `${this.floor} ` : "";
    const hmoo = this.hmoo ? `${this.hmoo} ` : "";
    const soi = this.soi ? `${this.soi} ` : "";
    const street = this.street ? `${this.street} ` : "";

    return `${houseNo}${buildingName}${roomNo}${floor}${hmoo}${soi}${street}`;
  }

  getAddress2() {
    const subDistrict = this.subDistrict ? `${this.subDistrict} ` : "";
    const district = this.district ? `${this.district} ` : "";

    return `${subDistrict}${district}`;
  }

  getAddress3() {
    const province = this.province ? `${this.province}` : "";
    const zipcode = this.zipcode ? ` ${this.zipcode}` : "";

    return `${province}${zipcode}`;
  }
}
