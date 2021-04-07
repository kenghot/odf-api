import { Column, Entity } from "typeorm";

import { BaseEntity } from "./inherited/BaseEntity";

@Entity("roles")
export class Role extends BaseEntity {
  @Column({ length: 128, unique: true })
  name: string;

  @Column({ length: 255, default: "" })
  description: string;

  @Column({ select: false, type: "simple-array", nullable: true })
  permissions: string[];

  @Column({ default: false })
  isPrivate: boolean;
}
