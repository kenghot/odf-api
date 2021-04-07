import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

import { LocationDistrict } from "./LocationDistrict";
import { LocationProvince } from "./LocationProvince";

@Entity("location_sub_districts")
export class LocationSubDistrict {
    @PrimaryColumn({
        length: 8,
        default: "",
        comment: "รหัสตำบลจากกรมการปกครอง",
    })
    refCode: string;

    @Column({ length: 128, default: "" })
    thName: string;

    @Column({ length: 128, default: "" })
    enName: string;

    @ManyToOne(() => LocationDistrict, { eager: true })
    @JoinColumn({ name: "districtCode" })
    district: LocationDistrict;

    @ManyToOne(() => LocationProvince, { eager: true })
    @JoinColumn({ name: "provinceCode" })
    province: LocationProvince;

    @Column({ length: 5, default: "", comment: "รหัสไปรษณีย์" })
    zipcode: string;

    @Column({ length: 16, default: "", comment: "ละติจูด" })
    latitude: string;

    @Column({ length: 16, default: "", comment: "ลองจิจูด" })
    longitude: string;
}
