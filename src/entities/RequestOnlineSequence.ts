import { AfterLoad, Column, Entity, OneToMany } from "typeorm";

import { BaseEntity } from "./inherited/BaseEntity";
import { Organization } from "./Organization";

@Entity("request_online_sequencies")
export class RequestOnlineSequence extends BaseEntity {
  @Column({ default: 0 })
  sequenceNumber: number;

  @Column({ default: 4 })
  paddingSize: number;

  @Column({ length: 1, default: "0" })
  paddingChar: string;

  @Column({ length: 8 })
  prefixCode: string;

  @Column({ length: 8 })
  prefixYear: string;

  @OneToMany(() => Organization, (org) => org.requestOnlineSequence)
  organizations: Organization[];

  runningNumber: string;

  getRunningNumber() {
    return `${this.prefixCode}/${
      this.prefixYear
    }/${this.sequenceNumber
      .toString()
      .padStart(this.paddingSize, this.paddingChar)}`;
  }

  @AfterLoad()
  doSomethingAfterLoad() {
    this.runningNumber = this.getRunningNumber();
  }
}
