import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("location_provinces")
export class LocationProvince {
    @PrimaryColumn({
        length: 8,
        default: "",
        comment: "รหัสจังหวัดจากกรมการปกครอง",
    })
    refCode: string;

    @Column({ length: 128, default: "" })
    thName: string;

    @Column({ length: 128, default: "" })
    enName: string;
}
