import { Entity, PrimaryColumn } from "typeorm";

@Entity("blacklists")
export class Blacklist {
  @PrimaryColumn({ length: 16 })
  uid: string;

  @PrimaryColumn({ length: 64 })
  clientId: string;
}
