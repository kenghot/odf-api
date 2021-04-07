import * as bcrypt from "bcrypt";
import { IsEmail, MinLength } from "class-validator";
import * as _ from "lodash";
import {
  AfterInsert,
  AfterUpdate,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne
} from "typeorm";

import { IsEqualToField, validateFields } from "../utils/class-validator";
import { AttachedFile } from "./AttachedFile";
import { BaseEntity } from "./inherited/BaseEntity";
import { Organization } from "./Organization";
import { Role } from "./Role";

@Entity("users")
export class User extends BaseEntity {
  @Column({ length: 128, unique: true })
  username: string;

  @Column({ length: 128 })
  @IsEmail()
  email: string;

  @Column({ select: false, nullable: true })
  @MinLength(8)
  @IsEqualToField("confirmPassword", {
    message: "password and confirmPassword does not match"
  })
  password: string;

  @MinLength(8)
  @IsEqualToField("password", {
    message: "password and confirmPassword does not match"
  })
  confirmPassword: string;

  @Column({
    length: 8,
    default: "",
    select: false
  })
  resetPasswordToken: string;

  @Column({
    type: "bigint",
    default: -1,
    select: false
  })
  resetPasswordTokenExpiration: number;

  @Column({ length: 128, default: "" })
  firstname: string;

  @Column({ length: 128, default: "" })
  lastname: string;

  @Column({ length: 64, default: "" })
  telephone: string;

  @Column({ default: 0 })
  signinCount: number;

  @Column({
    type: "date",
    select: false,
    nullable: true
    // default: () => "CURRENT_TIMESTAMP"
  })
  lastSigninDate: Date | string;

  @Column({ length: 64, select: false, default: "" })
  lastSigninIp: string;

  @Column({ select: false, default: false })
  registrationAgreement: boolean;

  @Column({ length: 128, default: "" })
  title: string;

  @Column({ default: false })
  active: boolean;

  @Column({ length: 128, default: "" })
  position: string;

  @Column({ length: 32, default: "" })
  posPinCode: string;

  // หน่วยงานที่สร้างคำร้อง
  @Column({ nullable: true, comment: "หน่วยงานที่สร้างคำร้อง" })
  organizationId: number;
  @ManyToOne(() => Organization)
  organization: Organization;

  @ManyToMany(() => Role)
  @JoinTable()
  roles: Role[];

  @ManyToMany(() => Organization)
  @JoinTable()
  responsibilityOrganizations: Organization[];

  attachedFiles: AttachedFile[];
  permissions: string[];
  responsibilityOrganizationIds: number[];
  activeString: string;

  get fullname() {
    return `${this.title}${this.firstname} ${this.lastname}`;
  }

  async comparePassword(candidatePassword: string) {
    const isMatch = bcrypt.compare(candidatePassword, this.password);
    this.deleteKeys();
    return isMatch;
  }

  private async hashPassword() {
    try {
      const hash = await bcrypt.hash(this.password, +process.env.SALT_ROUNDS);
      this.password = hash;
      this.confirmPassword = "";
      this.resetPasswordToken = "";
      this.resetPasswordTokenExpiration = -1;
    } catch (e) {
      throw e;
    }
  }

  private deleteKeys() {
    delete this.password;
    delete this.confirmPassword;
    delete this.resetPasswordToken;
    delete this.resetPasswordTokenExpiration;
  }

  getPermissions() {
    const permissions = this.roles.map((r) => {
      return r.permissions !== null ? r.permissions : "";
    });
    this.permissions = _.union([].concat(...permissions));
  }

  getResponsibilityOrganizationIds() {
    const ids = this.responsibilityOrganizations.map((ro) => {
      return ro.id;
    });
    this.responsibilityOrganizationIds = this.organization
      ? [...ids, this.organization.id]
      : [...ids];
  }

  @BeforeInsert()
  async doSomethingBeforeInsert() {
    try {
      await validateFields(this);
      await this.hashPassword();
    } catch (e) {
      throw e;
    }
  }

  @AfterInsert()
  doSomethingAfterInsert() {
    this.deleteKeys();
  }

  @BeforeUpdate()
  async doSomethingBeforeUpdate() {
    try {
      await validateFields(this, { skipMissingProperties: true });
      if (this.password) {
        await this.hashPassword();
      }
    } catch (e) {
      throw e;
    }
  }

  @AfterUpdate()
  doSomethingAfterUpdate() {
    this.deleteKeys();
  }
}
