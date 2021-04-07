import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

import { LocationProvince } from "./LocationProvince";

@Entity("location_districts")
export class LocationDistrict {
    @PrimaryColumn({
        length: 8,
        default: "",
        comment: "รหัสอำเภอจากกรมการปกครอง",
    })
    refCode: string;

    @Column({ length: 128, default: "" })
    thName: string;

    @Column({ length: 128, default: "" })
    enName: string;

    @ManyToOne(() => LocationProvince, { eager: true })
    @JoinColumn({ name: "provinceCode" })
    province: LocationProvince;
}
