import { Column } from "typeorm";

export class EmbeddedAddressShort {
    @Column({ length: 128, default: "", comment: "เลขที่บ้าน" })
    houseNo: string;

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
}
